export type Locale = "en" | "de";

export type TranslationKey =
  | "nav.patientApp"
  | "nav.clinicianPortal"
  | "nav.subtitle"
  | "chat.title"
  | "chat.powered"
  | "chat.placeholder"
  | "chat.send"
  | "chat.greeting"
  | "location.title"
  | "location.gpsActive"
  | "location.placeholder"
  | "location.placeholderGps"
  | "profile.title"
  | "profile.collapse"
  | "profile.expand"
  | "profile.insuranceFund"
  | "profile.age"
  | "profile.sex"
  | "profile.mainSymptom"
  | "profile.severity"
  | "profile.pregnancy"
  | "profile.childCase"
  | "profile.chronicDisease"
  | "profile.emergencySigns"
  | "profile.symptomDuration"
  | "profile.fever"
  | "profile.breathingDifficulty"
  | "profile.painRadiates"
  | "profile.painExertion"
  | "profile.confusion"
  | "profile.dehydration"
  | "profile.selfHarm"
  | "profile.chestTightness"
  | "profile.neuroWarning"
  | "profile.medications"
  | "profile.allergies"
  | "profile.diagnoses"
  | "profile.runTriage"
  | "profile.coverageNote"
  | "profile.selectInsurance"
  | "profile.selectSex"
  | "profile.selectSymptom"
  | "profile.selectSeverity"
  | "profile.selectDuration"
  | "profile.yes"
  | "profile.no"
  | "profile.adult"
  | "profile.child"
  | "profile.day1"
  | "profile.days2"
  | "profile.days3"
  | "profile.week1"
  | "profile.weeks2"
  | "triage.recommendedPathway"
  | "triage.acuityScore"
  | "triage.specialty"
  | "triage.referral"
  | "triage.insurance"
  | "triage.mtsColor"
  | "triage.icd10"
  | "triage.snomed"
  | "triage.redFlagTitle"
  | "triage.triageQuestions"
  | "triage.explainability"
  | "triage.disclaimer"
  | "triage.decisionTrace"
  | "triage.referralRequired"
  | "triage.referralNotRequired"
  | "providers.title"
  | "providers.loading"
  | "providers.pending"
  | "providers.denied"
  | "providers.notFound"
  | "providers.match"
  | "providers.bookAppointment"
  | "providers.startTelemed"
  | "providers.generateReferral"
  | "ambulance.title"
  | "ambulance.callNow"
  | "clinician.title"
  | "clinician.subtitle"
  | "clinician.totalIntake"
  | "clinician.virtualRouted"
  | "clinician.ambulatoryRouted"
  | "clinician.erEscalations"
  | "clinician.redFlagRate"
  | "clinician.erSavings"
  | "clinician.savingsNote"
  | "clinician.pathwayBar"
  | "clinician.pathwayDonut"
  | "clinician.acuityTrend"
  | "clinician.triageAccuracy"
  | "clinician.erAvoidance"
  | "clinician.ambulatoryShift"
  | "clinician.bookingsCompleted"
  | "clinician.avgAcuity"
  | "clinician.override"
  | "clinician.overridePathway"
  | "clinician.justification"
  | "clinician.noOverride"
  | "clinician.auditTrail"
  | "clinician.noEvents"
  | "clinician.ofIntake"
  | "clinician.casesFlagged"
  | "booking.confirm"
  | "booking.about"
  | "booking.insurance"
  | "booking.slot"
  | "booking.confirmBtn"
  | "booking.cancel"
  | "feedback.title"
  | "feedback.subtitle"
  | "feedback.accurate"
  | "feedback.erAvoided"
  | "feedback.ambulatoryShift"
  | "feedback.save"
  | "category.cardiovascular"
  | "category.respiratory"
  | "category.neurological"
  | "category.gastrointestinal"
  | "category.musculoskeletal"
  | "category.dermatological"
  | "category.ent"
  | "category.urological"
  | "category.gynaecological"
  | "category.paediatric"
  | "category.mentalHealth"
  | "category.general"
  | "category.administrative";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  "nav.patientApp": "Patient App",
  "nav.clinicianPortal": "Clinician Portal",
  "nav.subtitle": "AI Care Routing Infrastructure",
  "chat.title": "Triage Assistant",
  "chat.powered": "● AI Powered",
  "chat.placeholder": "Describe your symptoms naturally...",
  "chat.send": "Send",
  "chat.greeting":
    "You're in the right place. Let's go through a few quick questions about your symptoms.",
  "location.title": "Your location",
  "location.gpsActive": "📍 GPS active",
  "location.placeholder": "Type city, ZIP or state...",
  "location.placeholderGps": "GPS active — or type to override",
  "profile.title": "Advanced patient profile",
  "profile.collapse": "▲ collapse",
  "profile.expand": "▼ expand",
  "profile.insuranceFund": "Insurance fund",
  "profile.age": "Age",
  "profile.sex": "Sex",
  "profile.mainSymptom": "Main symptom",
  "profile.severity": "Severity",
  "profile.pregnancy": "Pregnancy",
  "profile.childCase": "Child case",
  "profile.chronicDisease": "Chronic disease",
  "profile.emergencySigns": "Emergency signs",
  "profile.symptomDuration": "Symptom duration",
  "profile.fever": "Fever",
  "profile.breathingDifficulty": "Breathing difficulty",
  "profile.painRadiates": "Pain radiates",
  "profile.painExertion": "Pain on exertion",
  "profile.confusion": "Confusion",
  "profile.dehydration": "Dehydration",
  "profile.selfHarm": "Self-harm risk",
  "profile.chestTightness": "Chest tightness",
  "profile.neuroWarning": "Neurological warning",
  "profile.medications": "Current medications",
  "profile.allergies": "Allergies",
  "profile.diagnoses": "Known diagnoses",
  "profile.runTriage": "Run AI triage",
  "profile.coverageNote": "Coverage note",
  "profile.selectInsurance": "Select insurance...",
  "profile.selectSex": "Select...",
  "profile.selectSymptom": "Select symptom...",
  "profile.selectSeverity": "Select...",
  "profile.selectDuration": "Select...",
  "profile.yes": "Yes",
  "profile.no": "No",
  "profile.adult": "Adult",
  "profile.child": "Child",
  "profile.day1": "1 day",
  "profile.days2": "2 days",
  "profile.days3": "3 days",
  "profile.week1": "1 week",
  "profile.weeks2": "2+ weeks",
  "triage.recommendedPathway": "RECOMMENDED PATHWAY",
  "triage.acuityScore": "Acuity Score",
  "triage.specialty": "Specialty",
  "triage.referral": "Referral",
  "triage.insurance": "Insurance",
  "triage.mtsColor": "MTS Color",
  "triage.icd10": "ICD-10-GM",
  "triage.snomed": "SNOMED",
  "triage.redFlagTitle": "CLINICAL RED FLAG ESCALATION",
  "triage.triageQuestions": "Structured triage questions",
  "triage.explainability": "Explainability & compliance",
  "triage.disclaimer":
    "This prototype supports care routing and does not replace physician judgment. Emergency symptoms require immediate medical attention.",
  "triage.decisionTrace": "Decision trace",
  "triage.referralRequired": "Überweisung required",
  "triage.referralNotRequired": "Not required",
  "providers.title": "Matched facilities & actions",
  "providers.loading": "— loading...",
  "providers.pending": "Requesting your location...",
  "providers.denied":
    "Enter a city, ZIP, or state above to find nearby providers.",
  "providers.notFound": "No providers found in this area.",
  "providers.match": "match",
  "providers.bookAppointment": "Book Appointment",
  "providers.startTelemed": "Start Telemed",
  "providers.generateReferral": "Generate Referral",
  "ambulance.title": "EMERGENCY — CALL 112 NOW",
  "ambulance.callNow": "Call ambulance immediately",
  "clinician.title": "Network Workload, Outcomes & Audit Dashboard",
  "clinician.subtitle":
    "Live triage analytics, outcome KPIs, and decision governance.",
  "clinician.totalIntake": "Total Intake",
  "clinician.virtualRouted": "Virtual Routed",
  "clinician.ambulatoryRouted": "Ambulatory Routed",
  "clinician.erEscalations": "ER Escalations",
  "clinician.redFlagRate": "Red Flag Rate",
  "clinician.erSavings": "ER Deflection Savings",
  "clinician.savingsNote": "est. at €280/ER visit avoided",
  "clinician.pathwayBar": "Pathway distribution — bar",
  "clinician.pathwayDonut": "Pathway distribution — donut",
  "clinician.acuityTrend": "Acuity score trend",
  "clinician.triageAccuracy": "Triage Accuracy",
  "clinician.erAvoidance": "ER Avoidance",
  "clinician.ambulatoryShift": "Ambulatory Shift",
  "clinician.bookingsCompleted": "Bookings Completed",
  "clinician.avgAcuity": "Avg Acuity Score",
  "clinician.override": "Clinician override",
  "clinician.overridePathway": "Override pathway",
  "clinician.justification": "Clinical justification",
  "clinician.noOverride": "No override",
  "clinician.auditTrail": "Recent audit trail",
  "clinician.noEvents": "No triage events recorded yet.",
  "clinician.ofIntake": "% of intake",
  "clinician.casesFlagged": "cases flagged",
  "booking.confirm": "Confirm",
  "booking.about": "You are about to generate a",
  "booking.insurance": "Insurance pathway",
  "booking.slot": "Facility slot is reserved for 15 minutes.",
  "booking.confirmBtn": "Confirm",
  "booking.cancel": "Cancel",
  "feedback.title": "Consultation Complete",
  "feedback.subtitle":
    "Save structured outcome metrics for model validation and investor KPI reporting.",
  "feedback.accurate": "Was the triage acuity accurate?",
  "feedback.erAvoided": "Did this avoid an unnecessary ER visit?",
  "feedback.ambulatoryShift":
    "Did this shift the patient into ambulatory care safely?",
  "feedback.save": "Save outcome metric",
  "category.cardiovascular": "Cardiovascular",
  "category.respiratory": "Respiratory",
  "category.neurological": "Neurological",
  "category.gastrointestinal": "Gastrointestinal",
  "category.musculoskeletal": "Musculoskeletal",
  "category.dermatological": "Dermatological",
  "category.ent": "ENT",
  "category.urological": "Urological",
  "category.gynaecological": "Gynaecological",
  "category.paediatric": "Paediatric",
  "category.mentalHealth": "Mental health",
  "category.general": "General / systemic",
  "category.administrative": "Administrative",
};

