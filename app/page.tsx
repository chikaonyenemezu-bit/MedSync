"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  Ambulance,
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
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
import { createTranslator, isRTL, type Locale } from "@/lib/i18n";

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

type ChatMessage = { role: "bot" | "user"; text: string };

type ViewMode = "patient" | "clinician";

type PatientProfile = {
  age: number | string;
  sex: Sex | "";
  pregnant: "yes" | "no" | "";
  childPatient: "yes" | "no" | "";
  symptom: Symptom | "";
  severity: number | string;
  chronic: "yes" | "no" | "";
  emergency: "yes" | "no" | "";
  location: string;
  durationDays: number | string;
  fever: "yes" | "no" | "";
  breathingIssue: "yes" | "no" | "";
  radiatingPain: "yes" | "no" | "";
  exertionalPain: "yes" | "no" | "";
  confusion: "yes" | "no" | "";
  dehydration: "yes" | "no" | "";
  selfHarmRisk: "yes" | "no" | "";
  chestTightness: "yes" | "no" | "";
  neuroWarning: "yes" | "no" | "";
  insurance: InsuranceFund | "";
  medications: string;
  allergies: string;
  diagnoses: string;
};

const LANGUAGES: { label: string; locale: Locale }[] = [
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

const symptomOptions: Symptom[] = [
  "Chest pain",
  "Shortness of breath",
  "Headache",
  "Dizziness / vertigo",
  "Abdominal pain",
  "Nausea / vomiting",
  "Fever",
  "Back pain",
  "Skin rash",
  "Anxiety / panic",
  "Depression",
  "Self-harm",
  "Suicidal ideation",
  "Medication refill",
  "Sick note (AU)",
  "Lab results",
];

const initialProfile: PatientProfile = {
  age: "",
  sex: "",
  pregnant: "",
  childPatient: "",
  symptom: "",
  severity: "",
  chronic: "",
  emergency: "",
  location: "",
  durationDays: "",
  fever: "",
  breathingIssue: "",
  radiatingPain: "",
  exertionalPain: "",
  confusion: "",
  dehydration: "",
  selfHarmRisk: "",
  chestTightness: "",
  neuroWarning: "",
  insurance: "",
  medications: "",
  allergies: "",
  diagnoses: "",
};

function providerSupportsInsurance(provider: Provider, insurance: string) {
  if (!insurance) return true;
  if (!provider.insuranceAccepted || provider.insuranceAccepted.length === 0) return true;
  return provider.insuranceAccepted.includes(insurance);
}

function getProviderType(provider: Provider) {
  return provider.providerType || "Hospital";
}

function mapProviders(data: RawProvider[]): Provider[] {
  return data.map((p) => ({
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
    expertise: p.nursing_ratio ? Math.min(100, Math.round(p.nursing_ratio)) : 60,
    occupancy: p.load_score ?? (p.annual_cases ? Math.min(95, Math.round(p.annual_cases / 300)) : 50),
    wait: p.amenity === "hospital" ? 45 : 20,
    erLoad: p.er_load ?? undefined,
  }));
}

function rankProviders(
  targetSpecialty: string,
  preferAmbulatory: boolean,
  query: string,
  insurance: string,
  providerList: Provider[]
): RankedProvider[] {
  const q = query.trim().toLowerCase();

  return [...providerList]
    .filter((provider) => {
      if (!providerSupportsInsurance(provider, insurance)) return false;
      if (!q) return true;
      return (
        provider.city?.toLowerCase().includes(q) ||
        provider.state?.toLowerCase().includes(q) ||
        provider.zip?.includes(q) ||
        provider.name?.toLowerCase().includes(q)
      );
    })
    .map((provider) => {
      const ambulatory = Number(provider.ambulatory) || 50;
      const expertise = Number(provider.expertise) || 50;
      const occupancy = Number(provider.occupancy) || 50;
      const wait = Number(provider.wait) || 30;
      const specialties = provider.specialties || [];
      const specialtyMatch = specialties.some((s) =>
        s.toLowerCase().includes(targetSpecialty.toLowerCase())
      )
        ? 35
        : 8;

      const ambulatoryBoost = preferAmbulatory && getProviderType(provider) !== "Hospital" ? 18 : 0;
      const match = Math.round(
        specialtyMatch + ambulatoryBoost + expertise * 0.35 - occupancy * 0.2 - wait * 0.1
      );

      return {
        ...provider,
        providerType: getProviderType(provider),
        telemedicineAvailable: Boolean(provider.telemedicineAvailable),
        openingHours: provider.openingHours || "08:00 - 18:00",
        referralRequired: typeof provider.referralRequired === "boolean" ? provider.referralRequired : false,
        insuranceAccepted: provider.insuranceAccepted || insuranceFunds,
        erLoad: provider.erLoad ?? (occupancy > 85 ? "Crowded" : occupancy > 60 ? "Moderate" : "Normal"),
        availableBeds: Math.max(0, Math.floor((100 - occupancy) / 2)),
        specialistAvail: wait < 30 ? "Available now" : `In ${wait} mins`,
        match,
      };
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 6);
}

function yesNo(value: string) {
  return value === "yes";
}

function buildTriageFHIR(profile: PatientProfile, triage: any) {
  const resource: any = {
    resourceType: "ClinicalImpression",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/ClinicalImpression"],
      tag: [
        {
          system: "https://medsync.demo/CodeSystem/project-status",
          code: "demo",
          display: "Demo output - not clinically validated",
        },
      ],
    },
    status: "completed",
    subject: {
      display: "Synthetic demo patient",
    },
    summary: triage.title || "Care routing recommendation",
    description: [
      profile.age ? `Age: ${profile.age}` : null,
      profile.sex ? `Sex: ${profile.sex}` : null,
      profile.insurance ? `Insurance: ${profile.insurance}` : null,
      profile.location ? `Location: ${profile.location}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    finding: [
      {
        itemCodeableConcept: {
          text: profile.symptom || "Unspecified symptom",
          coding: triage.snomedCode
            ? [
                {
                  system: "http://snomed.info/sct",
                  code: String(triage.snomedCode),
                  display: String(profile.symptom || triage.specialty || "Symptom"),
                },
              ]
            : undefined,
        },
      },
    ],
    prognosisCodeableConcept: [
      {
        coding: [
          {
            system: "https://medsync.demo/CodeSystem/care-pathway",
            code: String(triage.pathway || triage.title || "unknown"),
            display: String(triage.title || "Recommended care pathway"),
          },
        ],
        text: triage.carePath || triage.title || "Recommended care pathway",
      },
    ],
    extension: [
      {
        url: "https://medsync.demo/fhir/StructureDefinition/triage-score",
        valueInteger: Number(triage.score) || 0,
      },
      {
        url: "https://medsync.demo/fhir/StructureDefinition/recommended-specialty",
        valueString: String(triage.germanSpecialty || triage.specialty || "Unknown"),
      },
      {
        url: "https://medsync.demo/fhir/StructureDefinition/symptom-severity",
        valueInteger: Number(profile.severity) || 0,
      },
    ],
  };

  if (triage.icd10Code) {
    resource.investigation = [
      {
        code: {
          coding: [
            {
              system: "http://fhir.de/CodeSystem/bfarm/icd-10-gm",
              code: String(triage.icd10Code),
              display: String(triage.title || "Care routing impression"),
            },
          ],
          text: "ICD-10-GM demo mapping",
        },
      },
    ];
  }

  if (profile.durationDays) {
    resource.extension.push({
      url: "https://medsync.demo/fhir/StructureDefinition/symptom-duration",
      valueDuration: {
        value: Number(profile.durationDays) || 0,
        unit: "days",
        system: "http://unitsofmeasure.org",
        code: "d",
      },
    });
  }

  if (triage.triageColor) {
    resource.extension.push({
      url: "https://medsync.demo/fhir/StructureDefinition/triage-color",
      valueCode: String(triage.triageColor),
    });
  }

  if (triage.redFlags?.length > 0) {
    resource.note = [
      {
        text: `Red flags: ${triage.redFlags.join(", ")}`,
      },
    ];
  }

  return JSON.parse(JSON.stringify(resource));
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>("en");
 const [sessionId] = useState(() =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
);
  const [view, setView] = useState<ViewMode>("patient");
  const [profile, setProfile] = useState<PatientProfile>(initialProfile);
  const [consentGiven, setConsentGiven] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "bot", text: createTranslator("en")("chat.greeting") },
  ]);
  const [careContext, setCareContext] = useState<GermanCareContext>(() => getGermanCareContext("en"));
  const [realProviders, setRealProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [auditHistory, setAuditHistory] = useState<Record<string, string | number>[]>([]);
  const [bookingProvider, setBookingProvider] = useState<RankedProvider | null>(null);

  const t = createTranslator(locale);
  const rtl = isRTL(locale);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  function updateProfile<K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    setCareContext(getGermanCareContext(locale));
    const timer = window.setInterval(() => setCareContext(getGermanCareContext(locale)), 60000);
    return () => window.clearInterval(timer);
  }, [locale]);

  useEffect(() => {
    const translator = createTranslator(locale);
    setChatHistory([{ role: "bot", text: translator("chat.greeting") }]);
  }, [locale]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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

  const triage = useMemo(
    () =>
      triageEngine(
        {
          age: Number(profile.age),
          symptom: profile.symptom as Symptom,
          severity: Number(profile.severity),
          chronic: yesNo(profile.chronic),
          emergency: yesNo(profile.emergency),
          durationDays: Number(profile.durationDays),
          fever: yesNo(profile.fever),
          breathingIssue: yesNo(profile.breathingIssue),
          chestTightness: yesNo(profile.chestTightness),
          neuroWarning: yesNo(profile.neuroWarning),
          sex: profile.sex as Sex,
          pregnant: yesNo(profile.pregnant),
          childPatient: yesNo(profile.childPatient) || Number(profile.age) < 16,
          medications: profile.medications,
          allergies: profile.allergies,
          diagnoses: profile.diagnoses,
          insurance: profile.insurance as InsuranceFund,
          radiatingPain: yesNo(profile.radiatingPain),
          exertionalPain: yesNo(profile.exertionalPain),
          confusion: yesNo(profile.confusion),
          dehydration: yesNo(profile.dehydration),
          selfHarmRisk: yesNo(profile.selfHarmRisk),
        },
        locale
      ),
    [profile, locale]
  );

  const safetyComplete = Boolean(
    profile.emergency &&
    profile.breathingIssue &&
    profile.chestTightness &&
    profile.neuroWarning &&
    profile.confusion &&
    profile.selfHarmRisk
  );

  const emergencyOverride =
    profile.emergency === "yes" ||
    profile.breathingIssue === "yes" ||
    profile.chestTightness === "yes" ||
    profile.neuroWarning === "yes" ||
    profile.confusion === "yes" ||
    profile.selfHarmRisk === "yes";

  const coreComplete = Boolean(
    profile.symptom &&
    profile.age &&
    profile.severity &&
    safetyComplete
  );

  const profileProgress = [profile.symptom, profile.age, profile.severity, profile.location, profile.insurance].filter(Boolean).length;
  const assessmentReady = coreComplete;

  useEffect(() => {
    async function fetchProviders() {
      if (!assessmentReady || triage.dispatch112 || emergencyOverride) return;
      setLoadingProviders(true);

      try {
        let url = "";
        if (gpsStatus === "granted" && userLat && userLon) {
          url = `/api/providers?mode=nearby&lat=${userLat}&lon=${userLon}&insurance=${encodeURIComponent(
            profile.insurance
          )}&specialty=${encodeURIComponent(triage.specialty)}`;
        } else if (profile.location.trim()) {
          url = `/api/providers?mode=search&q=${encodeURIComponent(profile.location)}&insurance=${encodeURIComponent(
            profile.insurance
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
    }

    const timer = window.setTimeout(fetchProviders, 500);
    return () => window.clearTimeout(timer);
  }, [assessmentReady, triage.dispatch112, emergencyOverride, triage.specialty, gpsStatus, userLat, userLon, profile.location, profile.insurance]);

  useEffect(() => {
    if (!assessmentReady) return;

    const auditKey = `${profile.symptom}-${profile.age}-${profile.severity}-${triage.title}-${triage.score}`;
    const lastAudit = auditHistory[0];

    if (lastAudit) {
      const lastKey = `${lastAudit.symptom}-${lastAudit.age}-${lastAudit.severity}-${lastAudit.title}-${lastAudit.score}`;
      if (lastKey === auditKey) return;
    }

    setAuditHistory((prev) =>
      [
        {
          timestamp: new Date().toLocaleString(),
          symptom: String(profile.symptom),
          age: String(profile.age),
          severity: String(profile.severity),
          sex: String(profile.sex || "—"),
          insurance: String(profile.insurance || "—"),
          title: triage.title,
          specialty: triage.specialty,
          score: triage.score,
          redFlags: triage.redFlags.length,
        },
        ...prev,
      ].slice(0, 20)
    );

    if (!consentGiven) return;

    encryptFields({
      symptom: String(profile.symptom),
      age: String(profile.age),
      sex: String(profile.sex || ""),
      medications: profile.medications,
      allergies: profile.allergies,
      diagnoses: profile.diagnoses,
      location: profile.location,
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
        insurance: profile.insurance,
        severity: Number(profile.severity) || null,
        duration_days: Number(profile.durationDays) || null,
        pathway: triage.pathway,
        title: triage.title,
        score: triage.score,
        triage_color: triage.triageColor,
        red_flags: triage.redFlags,
        specialty: triage.specialty,
        german_specialty: triage.germanSpecialty,
        icd10_code: triage.icd10Code,
        snomed_code: triage.snomedCode,
        locale,
      });
    });
  }, [
    assessmentReady,
    consentGiven,
    profile.symptom,
    profile.age,
    profile.severity,
    profile.sex,
    profile.medications,
    profile.allergies,
    profile.diagnoses,
    profile.location,
    profile.insurance,
    profile.durationDays,
    triage.pathway,
    triage.title,
    triage.score,
    triage.triageColor,
    triage.redFlags,
    triage.specialty,
    triage.germanSpecialty,
    triage.icd10Code,
    triage.snomedCode,
    locale,
    sessionId,
    auditHistory,
  ]);

  const rankedProviders = useMemo(
    () =>
      rankProviders(
        triage.specialty,
        triage.title !== "HOSPITAL ER",
        profile.location,
        profile.insurance,
        realProviders
      ),
    [triage.specialty, triage.title, profile.location, profile.insurance, realProviders]
  );

  async function handleChatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = chatInput.trim();
    if (!input) return;

    const userMessage: ChatMessage = { role: "user", text: input };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory([...updatedHistory, { role: "bot", text: "..." }]);
    setChatInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
          triageState: profile,
          locale,
        }),
      });

      const data = await res.json();
      const updates = data.updates || {};

      setProfile((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [
            key,
            typeof value === "boolean" ? (value ? "yes" : "no") : value,
          ])
        ),
      }));

      setChatHistory([
        ...updatedHistory,
        { role: "bot", text: data.message || "I could not process that. Please try again." },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory([...updatedHistory, { role: "bot", text: "Something went wrong. Please try again." }]);
    }
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] text-neutral-900" dir={rtl ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white">+</div>
            <div>
              <div className="text-xl font-black tracking-tight"><span className="text-red-600">Med</span>Sync</div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">German care routing</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedButton active={view === "patient"} onClick={() => setView("patient")} icon={<User size={15} />}>
              Patient flow
            </SegmentedButton>
            <SegmentedButton active={view === "clinician"} onClick={() => setView("clinician")} icon={<LayoutDashboard size={15} />}>
              Clinician view
            </SegmentedButton>
          </div>
        </div>
      </header>

      <DemoBanner />

      {view === "patient" ? (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-4xl">Start with one symptom. Get the safest next step.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                Use the chat or update the answer summary. The recommendation appears only after the core safety details are available.
              </p>
            </div>
            <LanguageSelector locale={locale} onSelect={setLocale} />
          </div>

          {careContext.isOutOfHours && <OutOfHoursBanner careContext={careContext} locale={locale} />}

          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck size={16} className="text-blue-700" />
              Data protection design
            </div>
            <p className="mt-2 text-xs leading-relaxed">
              Events are encrypted before storage. Production deployment would require GDPR Article 9 assessment, 
              DPIA, consent management, retention rules, access controls, and legal review.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[390px_1fr_390px]">
            <ChatPanel
              chatHistory={chatHistory}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleChatSubmit={handleChatSubmit}
              chatBottomRef={chatBottomRef}
            />

            <ReviewPanel 
              profile={profile} 
              updateProfile={updateProfile} 
              progress={profileProgress}
              consentGiven={consentGiven}
              setConsentGiven={setConsentGiven}
              assessmentReady={assessmentReady}
            />

            <RecommendationPanel
              ready={assessmentReady}
              emergencyOverride={emergencyOverride}
              triage={triage}
              profile={profile}
              rankedProviders={rankedProviders}
              loadingProviders={loadingProviders}
              gpsStatus={gpsStatus}
              onBook={setBookingProvider}
            />
          </div>
        </section>
      ) : (
        <ClinicianView auditHistory={auditHistory} triage={triage} providers={rankedProviders} />
      )}

      {bookingProvider && (
        <BookingModal provider={bookingProvider} onClose={() => setBookingProvider(null)} />
      )}
    </main>
  );
}

