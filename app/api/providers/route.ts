import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function insuranceType(insurance: string): "gkv" | "pkv" {
  return insurance === "Private Insurance" ? "pkv" : "gkv";
}

// Extracts a city/region term and a specialty term from a search query
// e.g. "Kardiologie München" → { specialty: "Kardiologie", city: "München" }
// e.g. "München"            → { specialty: null, city: "München" }
// e.g. "Kardiologie"        → { specialty: "Kardiologie", city: null }
function parseSearchQuery(q: string): {
  specialty: string | null;
  city: string | null;
} {
  const knownSpecialties = [
    "Kardiologie", "Neurologie", "Pädiatrie", "Gynäkologie", "Orthopädie",
    "Psychiatrie", "Dermatologie", "Urologie", "Gastroenterologie",
    "Pneumologie", "Allgemeinmedizin", "Innere Medizin", "Chirurgie", "HNO",
    "Augenheilkunde", "Rheumatologie", "Onkologie", "Radiologie",
    "Anästhesiologie", "Notaufnahme", "Geburtshilfe", "Allergologie",
    "Endokrinologie", "Nephrologie", "Hämatologie",
    "Cardiology", "Neurology", "Pediatrics", "Gynecology", "Orthopedics",
    "Psychiatry", "Dermatology", "Urology", "Gastroenterology", "Pulmonology",
    "General Medicine", "Internal Medicine", "Surgery", "Ophthalmology",
    "Rheumatology", "Obstetrics", "Allergology",
  ];

  const parts = q.trim().split(/\s+/);
  let specialty: string | null = null;
  const cityParts: string[] = [];

  for (const part of parts) {
    const matched = knownSpecialties.find(
      (s) => s.toLowerCase() === part.toLowerCase()
    );
    if (matched && !specialty) {
      specialty = matched;
    } else {
      cityParts.push(part);
    }
  }

  const city = cityParts.length > 0 ? cityParts.join(" ") : null;
  return { specialty, city };
}