const de: Partial<Translations> = {
  "nav.patientApp": "Patienten-App",
  "nav.clinicianPortal": "Arzt-Portal",
  "nav.subtitle": "KI-gestützte Versorgungssteuerung",
  "chat.title": "Triage-Assistent",
  "chat.powered": "● KI-gestützt",
  "chat.placeholder": "Beschreiben Sie Ihre Symptome...",
  "chat.send": "Senden",
  "chat.greeting":
    "Sie sind hier richtig. Lassen Sie uns ein paar kurze Fragen zu Ihren Symptomen durchgehen.",
  "location.title": "Ihr Standort",
  "location.gpsActive": "📍 GPS aktiv",
  "location.placeholder": "Stadt, PLZ oder Bundesland eingeben...",
  "location.placeholderGps": "GPS aktiv — oder überschreiben",
  "profile.title": "Erweitertes Patientenprofil",
  "profile.collapse": "▲ einklappen",
  "profile.expand": "▼ ausklappen",
  "profile.insuranceFund": "Krankenkasse",
  "profile.age": "Alter",
  "profile.sex": "Geschlecht",
  "profile.mainSymptom": "Hauptsymptom",
  "profile.severity": "Schweregrad",
  "profile.pregnancy": "Schwangerschaft",
  "profile.childCase": "Kinderfall",
  "profile.chronicDisease": "Chronische Erkrankung",
  "profile.emergencySigns": "Notfallzeichen",
  "profile.symptomDuration": "Beschwerdedauer",
  "profile.fever": "Fieber",
  "profile.breathingDifficulty": "Atembeschwerden",
  "profile.painRadiates": "Schmerzausstrahlung",
  "profile.painExertion": "Belastungsschmerz",
  "profile.confusion": "Verwirrtheit",
  "profile.dehydration": "Dehydration",
  "profile.selfHarm": "Selbstverletzungsrisiko",
  "profile.chestTightness": "Brustenge",
  "profile.neuroWarning": "Neurologische Warnsymptome",
  "profile.medications": "Aktuelle Medikamente",
  "profile.allergies": "Allergien",
  "profile.diagnoses": "Bekannte Diagnosen",
  "profile.runTriage": "KI-Triage starten",
  "profile.coverageNote": "Versicherungshinweis",
  "profile.selectInsurance": "Krankenkasse wählen...",
  "profile.selectSex": "Auswählen...",
  "profile.selectSymptom": "Symptom wählen...",
  "profile.selectSeverity": "Auswählen...",
  "profile.selectDuration": "Auswählen...",
  "profile.yes": "Ja",
  "profile.no": "Nein",
  "profile.adult": "Erwachsener",
  "profile.child": "Kind",
  "profile.day1": "1 Tag",
  "profile.days2": "2 Tage",
  "profile.days3": "3 Tage",
  "profile.week1": "1 Woche",
  "profile.weeks2": "2+ Wochen",
  "triage.recommendedPathway": "EMPFOHLENER PFAD",
  "triage.acuityScore": "Schweregrad-Score",
  "triage.specialty": "Fachgebiet",
  "triage.referral": "Überweisung",
  "triage.insurance": "Versicherung",
  "triage.mtsColor": "MTS-Farbe",
  "triage.redFlagTitle": "KLINISCHES WARNSIGNAL",
  "triage.triageQuestions": "Strukturierte Triage-Fragen",
  "triage.explainability": "Transparenz & Compliance",
  "triage.disclaimer":
    "Dieses System unterstützt die Versorgungssteuerung und ersetzt nicht die ärztliche Beurteilung.",
  "triage.decisionTrace": "Entscheidungsverlauf",
  "triage.referralRequired": "Überweisung erforderlich",
  "triage.referralNotRequired": "Nicht erforderlich",
  "providers.title": "Passende Einrichtungen & Aktionen",
  "providers.loading": "— lädt...",
  "providers.pending": "Standort wird abgefragt...",
  "providers.denied":
    "Stadt, PLZ oder Bundesland eingeben, um Anbieter zu finden.",
  "providers.notFound": "Keine Anbieter in diesem Bereich gefunden.",
  "providers.match": "Übereinstimmung",
  "providers.bookAppointment": "Termin buchen",
  "providers.startTelemed": "Telemedizin starten",
  "providers.generateReferral": "Überweisung erstellen",
  "ambulance.title": "NOTFALL — JETZT 112 ANRUFEN",
  "ambulance.callNow": "Sofort Krankenwagen rufen",
  "clinician.title": "Netzwerk-Workload, Ergebnisse & Audit-Dashboard",
  "clinician.subtitle":
    "Live-Triage-Analysen, Ergebnis-KPIs und Entscheidungs-Governance.",
  "clinician.totalIntake": "Gesamtaufnahmen",
  "clinician.virtualRouted": "Virtuell weitergeleitet",
  "clinician.ambulatoryRouted": "Ambulant weitergeleitet",
  "clinician.erEscalations": "Notaufnahme-Eskalationen",
  "clinician.redFlagRate": "Warnsignal-Rate",
  "clinician.erSavings": "Notaufnahme-Vermeidung",
  "clinician.savingsNote": "ca. €280/vermiedener Notaufnahmebesuch",
  "clinician.pathwayBar": "Pfadverteilung — Balken",
  "clinician.pathwayDonut": "Pfadverteilung — Donut",
  "clinician.acuityTrend": "Schweregrad-Trend",
  "clinician.triageAccuracy": "Triage-Genauigkeit",
  "clinician.erAvoidance": "Notaufnahme-Vermeidung",
  "clinician.ambulatoryShift": "Ambulante Verlagerung",
  "clinician.bookingsCompleted": "Abgeschlossene Buchungen",
  "clinician.avgAcuity": "Ø Schweregrad-Score",
  "clinician.override": "Arzt-Override",
  "clinician.overridePathway": "Override-Pfad",
  "clinician.justification": "Klinische Begründung",
  "clinician.noOverride": "Kein Override",
  "clinician.auditTrail": "Aktueller Audit-Verlauf",
  "clinician.noEvents": "Noch keine Triage-Ereignisse aufgezeichnet.",
  "clinician.ofIntake": "% der Aufnahmen",
  "clinician.casesFlagged": "Fälle markiert",
  "booking.confirm": "Bestätigen",
  "booking.about": "Sie sind dabei, ein/eine zu erstellen",
  "booking.insurance": "Versicherungspfad",
  "booking.slot": "Einrichtungsslot für 15 Minuten reserviert.",
  "booking.confirmBtn": "Bestätigen",
  "booking.cancel": "Abbrechen",
  "feedback.title": "Konsultation abgeschlossen",
  "feedback.subtitle":
    "Strukturierte Ergebnismetriken für Modellvalidierung speichern.",
  "feedback.accurate": "War die Triage-Einstufung korrekt?",
  "feedback.erAvoided": "Wurde ein unnötiger Notaufnahmebesuch vermieden?",
  "feedback.ambulatoryShift":
    "Wurde der Patient sicher in ambulante Versorgung überführt?",
  "feedback.save": "Ergebnismetrik speichern",
  "category.cardiovascular": "Herz-Kreislauf",
  "category.respiratory": "Atemwege",
  "category.neurological": "Neurologie",
  "category.gastrointestinal": "Magen-Darm",
  "category.musculoskeletal": "Bewegungsapparat",
  "category.dermatological": "Dermatologie",
  "category.ent": "HNO",
  "category.urological": "Urologie",
  "category.gynaecological": "Gynäkologie",
  "category.paediatric": "Pädiatrie",
  "category.mentalHealth": "Psychische Gesundheit",
  "category.general": "Allgemein / Systemisch",
  "category.administrative": "Verwaltung",
};