function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
      <div className="mx-auto max-w-7xl">
        Demonstration only. This is not a medical diagnosis or emergency service. For life-threatening symptoms in Germany, call 112.
      </div>
    </div>
  );
}

function SegmentedButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? "bg-neutral-900 text-white shadow" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function LanguageSelector({ locale, onSelect }: { locale: Locale; onSelect: (locale: Locale) => void }) {
  return (
    <div className="flex w-fit rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
      {LANGUAGES.map((language) => (
        <button
          key={language.locale}
          onClick={() => onSelect(language.locale)}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            locale === language.locale ? "bg-red-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

function OutOfHoursBanner({ careContext, locale }: { careContext: GermanCareContext; locale: Locale }) {
  return (
    <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-100 p-4 text-amber-950">
      <div className="font-black">
        {careContext.isWeekend
          ? locale === "de"
            ? "Wochenende — außerhalb der Sprechzeiten"
            : "Weekend — outside GP hours"
          : locale === "de"
          ? "Außerhalb der Sprechzeiten"
          : "Outside office hours"}
      </div>
      <div className="mt-1 text-sm leading-relaxed">{careContext.recommendation}</div>
    </div>
  );
}

function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      {...props}
      className={`rounded-3xl border border-black/5 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function ChatPanel({
  chatHistory,
  chatInput,
  setChatInput,
  handleChatSubmit,
  chatBottomRef,
}: {
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleChatSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Card className="flex h-[620px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-black/5 bg-[#faf8f3] px-5 py-4">
        <MessageSquare size={20} className="text-red-600" />
        <div>
          <div className="font-black">Symptom chat</div>
          <div className="text-xs text-neutral-500">One question at a time</div>
        </div>
        <span className="ml-auto rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">AI guided</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {chatHistory.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "bot" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "bot" ? "bg-neutral-100 text-neutral-900" : "bg-red-600 text-white"
              }`}
            >
              {message.text === "..." ? <span className="tracking-[5px] text-neutral-400">●●●</span> : message.text}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-black/5 bg-white p-4">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Describe your main symptom..."
          className="min-w-0 flex-1 rounded-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
        <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">
          Send
        </button>
      </form>
    </Card>
  );
}

function ReviewPanel({
  profile,
  updateProfile,
  progress,
  consentGiven,
  setConsentGiven,
  assessmentReady,
}: {
  profile: PatientProfile;
  updateProfile: <K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) => void;
  progress: number;
  consentGiven: boolean;
  setConsentGiven: (value: boolean) => void;
  assessmentReady: boolean;
}) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-black"><ClipboardList size={18} className="text-red-600" /> Review answers</div>
            <p className="mt-1 text-sm text-neutral-500">Edit only what is missing or incorrect.</p>
          </div>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">{progress}/5 core</div>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full bg-red-600 transition-all" style={{ width: `${Math.min(100, (progress / 5) * 100)}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Age">
            <input className="input" type="number" value={profile.age} onChange={(e) => updateProfile("age", e.target.value)} placeholder="e.g. 45" />
          </Field>
          <Field label="Sex">
            <select className="input" value={profile.sex} onChange={(e) => updateProfile("sex", e.target.value as Sex)}>
              <option value="">Select</option>
              {sexes.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
            </select>
          </Field>
          <Field label="Main symptom">
            <select className="input" value={profile.symptom} onChange={(e) => updateProfile("symptom", e.target.value as Symptom)}>
              <option value="">Select symptom</option>
              {symptomOptions.map((symptom) => <option key={symptom} value={symptom}>{symptom}</option>)}
            </select>
          </Field>
          <Field label="Severity">
            <select className="input" value={String(profile.severity)} onChange={(e) => updateProfile("severity", e.target.value)}>
              <option value="">Select</option>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n}/10</option>)}
            </select>
          </Field>
          <Field label="Location">
            <input className="input" value={profile.location} onChange={(e) => updateProfile("location", e.target.value)} placeholder="City or postcode" />
          </Field>
          <Field label="Insurance">
            <select className="input" value={profile.insurance} onChange={(e) => updateProfile("insurance", e.target.value as InsuranceFund)}>
              <option value="">Select</option>
              {insuranceFunds.map((fund) => <option key={fund} value={fund}>{fund}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 font-black"><AlertOctagon size={18} className="text-red-600" /> Safety questions</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <YesNo label="Emergency signs" value={profile.emergency} onChange={(v) => updateProfile("emergency", v)} />
          <YesNo label="Breathing difficulty" value={profile.breathingIssue} onChange={(v) => updateProfile("breathingIssue", v)} />
          <YesNo label="Chest tightness" value={profile.chestTightness} onChange={(v) => updateProfile("chestTightness", v)} />
          <YesNo label="Neurological warning" value={profile.neuroWarning} onChange={(v) => updateProfile("neuroWarning", v)} />
          <YesNo label="Confusion" value={profile.confusion} onChange={(v) => updateProfile("confusion", v)} />
          <YesNo label="Self-harm risk" value={profile.selfHarmRisk} onChange={(v) => updateProfile("selfHarmRisk", v)} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 font-black">Medical background</div>
        <div className="space-y-3">
          <textarea className="input min-h-[74px]" value={profile.medications} onChange={(e) => updateProfile("medications", e.target.value)} placeholder="Current medications" />
          <input className="input" value={profile.allergies} onChange={(e) => updateProfile("allergies", e.target.value)} placeholder="Allergies" />
          <input className="input" value={profile.diagnoses} onChange={(e) => updateProfile("diagnoses", e.target.value)} placeholder="Known diagnoses" />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 font-black">
          <ShieldCheck size={18} className="text-red-600" /> 
          Data storage consent
        </div>
        <label className="flex items-start gap-3 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-red-600 focus:ring-2 focus:ring-red-500"
          />
          <span className="leading-relaxed">
            I understand this is a demo and agree that my entered information (including symptoms, 
            age, sex, medications, allergies, diagnoses, and location) may be stored securely 
            for audit and testing purposes.
          </span>
        </label>
        {!consentGiven && assessmentReady && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Note:</strong> Your triage assessment is displayed without saving data. 
            Check the box above to enable storage for the proposal demo.
          </div>
        )}
      </Card>

      {assessmentReady && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-green-700">Assessment Complete</div>
          <p className="mb-3 text-xs leading-relaxed text-green-800">
            Your care recommendation is ready. Review the suggested pathway in the right panel.
          </p>
          <button
            onClick={() => {
              const recommendationPanel = document.querySelector('[data-panel="recommendation"]');
              recommendationPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            className="rounded-full bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800"
          >
            View recommendation →
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: "yes" | "no" | ""; onChange: (value: "yes" | "no") => void }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-3">
      <div className="mb-2 text-xs font-bold text-neutral-600">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {(["no", "yes"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              value === option ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {option === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function FHIRExportButton({
  profile,
  triage,
}: {
  profile: PatientProfile;
  triage: any;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const fhirResource = buildTriageFHIR(profile, triage);
    const formatted = JSON.stringify(fhirResource, null, 2);

    await navigator.clipboard.writeText(formatted);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-700"
      title="Copy FHIR-style ClinicalImpression demo output"
    >
      {copied ? "Copied ✓" : "Copy FHIR demo output"}
    </button>
  );
}

function RecommendationPanel({
  ready,
  emergencyOverride,
  triage,
  profile,
  rankedProviders,
  loadingProviders,
  gpsStatus,
  onBook,
}: {
  ready: boolean;
  emergencyOverride: boolean;
  triage: any;
  profile: PatientProfile;
  rankedProviders: RankedProvider[];
  loadingProviders: boolean;
  gpsStatus: "pending" | "granted" | "denied";
  onBook: (provider: RankedProvider) => void;
}) {
  if (!ready) {
    return (
      <Card className="p-8 text-center" data-panel="recommendation">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">🩺</div>
        <h2 className="text-xl font-black">Assessment incomplete</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          Complete age, symptom, severity, and safety questions before showing a care recommendation.
        </p>
      </Card>
    );
  }

  if (triage.dispatch112 || emergencyOverride) {
    return (
      <div className="space-y-5" data-panel="recommendation">
        <div className="rounded-3xl bg-red-800 p-6 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <Ambulance size={40} className="shrink-0" />
            <div>
              <h2 className="text-2xl font-black">Call 112 now</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Emergency warning signs were detected. Do not wait for provider search or online booking.
              </p>
            </div>
          </div>
        </div>
        <ExplainabilityCard triage={triage} />
      </div>
    );
  }

  if (triage.pathway === "KBD_116117" && !triage.dispatch112) {
    return (
      <div className="space-y-5" data-panel="recommendation">
        <Card className="border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-900 text-white">
              <Stethoscope size={32} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-700">Medical On-Call Service</div>
              <h2 className="mt-1 text-2xl font-black text-amber-900">Call 116117</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900">
                This case may be suitable for the Ärztlicher Bereitschaftsdienst (medical on-call service) outside regular GP hours. 
                Available evenings, nights, weekends, and public holidays.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-700">When to call 116117</div>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              <li>• Medical issue that can't wait until next GP appointment</li>
              <li>• Outside regular practice hours (evenings, weekends, holidays)</li>
              <li>• Not life-threatening but needs medical attention soon</li>
            </ul>
          </div>
        </Card>
        <ExplainabilityCard triage={triage} />
      </div>
    );
  }

  const Icon = triage.title === "VIRTUAL CONSULT" ? Video : Stethoscope;

  return (
    <div className="space-y-5" data-panel="recommendation">
      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white"><Icon size={28} /></div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recommended next step</div>
              <h2 className="text-2xl font-black text-neutral-900">{triage.title}</h2>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{triage.score}/100</div>
            <div className="text-xs text-neutral-400">acuity</div>
          </div>
        </div>

        <p className="rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">{triage.carePath}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniFact label="Specialty" value={triage.germanSpecialty || triage.specialty} />
          <MiniFact label="Referral" value={triage.requiredReferral ? "Required" : "Not required"} />
          <MiniFact label="ICD-10-GM" value={triage.icd10Code || "—"} />
          <MiniFact label="Insurance" value={profile.insurance || "—"} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
          <div className="text-xs text-neutral-500">Export triage output for integration testing</div>
          <FHIRExportButton profile={profile} triage={triage} />
        </div>
      </Card>

      {triage.redFlags.length > 0 && <RedFlagCard flags={triage.redFlags} />}
      <ProviderList providers={rankedProviders} loading={loadingProviders} gpsStatus={gpsStatus} onBook={onBook} />
      <ExplainabilityCard triage={triage} />
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3">
      <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-1 break-words text-xs font-black text-neutral-800">{value}</div>
    </div>
  );
}

function RedFlagCard({ flags }: { flags: string[] }) {
  return (
    <Card className="border-red-200 bg-red-50 p-5">
      <div className="mb-3 flex items-center gap-2 font-black text-red-800"><AlertOctagon size={18} /> Safety flags</div>
      <ul className="space-y-2 text-sm text-red-800">
        {flags.map((flag, index) => <li key={`${flag}-${index}`}>• {flag}</li>)}
      </ul>
    </Card>
  );
}

function ProviderList({ providers, loading, gpsStatus, onBook }: { providers: RankedProvider[]; loading: boolean; gpsStatus: string; onBook: (provider: RankedProvider) => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-black"><MapPin size={18} className="text-red-600" /> Provider options</div>
        <div className="text-xs font-bold text-neutral-400">GPS: {gpsStatus}</div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Searching nearby providers...</p>}
      {!loading && providers.length === 0 && <p className="text-sm text-neutral-500">Add a city/postcode or allow location access to see providers.</p>}

      <div className="space-y-3">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-black">{provider.name}</div>
                <div className="mt-1 text-xs text-neutral-500">{provider.providerType} · {provider.city || provider.state || provider.zip || "Location unknown"}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{provider.specialistAvail}</Badge>
                  <Badge>{provider.erLoad}</Badge>
                  {provider.referralRequired && <Badge>Referral required</Badge>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-red-600">{provider.match}</div>
                <div className="text-[11px] text-neutral-400">match</div>
              </div>
            </div>
            <button onClick={() => onBook(provider)} className="mt-4 w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">
              Request appointment
            </button>
          </div>
        ))}
      </div>

      {providers.length > 0 && (
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          Provider ranking is a demo based on available data, location, insurance, specialty match, and estimated load. 
          It does not confirm appointment availability or clinical suitability. Always verify provider credentials and 
          availability through official channels.
        </p>
      )}
    </Card>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600">{children}</span>;
}

function ExplainabilityCard({ triage }: { triage: any }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 font-black"><ShieldCheck size={18} className="text-red-600" /> Why this recommendation?</div>
      <ul className="space-y-2 text-sm leading-relaxed text-neutral-600">
        {triage.auditTrace?.slice(0, 5).map((line: string, index: number) => <li key={`${line}-${index}`}>• {line}</li>)}
      </ul>
    </Card>
  );
}

function ClinicianView({ auditHistory, triage, providers }: { auditHistory: Record<string, string | number>[]; triage: any; providers: RankedProvider[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Clinician dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Operational view for audit trace, pathway distribution, and provider routing review.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Current pathway" value={triage.title || "—"} />
        <Metric label="Acuity score" value={triage.score || "—"} />
        <Metric label="Red flags" value={triage.redFlags?.length || 0} />
        <Metric label="Providers" value={providers.length} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Validation status" value="Not clinically validated" />
        <Metric label="Deployment stage" value="Prototype / Demo" />
        <Metric label="Safety review" value="Pending clinician review" />
      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck size={16} className="text-blue-700" />
          Data protection architecture
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <div>
            <div className="font-bold text-blue-800">Encryption</div>
            <div className="leading-relaxed">Data encrypted before storage in demo environment</div>
          </div>
          <div>
            <div className="font-bold text-blue-800">Compliance scope</div>
            <div className="leading-relaxed">GDPR Article 9, German medical confidentiality, DPIA required</div>
          </div>
          <div>
            <div className="font-bold text-blue-800">Production requirements</div>
            <div className="leading-relaxed">Legal review, consent framework, retention policies, access logs</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 font-black"><ClipboardList size={18} className="text-red-600" /> Recent triage events</div>
          <div className="space-y-2">
            {auditHistory.length === 0 && <p className="text-sm text-neutral-500">No events yet.</p>}
            {auditHistory.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-2xl border border-neutral-200 p-3 text-sm md:grid-cols-[1.2fr_1fr_1fr_.5fr]">
                <span className="text-neutral-500">{String(entry.timestamp)}</span>
                <span className="font-bold">{String(entry.symptom || "—")}</span>
                <span className="font-bold text-red-600">{String(entry.title || "—")}</span>
                <span>{String(entry.score || "—")}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 font-black"><Sparkles size={18} className="text-red-600" /> Clinical codes</div>
            <div className="space-y-3">
              <MiniFact label="Specialty" value={triage.specialty || "—"} />
              <MiniFact label="German specialty" value={triage.germanSpecialty || "—"} />
              <MiniFact label="ICD-10-GM" value={triage.icd10Code || "—"} />
              <MiniFact label="SNOMED CT" value={triage.snomedCode || "—"} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 font-black"><ShieldCheck size={18} className="text-red-600" /> Clinical governance</div>
            <ul className="space-y-2 text-sm leading-relaxed text-neutral-600">
              <li>• Triage rules require clinician review before deployment</li>
              <li>• Red-flag logic must be safety-tested against emergency cases</li>
              <li>• All pathway recommendations are logged for audit</li>
              <li>• Clinicians can override routing decisions in production design</li>
              <li>• System outputs are advisory only, not diagnostic</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] font-black uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-neutral-900">{value}</div>
    </Card>
  );
}

function BookingModal({ provider, onClose }: { provider: RankedProvider; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Request appointment</h2>
            <p className="mt-1 text-sm text-neutral-500">{provider.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-black">×</button>
        </div>
        <div className="space-y-3 text-sm text-neutral-600">
          <p><strong>Type:</strong> {provider.providerType}</p>
          <p><strong>Availability:</strong> {provider.specialistAvail}</p>
          <p><strong>Opening hours:</strong> {provider.openingHours}</p>
          <p><strong>Referral:</strong> {provider.referralRequired ? "Required" : "Not required"}</p>
        </div>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700">
          Confirm demo request
        </button>
      </div>
    </div>
  );
}