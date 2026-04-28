"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  Activity,
  Ambulance,
  AlertOctagon,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Video,
} from "./icons";
import {
  type InsuranceFund,
  type Sex,
  type Symptom,
  type GermanCareContext,
} from "@/lib/triage";
import { getGermanCareContext } from "@/lib/careContext";
import { triageEngine } from "@/lib/triage-engine";
import { supabase } from "@/lib/supabase";
import { encryptFields } from "@/lib/crypto";
import { createTranslator, isRTL, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Provider = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  zip?: string;
  providerType?: string;
  ambulatory?: number;
  expertise?: number;
  occupancy?: number;
  wait?: number;
  telemedicineAvailable?: boolean;
  specialties?: string[];
  referralRequired?: boolean;
  insuranceAccepted?: string[];
  openingHours?: string;
  erLoad?: string;
  phone?: string;
  website?: string;
};
type ChatMessage = { role: "bot" | "user"; text: string };

type RankedProvider = Provider & {
  providerType: string;
  telemedicineAvailable: boolean;
  openingHours: string;
  referralRequired: boolean;
  insuranceAccepted: string[];
  erLoad: string;
  availableBeds: number;
  specialistAvail: string;
  match: number;
};

type BookingModal = { provider: RankedProvider; type: string } | null;

const ALL_LANGUAGES: { label: string; locale: Locale }[] = [
  { label: "English", locale: "en" },
  { label: "Deutsch", locale: "de" },
];

const CLINICIAN_LANGUAGES: { label: string; locale: Locale }[] = [
  { label: "English", locale: "en" },
  { label: "Deutsch", locale: "de" },
];

const insuranceFunds: InsuranceFund[] = [
  "AOK",
  "TK",
  "Barmer",
  "DAK",
  "IKK",
  "BKK",
  "Private Insurance",
];
const sexes: Sex[] = ["female", "male", "diverse"];

const SYMPTOM_GROUPS: { categoryKey: string; symptoms: Symptom[] }[] = [
  {
    categoryKey: "category.cardiovascular",
    symptoms: [
      "Chest pain",
      "Palpitations",
      "Syncope / collapse",
      "Leg swelling",
      "Hypertensive crisis",
    ],
  },
  {
    categoryKey: "category.respiratory",
    symptoms: [
      "Shortness of breath",
      "Cough (acute)",
      "Cough (chronic)",
      "Haemoptysis",
      "Stridor / wheeze",
    ],
  },
  {
    categoryKey: "category.neurological",
    symptoms: [
      "Headache",
      "Dizziness / vertigo",
      "Seizure",
      "Stroke symptoms",
      "Weakness / paralysis",
      "Tremor",
      "Memory problems",
      "Loss of consciousness",
    ],
  },
  {
    categoryKey: "category.gastrointestinal",
    symptoms: [
      "Abdominal pain",
      "Nausea / vomiting",
      "Diarrhoea",
      "Constipation",
      "Rectal bleeding",
      "Jaundice",
      "Dysphagia",
    ],
  },
  {
    categoryKey: "category.musculoskeletal",
    symptoms: [
      "Back pain",
      "Joint pain",
      "Limb injury",
      "Neck pain",
      "Hip pain",
    ],
  },
  {
    categoryKey: "category.dermatological",
    symptoms: [
      "Skin rash",
      "Wound / laceration",
      "Burn",
      "Allergic reaction",
      "Insect bite",
    ],
  },
  {
    categoryKey: "category.ent",
    symptoms: [
      "Ear pain",
      "Sore throat",
      "Nosebleed",
      "Hearing loss",
      "Eye pain",
      "Eye redness / discharge",
    ],
  },
  {
    categoryKey: "category.urological",
    symptoms: ["Urinary symptoms", "Haematuria", "Flank pain", "Scrotal pain"],
  },
  {
    categoryKey: "category.gynaecological",
    symptoms: [
      "Pelvic pain",
      "Vaginal bleeding",
      "Pregnancy concern",
      "Breast problem",
      "Vaginal discharge",
    ],
  },
  {
    categoryKey: "category.paediatric",
    symptoms: [
      "Child fever",
      "Child rash",
      "Child vomiting",
      "Child crying / inconsolable",
      "Child injury",
    ],
  },
  {
    categoryKey: "category.mentalHealth",
    symptoms: [
      "Anxiety / panic",
      "Depression",
      "Self-harm",
      "Psychosis",
      "Substance intoxication",
      "Suicidal ideation",
    ],
  },
  {
    categoryKey: "category.general",
    symptoms: [
      "Fever",
      "Fatigue",
      "Weight loss",
      "Night sweats",
      "Lymph node swelling",
      "Anaphylaxis",
    ],
  },
  {
    categoryKey: "category.administrative",
    symptoms: [
      "Medication refill",
      "Follow-up question",
      "Sick note (AU)",
      "Vaccination",
      "Lab results",
    ],
  },
];

const CHART_COLORS = {
  virtual: "#10b981",
  ambulatory: "#3b82f6",
  hospital: "#e11d2e",
  redFlag: "#f59e0b",
};

const SPECIALTY_MAP: Record<string, string[]> = {
  Cardiology: [
    "Kardiologie",
    "Innere Medizin/Schwerpunkt Kardiologie",
    "Kinderkardiologie",
    "Herzchirurgie",
  ],
  Neurology: [
    "Neurologie",
    "Neurochirurgie",
    "Neurochirurgie/ohne Differenzierung nach Schwerpunkten (II)",
  ],
  Pediatrics: [
    "Pädiatrie",
    "Kinderchirurgie",
    "Kinderkardiologie",
    "Pädiatrie/Schwerpunkt Neonatologie",
    "Pädiatrie/Schwerpunkt Hämatologie und internistische Onkologie",
  ],
  Gynecology: ["Gynäkologie", "Frauenheilkunde und Geburtshilfe"],
  Obstetrics: ["Geburtshilfe", "Frauenheilkunde und Geburtshilfe"],
  Orthopedics: ["Orthopädie", "Unfallchirurgie"],
  Psychiatry: ["Psychiatrie", "Psychosomatik", "Psychotherapie"],
  Dermatology: [
    "Dermatologie",
    "Dermatologie/Tagesklinik (für teilstationäre Pflegesätze)",
  ],
  Urology: ["Urologie"],
  Gastroenterology: [
    "Gastroenterologie",
    "Innere Medizin/Schwerpunkt Gastroenterologie",
  ],
  Pulmonology: ["Pneumologie", "Innere Medizin/Schwerpunkt Pneumologie"],
  "General Medicine": [
    "Allgemeinmedizin",
    "Innere Medizin",
    "General Medicine",
    "Allgemeine Chirurgie",
  ],
  "Internal Medicine": [
    "Innere Medizin",
    "Geriatrie",
    "Innere Medizin/Schwerpunkt Geriatrie",
  ],
  Surgery: [
    "Chirurgie",
    "Allgemeine Chirurgie",
    "Gefäßchirurgie",
    "Plastische Chirurgie",
    "Viszeralchirurgie",
  ],
  ENT: ["Hals-", "Nasen-", "Ohrenheilkunde", "HNO"],
  Ophthalmology: ["Augenheilkunde"],
  Rheumatology: ["Rheumatologie", "Innere Medizin/Schwerpunkt Rheumatologie"],
  "Emergency Medicine": ["Notaufnahme", "Intensivmedizin", "Notfallmedizin"],
  "Allergy / Immunology": ["Allergologie", "Immunologie"],
  Nephrology: ["Nephrologie", "Innere Medizin/Schwerpunkt Nephrologie"],
  Hematology: [
    "Hämatologie",
    "Innere Medizin/Schwerpunkt Hämatologie und internistische Onkologie",
  ],
};