const locales: Record<Locale, Translations> = {
  en,
  de: { ...en, ...de },
};

export function isRTL(_locale: Locale): boolean {
  return false;
}

export function createTranslator(locale: Locale) {
  return function t(key: TranslationKey): string {
    return locales[locale]?.[key] ?? locales.en[key] ?? key;
  };
}

export function getChatSystemPrompt(locale: Locale): string {
  const base = `You are MedSync, an expert AI medical triage assistant for the German healthcare system. Your role is to quickly gather key clinical information and guide patients to the appropriate care pathway.

You must ALWAYS respond with valid JSON in this exact format:
{"message": "Your conversational response to the patient", "updates": {}}

Available fields for updates: age (number), sex ("female"|"male"|"diverse"), symptom (string), severity (1-10), chronic (boolean), emergency (boolean), durationDays (number), fever (boolean), breathingIssue (boolean), chestTightness (boolean), neuroWarning (boolean), pregnant (boolean), childPatient (boolean), radiatingPain (boolean), exertionalPain (boolean), confusion (boolean), dehydration (boolean), selfHarmRisk (boolean), medications (string), allergies (string), diagnoses (string), insurance (string), location (string), suggestedProviderSearch (string).

Rules:
- Be concise, direct, and avoid repetition.
- Ask at most ONE focused follow-up question, only if necessary.
- Prioritize essential clinical details; skip non-critical questions.
- Do not explain obvious information or add filler text.
- Never diagnose.
- If under 16, set childPatient: true.
- If any emergency signs appear, set emergency: true immediately.
- Default to fewer questions rather than more.
- Always return valid JSON.`;

  const languageInstructions: Record<Locale, string> = {
    en: "Always respond in English.",
    de: "Antworte kurz, direkt und immer auf Deutsch.",
  };

  return `${base}\n\n${languageInstructions[locale] ?? languageInstructions.en}`;
}