import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  normalizeText,
  normalizeCity,
  normalizeSpecialty,
  KNOWN_SPECIALTIES,
  SPECIALTY_ALIASES,
  type RawProvider,
} from "@/lib/city-aliases";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type InsuranceType = "gkv" | "pkv";

type ParsedQuery = {
  specialty: string | null;
  city: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// English DB values for healthcare_providers (OSM source)
// hospitals_db uses German, healthcare_providers uses English
// ─────────────────────────────────────────────────────────────────────────────

const GERMAN_TO_ENGLISH: Record<string, string[]> = {
  "allgemeinmedizin":  ["general medicine", "general"],
  "innere medizin":    ["internal"],
  "gynäkologie":       ["gynaecology", "gynecology"],
  "orthopädie":        ["orthopaedics", "orthopedics"],
  "pädiatrie":         ["paediatrics", "pediatrics"],
  "augenheilkunde":    ["ophthalmology"],
  "psychiatrie":       ["psychiatry"],
  "hno":               ["otolaryngology", "ear nose throat"],
  "dermatologie":      ["dermatology"],
  "neurologie":        ["neurology"],
  "kardiologie":       ["cardiology"],
  "urologie":          ["urology"],
  "gastroenterologie": ["gastroenterology"],
  "pneumologie":       ["pulmonology"],
  "rheumatologie":     ["rheumatology"],
  "nephrologie":       ["nephrology"],
  "hämatologie":       ["hematology", "haematology"],
  "onkologie":         ["oncology"],
  "radiologie":        ["radiology"],
  "anästhesiologie":   ["anaesthesiology", "anesthesiology"],
  "endokrinologie":    ["endocrinology"],
  "geriatrie":         ["geriatrics"],
  "chirurgie":         ["surgery"],
  "geburtshilfe":      ["obstetrics"],
  "allergologie":      ["allergy"],
  "notaufnahme":       ["emergency medicine", "emergency"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function insuranceType(insurance: string): InsuranceType {
  return insurance === "Private Insurance" ? "pkv" : "gkv";
}

function escapePostgrestLike(value: string): string {
  return value.replace(/[%_,]/g, "\\$&");
}

function specialtyMatches(provider: RawProvider, specialty: string): boolean {
  const specLower   = normalizeText(specialty);
  const germanTerm  = SPECIALTY_ALIASES[specLower] || specLower;
  const englishTerms = GERMAN_TO_ENGLISH[germanTerm] || [specLower];
  const allTerms    = Array.from(new Set([germanTerm, specLower, ...englishTerms]));

  const providerSpecialties = Array.isArray(provider.specialties)
    ? provider.specialties
    : [];

  return providerSpecialties.some((s: string) =>
    allTerms.some((term) => normalizeText(s).includes(term))
  );
}

function parseSearchQuery(q: string): ParsedQuery {
  const input = normalizeText(q);
  if (!input) return { specialty: null, city: null };

  let matchedSpecialty: string | null = null;
  let remainder = input;

  for (const spec of KNOWN_SPECIALTIES) {
    const escaped = spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
    if (regex.test(remainder)) {
      matchedSpecialty = normalizeSpecialty(spec);
      remainder = remainder.replace(regex, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const city = remainder ? normalizeCity(remainder) : null;
  return { specialty: matchedSpecialty, city };
}

export function mapProviders(data: RawProvider[]) {
  return data.map((p: RawProvider) => {
    const isHospital = p.amenity === "hospital";

    const occupancy: number =
      typeof p.load_score === "number"
        ? Math.min(95, Math.round(p.load_score))
        : p.annual_cases
          ? Math.min(95, Math.round(p.annual_cases / 300))
          : 50;

    const expertise: number =
      typeof p.nursing_ratio === "number"
        ? Math.min(100, Math.round(p.nursing_ratio))
        : 60;

    const ambulatory: number = isHospital ? 40 : 80;
    const wait: number       = isHospital ? 45 : 20;

    return {
      id: p.id,
      name: p.name || "Unknown Provider",
      city: p.addr_city,
      state: p.state,
      zip: p.addr_postcode,
      lat: p.lat,
      lon: p.lon,
      providerType: isHospital ? "Hospital" : "Clinic",
      specialties: Array.isArray(p.specialties)
        ? p.specialties
        : p.specialties
          ? [p.specialties]
          : [],
      telemedicineAvailable: false,
      openingHours: p.opening_hours || "08:00 - 18:00",
      referralRequired: isHospital,
      insuranceAccepted: p.accepts_gkv
        ? ["AOK", "TK", "Barmer", "DAK", "IKK", "BKK"]
        : ["Private Insurance"],
      ambulatory,
      expertise,
      occupancy,
      wait,
      erLoad:
        p.er_load ??
        (occupancy > 85 ? "Crowded" : occupancy > 60 ? "Moderate" : "Normal"),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode           = searchParams.get("mode");
  const lat            = searchParams.get("lat");
  const lon            = searchParams.get("lon");
  const q              = searchParams.get("q") || "";
  const postcode       = searchParams.get("postcode");
  const amenity        = searchParams.get("amenity");
  const insurance      = searchParams.get("insurance") || "AOK";
  const specialtyParam = searchParams.get("specialty") || "";

  const isGkv = insuranceType(insurance) === "gkv";
  const normalizedSpecialtyParam = normalizeSpecialty(specialtyParam || null);

  // ── NEARBY MODE ────────────────────────────────────────────────────────────
  if (mode === "nearby" && lat && lon) {
    const isSpecialistSearch = !!normalizedSpecialtyParam;
    const radius = isSpecialistSearch ? 50000 : 25000;

    const { data, error } = await supabase.rpc("nearby_unified", {
      user_lat: parseFloat(lat),
      user_lon: parseFloat(lon),
      radius_m: radius,
      filter_amenity: amenity || null,
      filter_gkv: isGkv,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!Array.isArray(data)) return NextResponse.json([]);

    const providers = data as RawProvider[];

    if (normalizedSpecialtyParam) {
      const spec      = normalizedSpecialtyParam;
      const matched   = providers.filter((p) => specialtyMatches(p, spec));
      const unmatched = providers.filter((p) => !specialtyMatches(p, spec));
      return NextResponse.json(
        matched.length > 0
          ? [...matched, ...unmatched].slice(0, 50)
          : unmatched.slice(0, 50)
      );
    }

    return NextResponse.json(providers.slice(0, 50));
  }

  // ── SEARCH MODE ────────────────────────────────────────────────────────────
  if (mode === "search" && (q || normalizedSpecialtyParam)) {
    const parsed = parseSearchQuery(q);
    const resolvedSpecialty = parsed.specialty || normalizedSpecialtyParam || null;

    let query = supabase
      .from("unified_providers")
      .select(
        "id, name, amenity, addr_street, addr_city, addr_postcode, state, phone, website, opening_hours, lat, lon, specialties, nursing_ratio, annual_cases, accepts_gkv, accepts_pkv, provider_source, load_score, er_load"
      )
      .limit(200);

    if (isGkv) {
      query = query.eq("accepts_gkv", true);
    } else {
      query = query.eq("accepts_pkv", true);
    }

    if (amenity) {
      query = query.eq("amenity", amenity);
    }

    if (parsed.city) {
      const cityTerm = parsed.city.trim();
      if (/^\d{5}$/.test(cityTerm)) {
        query = query.eq("addr_postcode", cityTerm);
      } else {
        const safeCityTerm = escapePostgrestLike(cityTerm);
        query = query.or(
          `addr_city.ilike.%${safeCityTerm}%,name.ilike.%${safeCityTerm}%`
        );
      }
    } else if (!resolvedSpecialty) {
      return NextResponse.json([]);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!Array.isArray(data)) return NextResponse.json([]);

    const providers = data as RawProvider[];

    if (resolvedSpecialty) {
      const spec      = resolvedSpecialty;
      const matched   = providers.filter((p) => specialtyMatches(p, spec));
      const unmatched = providers.filter((p) => !specialtyMatches(p, spec));
      return NextResponse.json(
        matched.length > 0
          ? [...matched, ...unmatched].slice(0, 50)
          : providers.slice(0, 50)
      );
    }

    return NextResponse.json(providers.slice(0, 50));
  }

  // ── REGION MODE ────────────────────────────────────────────────────────────
  if (mode === "region" && postcode) {
    const { data, error } = await supabase
      .from("unified_providers")
      .select(
        "id, name, amenity, addr_street, addr_city, addr_postcode, state, phone, website, opening_hours, lat, lon, specialties, nursing_ratio, annual_cases, accepts_gkv, accepts_pkv, provider_source, load_score, er_load"
      )
      .eq("addr_postcode", postcode)
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  return NextResponse.json([]);
}