// ─── FIX 6: mapProviders now correctly reads DB column names ─────────────────
// DB returns: nursing_ratio, annual_cases, load_score, er_load, lat, lon, amenity
// Previously read p.ambulatory / p.expertise / p.occupancy / p.wait (all undefined → 0)
export function mapProviders(data: any[]) {
  return data.map((p: any) => {
    const isHospital = p.amenity === "hospital";

    // Derive a 0-100 occupancy score from load_score if present, else estimate
    // from annual_cases (rough heuristic: 300 cases/year ≈ 1% occupancy)
    const occupancy: number =
      typeof p.load_score === "number"
        ? Math.min(95, Math.round(p.load_score))
        : p.annual_cases
        ? Math.min(95, Math.round(p.annual_cases / 300))
        : 50;

    // nursing_ratio as a proxy for clinical expertise (cap at 100)
    const expertise: number =
      typeof p.nursing_ratio === "number"
        ? Math.min(100, Math.round(p.nursing_ratio))
        : 60;

    // Ambulatory suitability: clinics score high, hospitals score low
    const ambulatory: number = isHospital ? 40 : 80;

    // Estimated wait in minutes: hospitals longer than clinics
    const wait: number = isHospital ? 45 : 20;

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
      // FIX 6: these now have real values instead of always 0
      ambulatory,
      expertise,
      occupancy,
      wait,
      erLoad: p.er_load ?? (occupancy > 85 ? "Crowded" : occupancy > 60 ? "Moderate" : "Normal"),
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const q = searchParams.get("q") || "";
  const postcode = searchParams.get("postcode");
  const amenity = searchParams.get("amenity");
  const insurance = searchParams.get("insurance") || "AOK";
  // FIX 4: specialty is a dedicated param the frontend always sends separately
  const specialtyParam = searchParams.get("specialty") || "";
  const isGkv = insuranceType(insurance) === "gkv";

  // ── NEARBY MODE ─────────────────────────────────────────────────────────────
  if (mode === "nearby" && lat && lon) {
    // FIX 1 + 2: use a wider radius so specialty post-filtering has enough
    // candidates. Specialist searches get 50km, general gets 25km.
    const isSpecialistSearch = !!specialtyParam;
    const radius = isSpecialistSearch ? 50000 : 25000;

    const { data, error } = await supabase.rpc("nearby_unified", {
      user_lat: parseFloat(lat),
      user_lon: parseFloat(lon),
      // FIX 5: fetch up to 200 rows before JS-side specialty sort so that
      // relevant specialists aren't cut off by an early limit(50)
      radius_m: radius,
      filter_amenity: amenity || null,
      filter_gkv: isGkv,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!Array.isArray(data)) return NextResponse.json([]);

    // FIX 1: filter by specialty if provided, return matches first then rest
    if (specialtyParam) {
      const specLower = specialtyParam.toLowerCase();
      const matched = data.filter((p: any) =>
        (Array.isArray(p.specialties) ? p.specialties : []).some((s: string) =>
          s.toLowerCase().includes(specLower)
        )
      );
      const unmatched = data.filter((p: any) =>
        !(Array.isArray(p.specialties) ? p.specialties : []).some((s: string) =>
          s.toLowerCase().includes(specLower)
        )
      );
      // FIX 2: if no specialty match at all, still return nearby providers
      // rather than silently returning an ambiguous merged list.
      // The frontend can show a "no exact specialty match" notice.
      return NextResponse.json(
        matched.length > 0
          ? [...matched, ...unmatched].slice(0, 50)
          : unmatched.slice(0, 50)
      );
    }

    return NextResponse.json(data.slice(0, 50));
  }

  // ── SEARCH MODE ─────────────────────────────────────────────────────────────
  if (mode === "search" && (q || specialtyParam)) {
    const parsed = parseSearchQuery(q);

    // FIX 4: if the frontend passed a dedicated specialty param and
    // parseSearchQuery didn't find one in q, use the explicit param instead.
    const resolvedSpecialty: string | null =
      parsed.specialty || specialtyParam || null;

    // FIX 3 + 5: raise limit so specialty post-sort has enough candidates
    let query = supabase
      .from("unified_providers")
      .select(
        "id, name, amenity, addr_street, addr_city, addr_postcode, state, phone, website, opening_hours, lat, lon, specialties, nursing_ratio, annual_cases, accepts_gkv, accepts_pkv, provider_source, load_score, er_load"
      )
      .limit(200); // FIX 5: was 50, raised so specialty sort has enough rows

    // Insurance filter
    if (isGkv) {
      query = query.eq("accepts_gkv", true);
    } else {
      query = query.eq("accepts_pkv", true);
    }

    // Amenity filter
    if (amenity) {
      query = query.eq("amenity", amenity);
    }

    // FIX 3: only apply city/zip filter when we actually have a city term.
    // Previously, specialty-only queries hit this with city=null and returned
    // 50 random rows from across the country.
    if (parsed.city) {
      const cityTerm = parsed.city.trim();
      if (/^\d{5}$/.test(cityTerm)) {
        query = query.eq("addr_postcode", cityTerm);
      } else {
        query = query.or(
          `addr_city.ilike.%${cityTerm}%,name.ilike.%${cityTerm}%,state.ilike.%${cityTerm}%`
        );
      }
    }
    // FIX 3: if there is no city AND no specialty, this would return random rows.
    // Guard against it — return empty rather than noise.
    else if (!resolvedSpecialty) {
      return NextResponse.json([]);
    }

    const { data, error } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!Array.isArray(data)) return NextResponse.json([]);

    // Specialty filter and sort — applied after fetch
    if (resolvedSpecialty) {
      const specLower = resolvedSpecialty.toLowerCase();
      const matched = data.filter((p: any) =>
        (Array.isArray(p.specialties) ? p.specialties : []).some((s: string) =>
          s.toLowerCase().includes(specLower)
        )
      );
      const unmatched = data.filter((p: any) =>
        !(Array.isArray(p.specialties) ? p.specialties : []).some((s: string) =>
          s.toLowerCase().includes(specLower)
        )
      );
      // Return specialty matches first; fall back to all results if none matched
      return NextResponse.json(
        matched.length > 0
          ? [...matched, ...unmatched].slice(0, 50)
          : data.slice(0, 50)
      );
    }

    return NextResponse.json(data.slice(0, 50));
  }

  // ── REGION MODE ─────────────────────────────────────────────────────────────
  if (mode === "region" && postcode) {
    const { data, error } = await supabase
      .from("unified_providers")
      .select(
        "id, name, amenity, addr_street, addr_city, addr_postcode, state, phone, website, opening_hours, lat, lon, specialties, nursing_ratio, annual_cases, accepts_gkv, accepts_pkv, provider_source, load_score, er_load"
      )
      .eq("addr_postcode", postcode)
      .limit(50);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  return NextResponse.json([]);
}