function specialtyMatches(
  providerSpecialties: string[],
  targetSpecialty: string
): boolean {
  if (!providerSpecialties || providerSpecialties.length === 0) return false;
  const germanEquivalents = SPECIALTY_MAP[targetSpecialty] || [targetSpecialty];
  const allTerms = [targetSpecialty, ...germanEquivalents].map((s) =>
    s.toLowerCase()
  );
  return providerSpecialties.some((s) =>
    allTerms.some((term) => s.toLowerCase().includes(term))
  );
}

function providerSupportsInsurance(provider: Provider, insurance: string) {
  if (!provider.insuranceAccepted || provider.insuranceAccepted.length === 0)
    return true;
  return provider.insuranceAccepted.includes(insurance);
}

function getProviderType(provider: Provider) {
  return provider.providerType || "Hospital";
}

function rankProviders(
  targetSpecialty: string,
  preferAmbulatory = true,
  query = "",
  insurance = "AOK",
  providerList: Provider[] = []
): RankedProvider[] {
  return [...providerList]
    .filter((p) => {
      if (!providerSupportsInsurance(p, insurance)) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      if (!p.city && !p.state && !p.zip) return true;
      return (
        p.city?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.zip?.includes(q) ||
        p.name?.toLowerCase().includes(q)
      );
    })
    .map((p) => {
      const ambulatory = Number(p.ambulatory) || 50;
      const expertise = Number(p.expertise) || 50;
      const occupancy = Number(p.occupancy) || 50;
      const wait = Number(p.wait) || 30;
      const specialtyMatch = specialtyMatches(
        p.specialties || [],
        targetSpecialty
      )
        ? 35
        : 5;
      const ambulatoryBoost =
        preferAmbulatory && getProviderType(p) !== "Hospital"
          ? ambulatory * 0.25
          : preferAmbulatory
          ? ambulatory * 0.15
          : 0;
      const match = Math.round(
        specialtyMatch +
          ambulatoryBoost +
          expertise * 0.35 +
          (p.telemedicineAvailable ? 8 : 0) -
          occupancy * 0.25 -
          wait * 0.15
      );
      const erLoad =
        p.erLoad ??
        (occupancy > 85 ? "Crowded" : occupancy > 60 ? "Moderate" : "Normal");
      return {
        ...p,
        providerType: getProviderType(p),
        telemedicineAvailable: !!p.telemedicineAvailable,
        openingHours: p.openingHours || "08:00 - 18:00",
        referralRequired:
          typeof p.referralRequired === "boolean" ? p.referralRequired : false,
        insuranceAccepted: p.insuranceAccepted || insuranceFunds,
        erLoad,
        availableBeds: Math.max(0, Math.floor((100 - occupancy) / 2)),
        specialistAvail: wait < 30 ? "Available Now" : `In ${wait} mins`,
        match,
      };
    })
    .sort((a, b) => b.match - a.match);
}

type RawProvider = {
  id: string;
  name?: string;
  addr_city?: string;
  state?: string;
  addr_postcode?: string;
  amenity?: string;
  specialties?: string | string[];
  opening_hours?: string;
  accepts_gkv?: boolean;
  nursing_ratio?: number;
  load_score?: number;
  annual_cases?: number;
  er_load?: string;
};

function mapProviders(data: RawProvider[]): Provider[] {
  return data.map((p: RawProvider) => ({
    id: p.id,
    name: p.name || "Unknown Provider",
    city: p.addr_city,
    state: p.state,
    zip: p.addr_postcode,
    providerType: p.amenity === "hospital" ? "Hospital" : "Clinic",
    specialties: Array.isArray(p.specialties)
      ? p.specialties
      : p.specialties
      ? [p.specialties]
      : [],
    telemedicineAvailable: false,
    openingHours: p.opening_hours || "08:00 - 18:00",
    referralRequired: p.amenity === "hospital",
    insuranceAccepted: p.accepts_gkv
      ? ["AOK", "TK", "Barmer", "DAK", "IKK", "BKK"]
      : ["Private Insurance"],
    ambulatory: p.amenity !== "hospital" ? 80 : 40,
    expertise: p.nursing_ratio
      ? Math.min(100, Math.round(p.nursing_ratio))
      : 60,
    occupancy:
      p.load_score ??
      (p.annual_cases ? Math.min(95, Math.round(p.annual_cases / 300)) : 50),
    wait: p.amenity === "hospital" ? 45 : 20,
    erLoad: p.er_load ?? undefined,
  }));
}

function LoadGauge({ score, label }: { score: number; label: string }) {
  const angle = -90 + (score / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const nx = Math.round(Math.cos(rad) * 38);
  const ny = Math.round(Math.sin(rad) * 38);
  const labelColor =
    label === "Crowded"
      ? "#A32D2D"
      : label === "Moderate"
      ? "#BA7517"
      : "#3B6D11";
  return (
    <svg
      width="90"
      height="58"
      viewBox="0 0 90 58"
      style={{ display: "block" }}
    >
      <path
        d="M 10 46 A 35 35 0 0 1 27.25 21.25"
        fill="none"
        stroke="#97C459"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 27.25 21.25 A 35 35 0 0 1 45 15"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 45 15 A 35 35 0 0 1 62.75 21.25"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 62.75 21.25 A 35 35 0 0 1 80 46"
        fill="none"
        stroke="#E24B4A"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="46"
        x2={45 + nx}
        y2={46 + ny}
        stroke="#171717"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="45" cy="46" r="4" fill="#171717" />
      <text
        x="45"
        y="57"
        textAnchor="middle"
        fontSize="10"
        fill={labelColor}
        fontWeight="600"
      >
        {label}
      </text>
    </svg>
  );
}

function MedSyncLogo() {
  return (
    <svg
      width="40"
      height="44"
      viewBox="0 0 42 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 2L38 9V22C38 32.5 30.5 42 21 44C11.5 42 4 32.5 4 22V9L21 2Z"
        fill="#e11d2e"
      />
      <rect x="17" y="12" width="8" height="22" rx="2.5" fill="white" />
      <rect x="10" y="19" width="22" height="8" rx="2.5" fill="white" />
      <polyline
        points="11,23 14,23 15.5,19 17,27 18.5,19 20,27 21.5,23 31,23"
        fill="none"
        stroke="#e11d2e"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppButton({
  children,
  primary = false,
  outline = false,
  style = {},
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  outline?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      {...props}
      style={{
        borderRadius: 999,
        padding: "12px 22px",
        border: outline
          ? "1px solid #e11d2e"
          : primary
          ? "none"
          : "1px solid #d4d4d4",
        background: primary ? "#e11d2e" : outline ? "transparent" : "#f5f5f5",
        color: primary ? "#fff" : outline ? "#e11d2e" : "#222",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        transition: "0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionCard({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 28,
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color = "#171717",
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <SectionCard style={{ padding: 24, borderLeft: `4px solid ${color}` }}>
      <div
        style={{
          fontSize: 13,
          color: "#737373",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8, color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#a3a3a3", marginTop: 4 }}>
          {sub}
        </div>
      )}
    </SectionCard>
  );
}

function LanguageSelector({
  locale,
  onSelect,
  languages,
}: {
  locale: Locale;
  onSelect: (l: Locale) => void;
  languages: { label: string; locale: Locale }[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        background: "#fff",
        padding: "10px 16px",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.06)",
        width: "fit-content",
        marginBottom: 24,
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang.locale}
          onClick={() => onSelect(lang.locale)}
          style={{
            padding: "5px 14px",
            borderRadius: 999,
            border: "none",
            background: locale === lang.locale ? "#e11d2e" : "transparent",
            color: locale === lang.locale ? "#fff" : "#404040",
            fontWeight: locale === lang.locale ? 700 : 500,
            cursor: "pointer",
            fontSize: 13,
            transition: "0.15s",
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>("en");
  const [sessionId] = useState(() => crypto.randomUUID());
  const t = createTranslator(locale);
  const rtl = isRTL(locale);

  const [careContext, setCareContext] = useState<GermanCareContext>(() =>
    getGermanCareContext()
  );
  const [view, setView] = useState<"patient" | "clinician">("patient");
  const [clinicianTab, setClinicianTab] = useState<"analytics" | "kasse">(
    "analytics"
  );
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [age, setAge] = useState<number | string>("");
  const [sex, setSex] = useState<Sex>("" as Sex);
  const [pregnant, setPregnant] = useState("no");
  const [childPatient, setChildPatient] = useState("no");
  const [symptom, setSymptom] = useState<Symptom>("" as Symptom);
  const [severity, setSeverity] = useState<number | string>("");
  const [chronic, setChronic] = useState("no");
  const [emergency, setEmergency] = useState("no");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState<number | string>("");
  const [fever, setFever] = useState("no");
  const [breathingIssue, setBreathingIssue] = useState("no");
  const [radiatingPain, setRadiatingPain] = useState("no");
  const [exertionalPain, setExertionalPain] = useState("no");
  const [confusion, setConfusion] = useState("no");
  const [dehydration, setDehydration] = useState("no");
  const [selfHarmRisk, setSelfHarmRisk] = useState("no");
  const [chestTightness, setChestTightness] = useState("no");
  const [neuroWarning, setNeuroWarning] = useState("no");
  const [insurance, setInsurance] = useState<InsuranceFund>(
    "" as InsuranceFund
  );
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [diagnoses, setDiagnoses] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "bot", text: createTranslator("en")("chat.greeting") },
  ]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const [bookingModal, setBookingModal] = useState<BookingModal>(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [overridePath, setOverridePath] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [auditHistory, setAuditHistory] = useState<
    Record<string, string | number>[]
  >([]);
  const [outcomes, setOutcomes] = useState({
    total: 0,
    accurate: 0,
    erAvoided: 0,
    ambulatoryShifted: 0,
    bookingsCompleted: 0,
  });
  const [feedbackAccurate, setFeedbackAccurate] = useState(true);
  const [feedbackErAvoided, setFeedbackErAvoided] = useState(true);
  const [feedbackAmbulatoryShift, setFeedbackAmbulatoryShift] = useState(true);
  const [triageVersion, setTriageVersion] = useState(0);
  const [realProviders, setRealProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "granted" | "denied">(
    "pending"
  );

  useEffect(() => {
    const timer = setInterval(
      () => setCareContext(getGermanCareContext(locale)),
       60000
    );
    return () => clearInterval(timer);
  }, [locale]);
  useEffect(() => {
  setCareContext(getGermanCareContext(locale));
}, [locale]);

  useEffect(() => {
    setChatHistory([{ role: "bot", text: t("chat.greeting") }]);
  }, [locale]);

  const triage = useMemo(
    () =>
      triageEngine(
        {
          age: Number(age),
          symptom,
          severity: Number(severity),
          chronic: chronic === "yes",
          emergency: emergency === "yes",
          durationDays: Number(durationDays),
          fever: fever === "yes",
          breathingIssue: breathingIssue === "yes",
          chestTightness: chestTightness === "yes",
          neuroWarning: neuroWarning === "yes",
          sex,
          pregnant: pregnant === "yes",
          childPatient: childPatient === "yes" || Number(age) < 16,
          medications,
          allergies,
          diagnoses,
          insurance,
          radiatingPain: radiatingPain === "yes",
          exertionalPain: exertionalPain === "yes",
          confusion: confusion === "yes",
          dehydration: dehydration === "yes",
          selfHarmRisk: selfHarmRisk === "yes",
        },
        locale
      ),
    [
      age,
      symptom,
      severity,
      chronic,
      emergency,
      durationDays,
      fever,
      breathingIssue,
      chestTightness,
      neuroWarning,
      sex,
      pregnant,
      childPatient,
      medications,
      allergies,
      diagnoses,
      insurance,
      radiatingPain,
      exertionalPain,
      confusion,
      dehydration,
      selfHarmRisk,
      locale,
    ]
  );

  useEffect(() => {
    setOverridePath("");
    setOverrideReason("");
  }, [
    age,
    sex,
    pregnant,
    childPatient,
    symptom,
    severity,
    chronic,
    emergency,
    location,
    durationDays,
    fever,
    breathingIssue,
    radiatingPain,
    exertionalPain,
    confusion,
    dehydration,
    selfHarmRisk,
    chestTightness,
    neuroWarning,
    insurance,
    medications,
    allergies,
    diagnoses,
  ]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(() => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
          setGpsStatus("granted");
        });
      },
      () => setGpsStatus("denied"),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        let url = "";
        if (gpsStatus === "granted" && userLat && userLon) {
          url = `/api/providers?mode=nearby&lat=${userLat}&lon=${userLon}&insurance=${encodeURIComponent(
            insurance
          )}&specialty=${encodeURIComponent(triage.specialty)}`;
        } else if (gpsStatus === "denied" && location.trim()) {
          url = `/api/providers?mode=search&q=${encodeURIComponent(
            location
          )}&insurance=${encodeURIComponent(
            insurance
          )}&specialty=${encodeURIComponent(triage.specialty)}`;
        } else {
          setLoadingProviders(false);
          return;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setRealProviders(mapProviders(data));
      } catch (err) {
        console.error("Failed to fetch providers:", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    if (gpsStatus === "granted" && userLat && userLon) {
      fetchProviders();
    } else {
      const timer = setTimeout(fetchProviders, 500);
      return () => clearTimeout(timer);
    }
  }, [userLat, userLon, gpsStatus, location, insurance, triage.specialty]);

  const effectivePath = overridePath || triage.carePath;
  const effectiveTitle =
    overridePath === "Hospital ER"
      ? "HOSPITAL ER"
      : overridePath === "Ambulatory care"
      ? "AMBULATORY CARE"
      : overridePath === "Virtual consult"
      ? "VIRTUAL CONSULT"
      : triage.title;

  const results = useMemo(
    () =>
      rankProviders(
        triage.specialty,
        effectiveTitle !== "HOSPITAL ER",
        location,
        insurance,
        realProviders
      ),
    [triage.specialty, effectiveTitle, location, insurance, realProviders]
  );

  const TopIcon =
    effectiveTitle === "HOSPITAL ER"
      ? Ambulance
      : effectiveTitle === "BEREITSCHAFTSDIENST"
      ? Stethoscope
      : effectiveTitle === "AMBULATORY CARE"
      ? Stethoscope
      : Video;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (!symptom) return;

    encryptFields({
      symptom,
      age: String(age),
      sex,
      medications: medications || "",
      allergies: allergies || "",
      diagnoses: diagnoses || "",
      location: location || "",
    }).then((encrypted) => {
      supabase.from("triage_events").insert({
        session_id: sessionId,
        age: encrypted.age,
        symptom: encrypted.symptom,
        sex: encrypted.sex,
        medications: encrypted.medications,
        allergies: encrypted.allergies,
        diagnoses: encrypted.diagnoses,
        location: encrypted.location,
        insurance,
        severity: Number(severity) || null,
        duration_days: Number(durationDays) || null,
        pathway: triage.pathway,
        title: triage.title,
        score: triage.score,
        triage_color: triage.triageColor,
        red_flags: triage.redFlags,
        specialty: triage.specialty,
        german_specialty: triage.germanSpecialty,
        icd10_code: triage.icd10Code,
        snomed_code: triage.snomedCode,
        override_path: overridePath || null,
        override_reason: overrideReason || null,
        locale,
      }).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("Failed to save triage event:", error.message);
      });
    });

    setAuditHistory((prev) =>
      [
        {
          timestamp: new Date().toLocaleString(),
          symptom,
          age: String(age),
          sex,
          insurance,
          title: triage.title,
          specialty: triage.specialty,
          score: triage.score,
          redFlags: triage.redFlags.length,
          medications: medications || "—",
          overridePath,
          overrideReason,
        },
        ...prev,
      ].slice(0, 20)
    );
  }, [
    triage.title,
    triage.specialty,
    triage.score,
    triage.redFlags,
    triage.redFlags.length,
    triage.pathway,
    triage.triageColor,
    triage.germanSpecialty,
    triage.icd10Code,
    triage.snomedCode,
    symptom,
    age,
    sex,
    insurance,
    medications,
    allergies,
    diagnoses,
    severity,
    durationDays,
    locale,
    location,
    overridePath,
    overrideReason,
    sessionId,
  ]);

  const acuityTrendData = auditHistory
    .slice()
    .reverse()
    .map((e, i) => ({
      index: i + 1,
      score: Number(e.score),
      redFlags: Number(e.redFlags),
    }));

  const accuracyRate =
    outcomes.total > 0
      ? `${Math.round((outcomes.accurate / outcomes.total) * 100)}%`
      : "—";
  const erAvoidRate =
    outcomes.total > 0
      ? `${Math.round((outcomes.erAvoided / outcomes.total) * 100)}%`
      : "—";
  const ambulatoryShiftRate =
    outcomes.total > 0
      ? `${Math.round((outcomes.ambulatoryShifted / outcomes.total) * 100)}%`
      : "—";

  const selectStyle = {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d4d4d4",
  };

  const mtsColors: Record<string, string> = {
    red: "#e11d2e",
    orange: "#f59e0b",
    yellow: "#eab308",
    green: "#10b981",
    blue: "#3b82f6",
  };

  async function handleChatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const input = chatInput.trim();
    const userMessage: ChatMessage = { role: "user", text: input };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory([...updatedHistory, { role: "bot", text: "..." }]);
    setChatInput("");

    try {
      const triageState = {
        age,
        sex,
        symptom,
        severity,
        chronic,
        emergency,
        durationDays,
        fever,
        breathingIssue,
        chestTightness,
        neuroWarning,
        pregnant,
        childPatient,
        radiatingPain,
        exertionalPain,
        confusion,
        dehydration,
        selfHarmRisk,
        medications,
        allergies,
        diagnoses,
        insurance,
        location,
      };

      const apiMessages = updatedHistory.map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, triageState, locale }),
      });

      const data = await res.json();
      const botResponse =
        data.message || "I could not process that. Please try again.";
      const updates = data.updates || {};

      if (updates.age !== undefined) setAge(updates.age);
      if (updates.sex !== undefined) setSex(updates.sex);
      if (updates.symptom !== undefined) setSymptom(updates.symptom);
      if (updates.severity !== undefined) setSeverity(updates.severity);
      if (updates.chronic !== undefined)
        setChronic(updates.chronic ? "yes" : "no");
      if (updates.emergency !== undefined)
        setEmergency(updates.emergency ? "yes" : "no");
      if (updates.durationDays !== undefined)
        setDurationDays(updates.durationDays);
      if (updates.fever !== undefined) setFever(updates.fever ? "yes" : "no");
      if (updates.breathingIssue !== undefined)
        setBreathingIssue(updates.breathingIssue ? "yes" : "no");
      if (updates.chestTightness !== undefined)
        setChestTightness(updates.chestTightness ? "yes" : "no");
      if (updates.neuroWarning !== undefined)
        setNeuroWarning(updates.neuroWarning ? "yes" : "no");
      if (updates.pregnant !== undefined)
        setPregnant(updates.pregnant ? "yes" : "no");
      if (updates.childPatient !== undefined)
        setChildPatient(updates.childPatient ? "yes" : "no");
      if (updates.radiatingPain !== undefined)
        setRadiatingPain(updates.radiatingPain ? "yes" : "no");
      if (updates.exertionalPain !== undefined)
        setExertionalPain(updates.exertionalPain ? "yes" : "no");
      if (updates.confusion !== undefined)
        setConfusion(updates.confusion ? "yes" : "no");
      if (updates.dehydration !== undefined)
        setDehydration(updates.dehydration ? "yes" : "no");
      if (updates.selfHarmRisk !== undefined)
        setSelfHarmRisk(updates.selfHarmRisk ? "yes" : "no");
      if (updates.medications !== undefined)
        setMedications(updates.medications);
      if (updates.allergies !== undefined) setAllergies(updates.allergies);
      if (updates.diagnoses !== undefined) setDiagnoses(updates.diagnoses);
      if (updates.insurance !== undefined) setInsurance(updates.insurance);
      if (updates.location !== undefined) setLocation(updates.location);

      if (updates.suggestedProviderSearch) {
        try {
          const providerRes = await fetch(
            `/api/providers?mode=search&q=${encodeURIComponent(
              updates.suggestedProviderSearch
            )}&insurance=${encodeURIComponent(insurance)}`
          );
          const providerData = await providerRes.json();
          if (Array.isArray(providerData) && providerData.length > 0)
            setRealProviders(mapProviders(providerData));
        } catch {}
      }

      setChatHistory([...updatedHistory, { role: "bot", text: botResponse }]);
      setTriageVersion((v) => v + 1);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory([
        ...updatedHistory,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    }
  }

  function handleBooking(provider: RankedProvider, type: string) {
    setBookingModal({ provider, type });
  }

  function handleFeedback(
    isAccurate: boolean,
    avoidedEr: boolean,
    ambulatoryShift: boolean
  ) {
    setOutcomes((prev) => ({
      total: prev.total + 1,
      accurate: prev.accurate + (isAccurate ? 1 : 0),
      erAvoided: prev.erAvoided + (avoidedEr ? 1 : 0),
      ambulatoryShifted: prev.ambulatoryShifted + (ambulatoryShift ? 1 : 0),
      bookingsCompleted: prev.bookingsCompleted + 1,
    }));
    setFeedbackModal(false);
    setFeedbackAccurate(true);
    setFeedbackErAvoided(true);
    setFeedbackAmbulatoryShift(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f2efe7",
        color: "#171717",
        fontFamily: "Inter, Arial, sans-serif",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1450,
            margin: "0 auto",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <MedSyncLogo />
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                <span style={{ color: "#e11d2e" }}>Med</span>
                <span style={{ color: "#171717" }}>Sync</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#737373",
                  marginTop: 3,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {t("nav.subtitle")}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              background: "#f5f5f5",
              padding: 4,
              borderRadius: 999,
            }}
          >
            <button
              onClick={() => setView("patient")}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: view === "patient" ? "#fff" : "transparent",
                boxShadow:
                  view === "patient" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <User size={16} /> {t("nav.patientApp")}
            </button>

            <button
              onClick={() => {
                setView("clinician");
                if (locale !== "en" && locale !== "de") setLocale("en");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: view === "clinician" ? "#fff" : "transparent",
                boxShadow:
                  view === "clinician" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LayoutDashboard size={16} /> {t("nav.clinicianPortal")}
            </button>
          </div>
        </div>
      </nav>

      {view === "patient" ? (
        <section
          style={{ maxWidth: 1450, margin: "0 auto", padding: "32px 16px" }}
        >
          <LanguageSelector
            locale={locale}
            onSelect={setLocale}
            languages={ALL_LANGUAGES}
          />

          {careContext.isOutOfHours && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "#78350f",
                fontWeight: 500,
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>🕐</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  {careContext.isWeekend
                  ? locale === "de" ? "Wochenende — Außerhalb der Sprechzeiten" : "Weekend — Outside GP hours"
                  : locale === "de" ? "Außerhalb der Sprechzeiten" : "Outside office hours"}
                </div>
                <div style={{ fontWeight: 400 }}>
                  {careContext.recommendation}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr",
              gap: 28,
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionCard
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: 520,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "#faf8f3",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <MessageSquare size={20} color="#e11d2e" />
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {t("chat.title")}
                  </div>
                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "#10b981",
                      fontWeight: 600,
                      background: "#f0fdf4",
                      padding: "3px 8px",
                      borderRadius: 99,
                    }}
                  >
                    {t("chat.powered")}
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: 20,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {chatHistory.map((msg, i) => (
                    <div
                      key={`${msg.role}-${i}`}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.role === "bot" ? "flex-start" : "flex-end",
                      }}
                    >
                      <div
                        style={{
                          background:
                            msg.role === "bot" ? "#f5f5f5" : "#e11d2e",
                          color: msg.role === "bot" ? "#171717" : "#fff",
                          padding: "12px 16px",
                          borderRadius: 16,
                          maxWidth: "82%",
                          fontSize: 15,
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.text === "..." ? (
                          <span style={{ letterSpacing: 4, color: "#a3a3a3" }}>
                            ● ● ●
                          </span>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form
                  onSubmit={handleChatSubmit}
                  style={{
                    padding: 16,
                    background: "#fff",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t("chat.placeholder")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 999,
                      border: "1px solid #d4d4d4",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <AppButton
                    primary
                    type="submit"
                    style={{ padding: "0 20px" }}
                  >
                    {t("chat.send")}
                  </AppButton>
                </form>
              </SectionCard>

              <SectionCard style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={16} color="#e11d2e" />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {t("location.title")}
                    {gpsStatus === "granted" && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "#10b981",
                          fontWeight: 400,
                        }}
                      >
                        {t("location.gpsActive")}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ position: "relative", marginTop: 10 }}>
                  <Search
                    size={16}
                    color="#a3a3a3"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      gpsStatus === "granted"
                        ? t("location.placeholderGps")
                        : t("location.placeholder")
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: 10,
                      border: "1px solid #d4d4d4",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </SectionCard>

              <SectionCard style={{ padding: 20 }}>
                <div
                  onClick={() => setProfileExpanded((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <ClipboardList size={18} color="#e11d2e" />
                  {t("profile.title")}
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 13,
                      color: "#737373",
                      fontWeight: 400,
                    }}
                  >
                    {profileExpanded
                      ? t("profile.collapse")
                      : t("profile.expand")}
                  </span>
                </div>

                {profileExpanded && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      {[
                        {
                          label: t("profile.insuranceFund"),
                          node: (
                            <select
                              value={insurance}
                              onChange={(e) =>
                                setInsurance(e.target.value as InsuranceFund)
                              }
                              style={selectStyle}
                            >
                              <option value="">
                                {t("profile.selectInsurance")}
                              </option>
                              {insuranceFunds.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          ),
                        },
                        {
                          label: t("profile.age"),
                          node: (
                            <input
                              type="number"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              placeholder="e.g. 45"
                              style={selectStyle}
                            />
                          ),
                        },
                        {
                          label: t("profile.sex"),
                          node: (
                            <select
                              value={sex}
                              onChange={(e) => setSex(e.target.value as Sex)}
                              style={selectStyle}
                            >
                              <option value="">{t("profile.selectSex")}</option>
                              {sexes.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          ),
                        },
                        {
                          label: t("profile.mainSymptom"),
                          node: (
                            <select
                              value={symptom}
                              onChange={(e) =>
                                setSymptom(e.target.value as Symptom)
                              }
                              style={selectStyle}
                            >
                              <option value="">
                                {t("profile.selectSymptom")}
                              </option>
                              {SYMPTOM_GROUPS.map((group) => (
                                <optgroup
                                  key={group.categoryKey}
                                  label={t(group.categoryKey as TranslationKey)}
                                >
                                  {group.symptoms.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          ),
                        },
                        {
                          label: t("profile.severity"),
                          node: (
                            <select
                              value={String(severity)}
                              onChange={(e) => setSeverity(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="">
                                {t("profile.selectSeverity")}
                              </option>
                              {Array.from({ length: 10 }, (_, i) =>
                                String(i + 1)
                              ).map((n) => (
                                <option key={n} value={n}>
                                  {n}/10
                                </option>
                              ))}
                            </select>
                          ),
                        },
                        {
                          label: t("profile.pregnancy"),
                          node: (
                            <select
                              value={pregnant}
                              onChange={(e) => setPregnant(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.childCase"),
                          node: (
                            <select
                              value={childPatient}
                              onChange={(e) => setChildPatient(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.adult")}</option>
                              <option value="yes">{t("profile.child")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.chronicDisease"),
                          node: (
                            <select
                              value={chronic}
                              onChange={(e) => setChronic(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.emergencySigns"),
                          node: (
                            <select
                              value={emergency}
                              onChange={(e) => setEmergency(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.symptomDuration"),
                          node: (
                            <select
                              value={String(durationDays)}
                              onChange={(e) => setDurationDays(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="">
                                {t("profile.selectDuration")}
                              </option>
                              <option value="1">{t("profile.day1")}</option>
                              <option value="2">{t("profile.days2")}</option>
                              <option value="3">{t("profile.days3")}</option>
                              <option value="7">{t("profile.week1")}</option>
                              <option value="14">{t("profile.weeks2")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.fever"),
                          node: (
                            <select
                              value={fever}
                              onChange={(e) => setFever(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.breathingDifficulty"),
                          node: (
                            <select
                              value={breathingIssue}
                              onChange={(e) =>
                                setBreathingIssue(e.target.value)
                              }
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.painRadiates"),
                          node: (
                            <select
                              value={radiatingPain}
                              onChange={(e) => setRadiatingPain(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.painExertion"),
                          node: (
                            <select
                              value={exertionalPain}
                              onChange={(e) =>
                                setExertionalPain(e.target.value)
                              }
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.confusion"),
                          node: (
                            <select
                              value={confusion}
                              onChange={(e) => setConfusion(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.dehydration"),
                          node: (
                            <select
                              value={dehydration}
                              onChange={(e) => setDehydration(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.selfHarm"),
                          node: (
                            <select
                              value={selfHarmRisk}
                              onChange={(e) => setSelfHarmRisk(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.chestTightness"),
                          node: (
                            <select
                              value={chestTightness}
                              onChange={(e) =>
                                setChestTightness(e.target.value)
                              }
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                        {
                          label: t("profile.neuroWarning"),
                          node: (
                            <select
                              value={neuroWarning}
                              onChange={(e) => setNeuroWarning(e.target.value)}
                              style={selectStyle}
                            >
                              <option value="no">{t("profile.no")}</option>
                              <option value="yes">{t("profile.yes")}</option>
                            </select>
                          ),
                        },
                      ].map((field) => (
                        <div key={field.label}>
                          <label
                            style={{
                              display: "block",
                              fontSize: 13,
                              marginBottom: 6,
                            }}
                          >
                            {field.label}
                          </label>
                          {field.node}
                        </div>
                      ))}

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                        >
                          {t("profile.medications")}
                        </label>
                        <textarea
                          value={medications}
                          onChange={(e) => setMedications(e.target.value)}
                          rows={2}
                          placeholder="e.g. Warfarin 5mg, Metoprolol 50mg, Metformin 850mg"
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #d4d4d4",
                            resize: "vertical",
                            fontSize: 13,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                        >
                          {t("profile.allergies")}
                        </label>
                        <input
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          style={selectStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                        >
                          {t("profile.diagnoses")}
                        </label>
                        <input
                          value={diagnoses}
                          onChange={(e) => setDiagnoses(e.target.value)}
                          style={selectStyle}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#525252",
                        background: "#faf8f3",
                        padding: 12,
                        borderRadius: 12,
                        marginTop: 12,
                      }}
                    >
                      <strong>{t("profile.coverageNote")}:</strong>{" "}
                      {triage.coverageNote}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <AppButton
                        primary
                        onClick={() => {
                          setOverridePath("");
                          setOverrideReason("");
                          setTriageVersion((v) => v + 1);
                        }}
                        style={{ width: "100%" }}
                      >
                        {t("profile.runTriage")}
                      </AppButton>
                    </div>
                  </>
                )}
              </SectionCard>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {symptom ? (
                <>
                  {triage.dispatch112 && (
                    <div
                      style={{
                        background: "#7f1d1d",
                        color: "#fff",
                        padding: "20px 24px",
                        borderRadius: 20,
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                      }}
                    >
                      <Ambulance size={36} />
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>
                          {t("ambulance.title")}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 400,
                            marginTop: 6,
                            opacity: 0.9,
                          }}
                        >
                          {triage.carePath}
                        </div>
                      </div>
                    </div>
                  )}

                  {triage.pathway === "KBD_116117" && !triage.dispatch112 && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "2px solid #f59e0b",
                        color: "#78350f",
                        padding: "20px 24px",
                        borderRadius: 20,
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 32, flexShrink: 0 }}>📞</span>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>
                          BEREITSCHAFTSDIENST — 116 117
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 400,
                            marginTop: 6,
                          }}
                        >
                          {triage.carePath}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      background:
                        triage.redFlags.length > 0 ? "#fff0f0" : "#faf8f3",
                      borderRadius: 28,
                      padding: 28,
                      border:
                        triage.redFlags.length > 0
                          ? "2px solid #e11d2e"
                          : "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {triage.redFlags.length > 0 && (
                      <div
                        style={{
                          background: "#e11d2e",
                          color: "#fff",
                          padding: "12px 16px",
                          borderRadius: 12,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                          }}
                        >
                          <AlertOctagon
                            size={24}
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                              {t("triage.redFlagTitle")}
                            </div>
                            {triage.redFlags.map((flag, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 13,
                                  opacity: 0.92,
                                  marginTop: i === 0 ? 4 : 2,
                                }}
                              >
                                • {flag}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background:
                              triage.redFlags.length > 0
                                ? "#e11d2e"
                                : triage.pathway === "KBD_116117"
                                ? "#f59e0b"
                                : "#171717",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <TopIcon size={32} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#737373",
                              fontWeight: 600,
                            }}
                          >
                            {t("triage.recommendedPathway")}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: 800,
                              lineHeight: 1.1,
                              color:
                                triage.redFlags.length > 0
                                  ? "#e11d2e"
                                  : triage.pathway === "KBD_116117"
                                  ? "#d97706"
                                  : "#171717",
                            }}
                          >
                            {effectiveTitle}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>
                          {triage.score}/100
                        </div>
                        <div style={{ fontSize: 12, color: "#737373" }}>
                          {t("triage.acuityScore")}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            display: "inline-block",
                            background:
                              mtsColors[triage.triageColor] || "#737373",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 99,
                          }}
                        >
                          MTS {triage.triageColor.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {!triage.dispatch112 && triage.pathway !== "KBD_116117" && (
                      <p
                        style={{
                          marginTop: 18,
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: "#404040",
                          fontWeight: 500,
                        }}
                      >
                        {effectivePath}
                      </p>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      {[
                        [t("triage.specialty"), triage.germanSpecialty],
                        ["ICD-10-GM", triage.icd10Code],
                        ["SNOMED CT", triage.snomedCode],
                        [
                          t("triage.referral"),
                          triage.requiredReferral
                            ? t("triage.referralRequired")
                            : t("triage.referralNotRequired"),
                        ],
                        [t("triage.insurance"), insurance || "—"],
                        ["FHIR", "R4 ✓"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            background: "#fff",
                            padding: 14,
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.05)",
                          }}
                        >
                          <div style={{ fontSize: 11, color: "#737373" }}>
                            {label}
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              marginTop: 3,
                              fontSize: 12,
                              wordBreak: "break-all",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {medications &&
                      triage.redFlags.some((f) =>
                        f.toLowerCase().includes("med")
                      ) && (
                        <div
                          style={{
                            marginTop: 14,
                            background: "#fff7ed",
                            border: "1px solid #f59e0b",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "#92400e",
                          }}
                        >
                          <strong>⚠ {locale === "de" ? "Medikationsrisiko erkannt" : "Medication risk detected"}</strong> — {locale === "de" ? "Details siehe Warnhinweise oben." : "see red flags above for details."}
                        </div>
                      )}

                    {triage.referralNote && (
                      <div
                        style={{
                          marginTop: 14,
                          fontSize: 13,
                          color: "#525252",
                          background: "#faf8f3",
                          padding: 12,
                          borderRadius: 10,
                        }}
                      >
                        {triage.referralNote}
                      </div>
                    )}
                  </div>

                  <SectionCard style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={18} color="#e11d2e" />
                      {t("triage.triageQuestions")}
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        lineHeight: 1.8,
                        color: "#525252",
                      }}
                    >
                      {triage.questions.length > 0 ? (
                        triage.questions.map((q, i) => (
                          <li key={`${q}-${i}`}>{q}</li>
                        ))
                      ) : (
                        <li>
                          {locale === "de" ? "Keine Rückfragen für diese Präsentation erforderlich." : "No follow-up questions required for this presentation."}
                        </li>
                      )}
                    </ul>
                  </SectionCard>

                  <SectionCard style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                        fontWeight: 700,
                      }}
                    >
                      <ShieldCheck size={18} color="#e11d2e" />
                      {t("triage.explainability")}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#525252",
                        lineHeight: 1.7,
                        background: "#faf8f3",
                        padding: 14,
                        borderRadius: 14,
                        marginBottom: 14,
                      }}
                    >
                      <strong>{locale === "de" ? "Haftungsausschluss:" : "Disclaimer:"}</strong> {t("triage.disclaimer")}
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {t("triage.decisionTrace")}
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        lineHeight: 1.7,
                        color: "#525252",
                        fontSize: 14,
                      }}
                    >
                      {triage.auditTrace.map((line, i) => (
                        <li key={`${line}-${i}`}>{line}</li>
                      ))}
                    </ul>
                  </SectionCard>
                </>
              ) : (
                <SectionCard style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🩺</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 10,
                      color: "#171717",
                    }}
                  >
                    {locale === "de" ? "Bereit zu helfen" : "Ready to help"}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "#737373",
                      lineHeight: 1.7,
                      maxWidth: 340,
                      margin: "0 auto",
                    }}
                  >
                    {locale === "de"
                      ? "Beschreiben Sie Ihre Symptome im Chat oder füllen Sie das Patientenprofil aus, um eine personalisierte Versorgungsempfehlung zu erhalten."
                      : "Describe your symptoms in the chat or fill in the patient profile to receive a personalised care pathway recommendation."}       
                  </div>
                </SectionCard>
              )}

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <MapPin size={20} /> {t("providers.title")}
                  {loadingProviders && (
                    <span
                      style={{
                        fontSize: 13,
                        color: "#737373",
                        fontWeight: 400,
                      }}
                    >
                      {t("providers.loading")}
                    </span>
                  )}
                </h3>

                {!loadingProviders && realProviders.length === 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 24,
                      border: "1px solid rgba(0,0,0,0.06)",
                      color: "#737373",
                      fontSize: 14,
                    }}
                  >
                    {gpsStatus === "pending"
                      ? t("providers.pending")
                      : gpsStatus === "denied"
                      ? t("providers.denied")
                      : t("providers.notFound")}
                  </div>
                )}

                {results.map((provider) => (
                  <SectionCard key={provider.id} style={{ padding: 24 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background:
                                provider.providerType === "Hospital"
                                  ? "#fef2f2"
                                  : "#f0fdf4",
                              color:
                                provider.providerType === "Hospital"
                                  ? "#e11d2e"
                                  : "#10b981",
                              padding: "2px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {provider.providerType}
                          </span>
                          {provider.insuranceAccepted?.includes("AOK") && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                background: "#eff6ff",
                                color: "#3b82f6",
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              GKV
                            </span>
                          )}
                          {symptom &&
                            specialtyMatches(
                              provider.specialties || [],
                              triage.specialty
                            ) && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: "#f0fdf4",
                                  color: "#10b981",
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                }}
                              >
                                ✓ {triage.germanSpecialty}
                              </span>
                            )}
                        </div>

                        <h4
                          style={{ margin: 0, fontSize: 18, fontWeight: 700 }}
                        >
                          {provider.name}
                        </h4>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            marginTop: 8,
                            fontSize: 13,
                            color: "#525252",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <MapPin size={13} />
                            {provider.city || provider.zip
                              ? `${provider.city || ""}${
                                  provider.city && provider.zip ? ", " : ""
                                }${provider.zip || ""}${
                                  provider.state ? ` · ${provider.state}` : ""
                                }`
                              : "Germany"}
                          </span>
                          {provider.providerType !== "Hospital" && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <Activity
                                size={13}
                                color={
                                  provider.erLoad === "Crowded"
                                    ? "#e11d2e"
                                    : "#10b981"
                                }
                              />
                              {provider.erLoad}
                            </span>
                          )}
                          {provider.openingHours &&
  provider.openingHours !== "08:00 - 18:00" && (
    <span>🕐 {provider.openingHours}</span>
  )}
{provider.phone && (
  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
    📞 <a href={`tel:${provider.phone}`} style={{ color: "#525252", textDecoration: "none" }}>
      {provider.phone}
    </a>
  </span>
)}
{provider.website && (
  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
    🌐 <a href={provider.website} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 12 }}>
      Website
    </a>
  </span>
)}
                        </div>

                        {provider.specialties &&
                          provider.specialties.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                              }}
                            >
                              {provider.specialties.slice(0, 3).map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 11,
                                    background: "#f5f5f5",
                                    color: "#525252",
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {provider.specialties.length > 3 && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    background: "#f5f5f5",
                                    color: "#737373",
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                  }}
                                >
                                  +{provider.specialties.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 700,
                            color:
                              provider.match > 50
                                ? "#10b981"
                                : provider.match > 25
                                ? "#f59e0b"
                                : "#737373",
                          }}
                        >
                          {provider.match}%
                        </div>
                        <div style={{ fontSize: 11, color: "#737373" }}>
                          {t("providers.match")}
                        </div>
                        {provider.providerType === "Hospital" && (
                          <LoadGauge
                            score={provider.occupancy ?? 50}
                            label={provider.erLoad ?? "Normal"}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      {effectiveTitle !== "HOSPITAL ER" && (
                        <AppButton
                          primary
                          onClick={() => handleBooking(provider, "Appointment")}
                          style={{ padding: "10px 18px" }}
                        >
                          <CalendarDays
                            size={15}
                            style={{ marginRight: 6, display: "inline" }}
                          />{" "}
                          {t("providers.bookAppointment")}
                        </AppButton>
                      )}

                      {effectiveTitle === "VIRTUAL CONSULT" &&
                        provider.telemedicineAvailable && (
                          <AppButton
                            outline
                            onClick={() =>
                              handleBooking(provider, "Telemedicine")
                            }
                            style={{ padding: "10px 18px" }}
                          >
                            <Video
                              size={15}
                              style={{ marginRight: 6, display: "inline" }}
                            />{" "}
                            {t("providers.startTelemed")}
                          </AppButton>
                        )}

                      <AppButton
                        onClick={() => handleBooking(provider, "Referral")}
                        style={{ padding: "10px 18px" }}
                      >
                        <FileText
                          size={15}
                          style={{ marginRight: 6, display: "inline" }}
                        />{" "}
                        {t("providers.generateReferral")}
                      </AppButton>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          style={{ maxWidth: 1450, margin: "0 auto", padding: "32px 16px" }}
        >
          <LanguageSelector
            locale={locale}
            onSelect={setLocale}
            languages={CLINICIAN_LANGUAGES}
          />

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
              {t("clinician.title")}
            </h1>
            <p style={{ color: "#737373", fontSize: 16, marginTop: 8 }}>
              {t("clinician.subtitle")}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 28,
              background: "#f5f5f5",
              padding: 4,
              borderRadius: 999,
              width: "fit-content",
            }}
          >
            {([ 
              { key: "analytics", label: "Analytics" },
              { key: "kasse", label: "Krankenkassen-Cockpit" },
            ] as { key: "analytics" | "kasse"; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setClinicianTab(tab.key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: clinicianTab === tab.key ? "#fff" : "transparent",
                  boxShadow:
                    clinicianTab === tab.key
                      ? "0 2px 4px rgba(0,0,0,0.1)"
                      : "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {clinicianTab === "analytics" && (
            <>
              {acuityTrendData.length > 1 && (
                <SectionCard style={{ padding: 24, marginBottom: 28 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}
                  >
                    {t("clinician.acuityTrend")} — {locale === "de" ? `letzte ${acuityTrendData.length} Ereignisse` : `last ${acuityTrendData.length} events`}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={acuityTrendData}>
                      <XAxis
                        dataKey="index"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#e11d2e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#e11d2e" }}
                        name="Acuity score"
                      />
                      <Line
                        type="monotone"
                        dataKey="redFlags"
                        stroke={CHART_COLORS.redFlag}
                        strokeWidth={2}
                        dot={{ r: 4, fill: CHART_COLORS.redFlag }}
                        name="Red flags"
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                <MetricCard
                  label={t("clinician.triageAccuracy")}
                  value={accuracyRate}
                  color="#10b981"
                />
                <MetricCard
                  label={t("clinician.erAvoidance")}
                  value={erAvoidRate}
                  color="#3b82f6"
                />
                <MetricCard
                  label={t("clinician.ambulatoryShift")}
                  value={ambulatoryShiftRate}
                  color="#8b5cf6"
                />
                <MetricCard
                  label={t("clinician.bookingsCompleted")}
                  value={outcomes.bookingsCompleted}
                  color="#f59e0b"
                />
              </div>

              <SectionCard style={{ padding: 24, marginBottom: 28 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}
                >
                  {t("clinician.override")}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    maxWidth: 600,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      {t("clinician.overridePathway")}
                    </label>
                    <select
                      value={overridePath}
                      onChange={(e) => setOverridePath(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #d4d4d4",
                      }}
                    >
                      <option value="">{t("clinician.noOverride")}</option>
                      <option value="Virtual consult">Virtual consult</option>
                      <option value="Ambulatory care">Ambulatory care</option>
                      <option value="Hospital ER">Hospital ER</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      {t("clinician.justification")}
                    </label>
                    <input
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Reason for override..."
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #d4d4d4",
                      }}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard style={{ padding: 24 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}
                >
                  {t("clinician.auditTrail")}
                </div>
                <div style={{ fontSize: 13, color: "#525252" }}>
                  {auditHistory.length === 0 ? (
                    <div style={{ color: "#a3a3a3" }}>
                      {t("clinician.noEvents")}
                    </div>
                  ) : (
                    auditHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 0",
                          borderBottom:
                            idx === auditHistory.length - 1
                              ? "none"
                              : "1px solid rgba(0,0,0,0.06)",
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1fr 0.8fr 0.6fr 1fr",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "#737373", fontSize: 12 }}>
                          {String(entry.timestamp)}
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {String(entry.symptom) || "—"}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color:
                              String(entry.title) === "HOSPITAL ER" ||
                              String(entry.title) === "AMBULANCE 112"
                                ? "#e11d2e"
                                : String(entry.title) === "VIRTUAL CONSULT"
                                ? "#10b981"
                                : String(entry.title) === "BEREITSCHAFTSDIENST"
                                ? "#d97706"
                                : "#3b82f6",
                          }}
                        >
                          {String(entry.title) || "—"}
                        </span>
                        <span style={{ color: "#525252" }}>
                          {String(entry.score)}
                        </span>
                        <span style={{ color: "#737373", fontSize: 12 }}>
                          {entry.medications &&
                          String(entry.medications) !== "—"
                            ? `💊 ${String(entry.medications).slice(0, 28)}${
                                String(entry.medications).length > 28 ? "…" : ""
                              }`
                            : ""}
                          {entry.overridePath
                            ? ` → ${String(entry.overridePath)}`
                            : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </>
          )}

          {clinicianTab === "kasse" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionCard style={{ padding: 28, background: "#faf8f3" }}>
                <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
                  Krankenkassen ROI Report
                </div>
                <div style={{ color: "#737373", fontSize: 15 }}>
                  Kosteneffizienz und Qualitätssicherung für GKV-Partner —
                  powered by MedSync AI
                </div>
              </SectionCard>

              <SectionCard style={{ padding: 24 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}
                >
                  ePA / FHIR Export (§ 341 SGB V)
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#525252",
                    marginBottom: 16,
                    lineHeight: 1.7,
                  }}
                >
                  Alle Triage-Ereignisse sind als HL7 FHIR R4
                  ClinicalImpression-Ressourcen verfügbar. Kodiert mit SNOMED CT
                  und ICD-10-GM (BfArM). Kompatibel mit der elektronischen
                  Patientenakte (ePA) und MDK-Prüfprozessen.
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <AppButton primary style={{ padding: "10px 20px" }}>
                    FHIR Bundle exportieren
                  </AppButton>
                  <AppButton outline style={{ padding: "10px 20px" }}>
                    MDK-Bericht erstellen
                  </AppButton>
                  <AppButton style={{ padding: "10px 20px" }}>
                    CSV für Controlling
                  </AppButton>
                </div>
              </SectionCard>

              <SectionCard style={{ padding: 24 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}
                >
                  Kassen-spezifische Patientenservices
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      kasse: "TK",
                      service: "TK-Doc Videosprechstunde",
                      phone: "040 85 50 60 60",
                    },
                    {
                      kasse: "AOK",
                      service: "AOK Gesundheitskurse",
                      phone: "0800 0 326 326",
                    },
                    {
                      kasse: "Barmer",
                      service: "Barmer Digital-Coach",
                      phone: "0800 33 20 60",
                    },
                    {
                      kasse: "DAK",
                      service: "DAK Gesundheitstelefon",
                      phone: "040 325 325 555",
                    },
                    {
                      kasse: "IKK",
                      service: "IKK Beratungshotline",
                      phone: "0800 455 1111",
                    },
                    {
                      kasse: "BKK",
                      service: "BKK Beratung",
                      phone: "Kasse kontaktieren",
                    },
                  ].map((item) => (
                    <div
                      key={item.kasse}
                      style={{
                        background: "#faf8f3",
                        padding: 16,
                        borderRadius: 14,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#e11d2e",
                          marginBottom: 4,
                        }}
                      >
                        {item.kasse}
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        {item.service}
                      </div>
                      <div style={{ fontSize: 12, color: "#737373" }}>
                        {item.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard style={{ padding: 24 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}
                >
                  Regulatorische Grundlage
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    ["§ 65a SGB V", "Bonusprogramme für digitale Erstkontakte"],
                    ["§ 73 SGB V", "Überweisungsregeln GKV Primärversorgung"],
                    ["§ 76 SGB V", "Notfallversorgung ohne Überweisung"],
                    ["§ 291g SGB V", "Telemedizinische Leistungen"],
                    ["§ 341 SGB V", "Elektronische Patientenakte (ePA)"],
                    ["KHVVG 2025", "Krankenhausversorgungsverbesserungsgesetz"],
                  ].map(([para, desc]) => (
                    <div
                      key={para}
                      style={{
                        background: "#f5f5f5",
                        padding: 14,
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#e11d2e",
                        }}
                      >
                        {para}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#525252", marginTop: 4 }}
                      >
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </section>
      )}

      {bookingModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 24,
              width: 430,
              maxWidth: "92%",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {t("booking.confirm")} {bookingModal.type}
            </h2>
            <p>
              {t("booking.about")} {bookingModal.type.toLowerCase()} for{" "}
              <strong>{bookingModal.provider.name}</strong>.
            </p>
            <p style={{ fontSize: 14, color: "#737373" }}>
              {t("booking.insurance")}: {insurance || "—"}. {t("booking.slot")}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <AppButton
                primary
                onClick={() => {
                  setBookingModal(null);
                  setFeedbackModal(true);
                }}
                style={{ flex: 1 }}
              >
                {t("booking.confirmBtn")}
              </AppButton>
              <AppButton
                onClick={() => setBookingModal(null)}
                style={{ flex: 1 }}
              >
                {t("booking.cancel")}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 24,
              width: 460,
              maxWidth: "92%",
              textAlign: "center",
            }}
          >
            <CheckCircle2
              size={48}
              color="#10b981"
              style={{ margin: "0 auto" }}
            />
            <h2 style={{ marginTop: 16 }}>{t("feedback.title")}</h2>
            <p style={{ color: "#737373" }}>{t("feedback.subtitle")}</p>
            <div
              style={{
                textAlign: "left",
                background: "#f5f5f5",
                padding: 16,
                borderRadius: 12,
                margin: "20px 0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={feedbackAccurate}
                  onChange={(e) => setFeedbackAccurate(e.target.checked)}
                />{" "}
                {t("feedback.accurate")}
              </label>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={feedbackErAvoided}
                  onChange={(e) => setFeedbackErAvoided(e.target.checked)}
                />{" "}
                {t("feedback.erAvoided")}
              </label>
              <label style={{ display: "flex", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={feedbackAmbulatoryShift}
                  onChange={(e) => setFeedbackAmbulatoryShift(e.target.checked)}
                />{" "}
                {t("feedback.ambulatoryShift")}
              </label>
            </div>
            <AppButton
              primary
              onClick={() =>
                handleFeedback(
                  feedbackAccurate,
                  feedbackErAvoided,
                  feedbackAmbulatoryShift
                )
              }
              style={{ width: "100%" }}
            >
              {t("feedback.save")}
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
