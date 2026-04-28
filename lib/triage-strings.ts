// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — Triage Output Strings
//
// All patient-facing strings produced by the triage engine, in both languages.
// The engine itself stays locale-agnostic — it calls getString(locale, key)
// to pick the right text at the point of output.
//
// WHAT IS TRANSLATED HERE:
//   - pathway titles (HOSPITAL ER, VIRTUAL CONSULT, etc.)
//   - carePath instructions (what the patient should do)
//   - red flag messages
//   - follow-up questions
//   - coverage / referral notes
//
// WHAT IS NOT TRANSLATED HERE:
//   - auditTrace (clinician/FHIR/audit — stays English)
//   - SNOMED display names (international standard)
//   - ICD-10 display names (already German by BfArM convention)
//   - germanSpecialty (already German)
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from "./i18n";

// ── Vocabulary terms ──────────────────────────────────────────────────────────
// Single source of truth for recurring medical/system terms.
// Use term(locale, "key") in CARE_PATHS, COVERAGE_NOTES etc. instead of
// duplicating the same word in every string.
const TERMS: Record<Locale, Record<string, string>> = {
  en: {
    gp:              "GP",
    specialist:      "specialist",
    gkv:             "GKV",
    privateIns:      "private insurance",
    outOfHours:      "out-of-hours service",
    referral:        "referral",
    noReferral:      "no referral required",
    appointmentLine: "Appointment service: 116 117",
    callNow:         "Call 112 immediately",
    crisisLine:      "Crisis line: 0800 111 0 111 (free, 24h)",
    paediatrician:   "paediatrician (Kinderarzt)",
    gynaecologist:   "gynaecologist",
    erDept:          "emergency department",
    inpatient:       "inpatient assessment",
    videoConsult:    "video consultation",
  },
  de: {
    gp:              "Hausarzt",
    specialist:      "Facharzt",
    gkv:             "GKV",
    privateIns:      "Privatversicherung",
    outOfHours:      "Bereitschaftsdienst",
    referral:        "Überweisung",
    noReferral:      "keine Überweisung erforderlich",
    appointmentLine: "Terminservicestelle: 116 117",
    callNow:         "Sofort 112 anrufen",
    crisisLine:      "Krisentelefon: 0800 111 0 111 (kostenlos, 24h)",
    paediatrician:   "Kinderarzt",
    gynaecologist:   "Frauenarzt",
    erDept:          "Notaufnahme",
    inpatient:       "stationäre Abklärung",
    videoConsult:    "Videosprechstunde",
  },
};

// Look up a vocabulary term for the given locale.
// Falls back to English if the locale key is missing.
export function term(locale: Locale, key: string): string {
  return TERMS[locale]?.[key] ?? TERMS.en[key] ?? key;
}

// ── Pathway titles ────────────────────────────────────────────────────────────
export const PATHWAY_TITLES: Record<string, Record<Locale, string>> = {
  AMBULANCE_112: {
    en: "AMBULANCE 112",
    de: "NOTRUF 112",
  },
  HOSPITAL_ER: {
    en: "HOSPITAL ER",
    de: "NOTAUFNAHME",
  },
  HOSPITAL_SPECIALIST: {
    en: "HOSPITAL SPECIALIST",
    de: "STATIONÄRE FACHBEHANDLUNG",
  },
  AMBULATORY_CARE: {
    en: "AMBULATORY CARE",
    de: "AMBULANTE VERSORGUNG",
  },
  VIRTUAL_CONSULT: {
    en: "VIRTUAL CONSULT",
    de: "VIRTUELLE KONSULTATION",
  },
  BEREITSCHAFTSDIENST: {
    en: "BEREITSCHAFTSDIENST",
    de: "BEREITSCHAFTSDIENST",
  },
  PSYCHIATRIC_EMERGENCY: {
    en: "PSYCHIATRIC EMERGENCY",
    de: "PSYCHIATRISCHER NOTFALL",
  },
};

// ── Care path instructions ────────────────────────────────────────────────────
// Built with term() so recurring words stay consistent across both languages.
// To change e.g. "Appointment service: 116 117" in German, update TERMS.de.appointmentLine.
function buildCarePaths(): Record<string, Record<Locale, string>> {
  // loc() is the fix for "Expression of type 'Locale' can't be used to index
  // type '{ en: string; de: string }'" — TypeScript infers object literals as
  // { en: string; de: string } not Record<Locale, string>, so indexing with a
  // Locale variable produces an implicit-any. Wrapping in loc() forces the type.
  const loc = (o: Record<Locale, string>): Record<Locale, string> => o;

  return {
    ambulance_med_risk: loc({
      en: `Medical emergency due to medication risk. ${term("en", "callNow")}.`,
      de: `Medizinischer Notfall aufgrund von Medikationsrisiko. ${term("de", "callNow")}.`,
    }),
    ambulance_general: loc({
      en: "Call emergency services 112 immediately. Do not leave the patient. Administer first aid until paramedics arrive.",
      de: "Sofort den Notruf 112 anrufen. Den Patienten nicht allein lassen. Erste Hilfe leisten bis der Rettungsdienst eintrifft.",
    }),
    psychiatric_emergency: loc({
      en: `Go to psychiatric ${term("en", "erDept")}. Emergency: 112. ${term("en", "crisisLine")}.`,
      de: `Psychiatrische ${term("de", "erDept")} aufsuchen. Notruf: 112. ${term("de", "crisisLine")}.`,
    }),
    hospital_er_redflag: loc({
      en: `Go immediately to the nearest ${term("en", "erDept")}. No ${term("en", "gp")} required. Call 112 if condition worsens.`,
      de: `Sofort die nächste ${term("de", "erDept")} aufsuchen. Kein ${term("de", "gp")} erforderlich. Bei Verschlechterung 112 anrufen.`,
    }),
    hospital_er_highrisk: loc({
      en: `Immediate ${term("en", "erDept")} required. No ${term("en", "gp")} required.`,
      de: `Sofortige ${term("de", "erDept")} erforderlich. Kein ${term("de", "gp")} erforderlich.`,
    }),
    hospital_specialist: loc({
      en: `${term("en", "inpatient")} recommended.`,
      de: `${term("de", "inpatient")} empfohlen.`,
    }),
    ambulatory_paediatric: loc({
      en: `See a ${term("en", "paediatrician")}. No ${term("en", "referral")} required. Out-of-hours: 116 117.`,
      de: `Einen ${term("de", "paediatrician")} aufsuchen. Keine ${term("de", "referral")} erforderlich. Außerhalb der Sprechzeiten: 116 117.`,
    }),
    ambulatory_obstetric: loc({
      en: `See a ${term("en", "gynaecologist")}. Pregnant patients can access obstetric care directly without ${term("en", "referral")}.`,
      de: `Einen ${term("de", "gynaecologist")} aufsuchen. Schwangere können direkt ohne ${term("de", "referral")} zur Geburtshilfe.`,
    }),
    ambulatory_specialist: loc({
  en: `See a {{specialty}}. ${term("en", "gkv")} patients: ${term("en", "referral")} from ${term("en", "gp")} recommended (§ 73 SGB V). ${term("en", "appointmentLine")}.`,
  de: `Einen {{specialty}} aufsuchen. ${term("de", "gkv")}-Patienten: ${term("de", "referral")} vom ${term("de", "gp")} empfohlen (§ 73 SGB V). ${term("de", "appointmentLine")}.`,
}),
    virtual_admin: loc({
      en: `${term("en", "videoConsult")} or phone appointment with ${term("en", "gp")} possible (§ 291g SGB V). ${term("en", "appointmentLine")}.`,
      de: `${term("de", "videoConsult")} oder telefonischer Termin beim ${term("de", "gp")} möglich (§ 291g SGB V). ${term("de", "appointmentLine")}.`,
    }),
    virtual_low_severity: loc({
      en: `${term("en", "videoConsult")} with ${term("en", "gp")} is sufficient. ${term("en", "appointmentLine")}.`,
      de: `${term("de", "videoConsult")} beim ${term("de", "gp")} ausreichend. ${term("de", "appointmentLine")}.`,
    }),
    ambulatory_gp: loc({
      en: `${term("en", "gp")} visit recommended. ${term("en", "appointmentLine")}.`,
      de: `${term("de", "gp")}besuch empfohlen. ${term("de", "appointmentLine")}.`,
    }),
  };
}

// Evaluated once at module load — safe because TERMS is a plain object constant.
export const CARE_PATHS: Record<string, Record<Locale, string>> = buildCarePaths();

// ── Red flag messages ─────────────────────────────────────────────────────────
export const RED_FLAGS: Record<string, Record<Locale, string>> = {
  psychiatric_emergency: {
    en: "Psychiatric emergency — immediate crisis intervention required",
    de: "Psychiatrischer Notfall — sofortige Krisenintervention erforderlich",
  },
  suicidal_ideation: {
    en: "Suicidal ideation (R45.8 ICD-10-GM) — do not leave alone. Crisis line: 0800 111 0 111",
    de: "Suizidgedanken (R45.8 ICD-10-GM) — nicht allein lassen. Krisentelefon: 0800 111 0 111",
  },
  meningitis: {
    en: "Meningitis suspected (G00/G03 ICD-10-GM): headache + fever + neck stiffness — immediate ER required",
    de: "Meningitis-Verdacht (G00/G03 ICD-10-GM): Kopfschmerz + Fieber + Nackensteifigkeit — sofortige Notaufnahme",
  },
  appendicitis: {
    en: "Appendicitis suspected (K37 ICD-10-GM): abdominal pain + fever — surgical assessment required",
    de: "Appendizitis-Verdacht (K37 ICD-10-GM): Bauchschmerzen + Fieber — chirurgische Abklärung erforderlich",
  },
  dka: {
    en: "Diabetic ketoacidosis suspected (E10.1/E11.1 ICD-10-GM): diabetic + vomiting + confusion/dehydration",
    de: "Diabetische Ketoazidose-Verdacht (E10.1/E11.1 ICD-10-GM): Diabetiker + Erbrechen + Verwirrtheit/Dehydration",
  },
  stemi: {
    en: "STEMI suspected (I21 ICD-10-GM): chest pain + radiation + exertion → Call 112 immediately",
    de: "STEMI-Verdacht (I21 ICD-10-GM): Brustschmerz + Ausstrahlung + Belastung → Sofort 112 anrufen",
  },
  stroke: {
    en: "Stroke suspected (I63 ICD-10-GM, FAST criteria) → Call 112 immediately",
    de: "Schlaganfall-Verdacht (I63 ICD-10-GM, FAST-Kriterien) → Sofort 112 anrufen",
  },
  respiratory_failure: {
    en: "Severe respiratory failure (J96 ICD-10-GM) → Call 112 immediately",
    de: "Schweres Atemversagen (J96 ICD-10-GM) → Sofort 112 anrufen",
  },
  anaphylaxis: {
    en: "Anaphylaxis (T78.2 ICD-10-GM) → Call 112 immediately",
    de: "Anaphylaxie (T78.2 ICD-10-GM) → Sofort 112 anrufen",
  },
  obstetric_emergency: {
    en: "Obstetric emergency → Call 112 immediately",
    de: "Geburtshilflicher Notfall → Sofort 112 anrufen",
  },
  loss_of_consciousness: {
    en: "Loss of consciousness (R55 ICD-10-GM) → Call 112, recovery position",
    de: "Bewusstlosigkeit (R55 ICD-10-GM) → 112 anrufen, stabile Seitenlage",
  },
  sepsis: {
    en: "Sepsis suspected (A41.9 ICD-10-GM): fever + confusion → Call 112 immediately",
    de: "Sepsis-Verdacht (A41.9 ICD-10-GM): Fieber + Verwirrtheit → Sofort 112 anrufen",
  },
  breathing_difficulty: {
    en: "Breathing difficulty — exclude pulmonary or cardiac cause",
    de: "Atembeschwerden — pulmonale oder kardiale Ursache ausschließen",
  },
  chest_tightness: {
    en: "Chest tightness — acute coronary syndrome not excluded (I20-I25 ICD-10-GM)",
    de: "Brustenge — akutes Koronarsyndrom nicht ausgeschlossen (I20-I25 ICD-10-GM)",
  },
  radiating_pain: {
    en: "Radiating pain — ACS pattern (I21 ICD-10-GM)",
    de: "Ausstrahlender Schmerz — ACS-Muster (I21 ICD-10-GM)",
  },
  neuro_warning: {
    en: "Neurological warning signs — exclude stroke (I63 ICD-10-GM, FAST)",
    de: "Neurologische Warnsymptome — Schlaganfall ausschließen (I63 ICD-10-GM, FAST)",
  },
  confusion: {
    en: "Altered consciousness (R41.3 ICD-10-GM) — immediate assessment required",
    de: "Bewusstseinsveränderung (R41.3 ICD-10-GM) — sofortige Abklärung erforderlich",
  },
  high_fever: {
    en: "High fever + high intensity — exclude sepsis qSOFA (A41.9 ICD-10-GM)",
    de: "Hohes Fieber + hohe Intensität — Sepsis qSOFA ausschließen (A41.9 ICD-10-GM)",
  },
  dehydration_risk: {
    en: "Dehydration in risk patient (E86 ICD-10-GM) — consider hospitalisation",
    de: "Dehydration bei Risikopatient (E86 ICD-10-GM) — Krankenhauseinweisung erwägen",
  },
  fever_pregnancy: {
    en: "Fever in pregnancy — urgent obstetric assessment (O98 ICD-10-GM)",
    de: "Fieber in der Schwangerschaft — dringende geburtshilfliche Abklärung (O98 ICD-10-GM)",
  },
  rectal_bleeding: {
    en: "Rectal bleeding (K92.1 ICD-10-GM) — surgical assessment required",
    de: "Rektale Blutung (K92.1 ICD-10-GM) — chirurgische Abklärung erforderlich",
  },
  scrotal_pain: {
    en: "Scrotal pain — exclude testicular torsion (N44 ICD-10-GM, surgical emergency)",
    de: "Hodenschmerz — Hodentorsion ausschließen (N44 ICD-10-GM, chirurgischer Notfall)",
  },
  haemoptysis: {
    en: "Haemoptysis (R04.2 ICD-10-GM) — exclude pulmonary embolism or malignancy",
    de: "Hämoptyse (R04.2 ICD-10-GM) — Lungenembolie oder Malignom ausschließen",
  },
  jaundice: {
    en: "Jaundice (R17 ICD-10-GM) — exclude liver failure or biliary obstruction",
    de: "Ikterus (R17 ICD-10-GM) — Leberversagen oder Gallenabflusshindernis ausschließen",
  },
};

// ── Follow-up questions ───────────────────────────────────────────────────────
export const FOLLOW_UP_QUESTIONS: Record<string, Record<Locale, string[]>> = {
  "Chest pain": {
    en: ["How long have you had the chest pain?", "Does the pain radiate to your arm, jaw, or back?", "Does it worsen with physical exertion?"],
    de: ["Wie lange haben Sie die Brustschmerzen schon?", "Strahlt der Schmerz in Arm, Kiefer oder Rücken aus?", "Werden die Schmerzen bei körperlicher Belastung schlimmer?"],
  },
  "Shortness of breath": {
    en: ["Does it occur at rest or only with exertion?", "Do you have pain when breathing?", "Do you have a cough or produce sputum?"],
    de: ["Tritt es in Ruhe oder nur bei Belastung auf?", "Haben Sie Schmerzen beim Atmen?", "Haben Sie Husten oder Auswurf?"],
  },
  "Headache": {
    en: ["Is this the worst headache of your life?", "Do you have neck stiffness or light sensitivity?", "Did it come on suddenly?"],
    de: ["Ist das der schlimmste Kopfschmerz Ihres Lebens?", "Haben Sie Nackensteifigkeit oder Lichtempfindlichkeit?", "Kam er plötzlich?"],
  },
  "Abdominal pain": {
    en: ["Where exactly is the pain located?", "Do you have nausea, vomiting, or diarrhoea?", "When did you last eat?"],
    de: ["Wo genau befindet sich der Schmerz?", "Haben Sie Übelkeit, Erbrechen oder Durchfall?", "Wann haben Sie zuletzt gegessen?"],
  },
  "Fever": {
    en: ["What is your measured temperature?", "Do you have chills or heavy sweating?", "Do you have a cough, sore throat, or runny nose?"],
    de: ["Wie hoch ist Ihre gemessene Temperatur?", "Haben Sie Schüttelfrost oder starkes Schwitzen?", "Haben Sie Husten, Halsschmerzen oder Schnupfen?"],
  },
  "Child fever": {
    en: ["What is the child's temperature?", "How old is the child?", "Is the child drinking fluids normally?"],
    de: ["Wie hoch ist die Temperatur des Kindes?", "Wie alt ist das Kind?", "Trinkt das Kind normal?"],
  },
  "Stroke symptoms": {
    en: ["When exactly did the symptoms start?", "Do you have one-sided weakness or numbness?", "Do you have speech problems or visual disturbances?"],
    de: ["Wann genau haben die Symptome begonnen?", "Haben Sie einseitige Schwäche oder Taubheitsgefühl?", "Haben Sie Sprachprobleme oder Sehstörungen?"],
  },
  "Seizure": {
    en: ["Have you had seizures before?", "How long did the seizure last?", "Did you injure yourself during the seizure?"],
    de: ["Hatten Sie schon früher Krampfanfälle?", "Wie lange dauerte der Anfall?", "Haben Sie sich während des Anfalls verletzt?"],
  },
  "Pelvic pain": {
    en: ["Could you be pregnant?", "When was your last period?", "Do you have fever or unusual discharge?"],
    de: ["Könnten Sie schwanger sein?", "Wann war Ihre letzte Periode?", "Haben Sie Fieber oder ungewöhnlichen Ausfluss?"],
  },
  "Vaginal bleeding": {
    en: ["Are you pregnant?", "How heavy is the bleeding?", "Do you have pain alongside the bleeding?"],
    de: ["Sind Sie schwanger?", "Wie stark ist die Blutung?", "Haben Sie Schmerzen zusammen mit der Blutung?"],
  },
  "Suicidal ideation": {
    en: ["Do you have a specific plan or means?", "Are there people around you you can turn to?"],
    de: ["Haben Sie einen konkreten Plan oder Mittel?", "Gibt es Menschen in Ihrer Umgebung, an die Sie sich wenden können?"],
  },
  "Self-harm": {
    en: ["Are you in immediate danger?", "Is there someone with you right now?"],
    de: ["Sind Sie in unmittelbarer Gefahr?", "Ist gerade jemand bei Ihnen?"],
  },
  "Back pain": {
    en: ["Do you have tingling or numbness in your legs?", "Do you have bladder or bowel problems?", "Did the pain start after an injury?"],
    de: ["Haben Sie Kribbeln oder Taubheitsgefühl in den Beinen?", "Haben Sie Blasen- oder Darmprobleme?", "Begann der Schmerz nach einer Verletzung?"],
  },
  "Urinary symptoms": {
    en: ["Do you have burning when urinating?", "Do you have fever or flank pain?", "How long have you had these symptoms?"],
    de: ["Haben Sie Brennen beim Wasserlassen?", "Haben Sie Fieber oder Flankenschmerzen?", "Wie lange haben Sie diese Symptome schon?"],
  },
  "Scrotal pain": {
    en: ["How long have you had this pain?", "Did it start suddenly?", "Is there swelling or redness?"],
    de: ["Wie lange haben Sie diesen Schmerz schon?", "Begann er plötzlich?", "Gibt es Schwellung oder Rötung?"],
  },
};

export const DEFAULT_QUESTIONS: Record<Locale, string[]> = {
  en: ["How long have you had these symptoms?", "Have you had similar symptoms before?", "Are you currently taking any medications?"],
  de: ["Wie lange haben Sie diese Symptome schon?", "Hatten Sie ähnliche Symptome schon früher?", "Nehmen Sie aktuell Medikamente ein?"],
};

// ── Coverage / referral notes ─────────────────────────────────────────────────
// loc() tells TypeScript that { en: ..., de: ... } is Record<Locale, string>,
// making it safely indexable with a Locale variable at runtime.
const loc = (o: Record<Locale, string>): Record<Locale, string> => o;

export const COVERAGE_NOTES: Record<string, Record<Locale, string>> = {
  private: loc({
    en: `Private patients can access ${term("en", "specialist")}s directly. Check reimbursement under GOÄ.`,
    de: `Privatpatienten können ${term("de", "specialist")}ärzte direkt aufsuchen. Kostenerstattung nach GOÄ prüfen.`,
  }),
  emergency: loc({
    en: `Emergency treatment covered for all ${term("en", "gkv")} patients without co-payment — § 76 SGB V.`,
    de: `Notfallbehandlung für alle ${term("de", "gkv")}-Versicherten ohne Zuzahlung — § 76 SGB V.`,
  }),
  kbd: loc({
    en: `116 117 ${term("en", "outOfHours")} is free for all ${term("en", "gkv")} patients. No ${term("en", "referral")} required.`,
    de: `116 117 ${term("de", "outOfHours")} ist für alle ${term("de", "gkv")}-Versicherten kostenlos. Keine ${term("de", "referral")} erforderlich.`,
  }),
  specialist_referral: loc({
    en: `${term("en", "gkv")}: ${term("en", "gp")} ${term("en", "referral")} required for ${term("en", "specialist")} (§ 73 SGB V). ${term("en", "appointmentLine")}.`,
    de: `${term("de", "gkv")}: ${term("de", "referral")} vom ${term("de", "gp")} zum ${term("de", "specialist")} erforderlich (§ 73 SGB V). ${term("de", "appointmentLine")}.`,
  }),
  standard: loc({
    en: `${term("en", "gkv")} service covered. Possible co-payment of €10 per quarter under § 28 SGB V.`,
    de: `${term("de", "gkv")}-Leistung gedeckt. Mögliche Zuzahlung von €10 pro Quartal gemäß § 28 SGB V.`,
  }),
  ambulance_covered: loc({
    en: "Emergency treatment covered for all insured without co-payment — § 76 SGB V",
    de: "Notfallbehandlung für alle Versicherten ohne Zuzahlung — § 76 SGB V",
  }),
  psychiatric_covered: loc({
    en: "Psychiatric emergency care covered for all insured",
    de: "Psychiatrische Notfallversorgung für alle Versicherten gedeckt",
  }),
};

// no_referral_emergency stays in German in both locales — it is a legal
// citation (§ 76 SGB V) that remains German by medical convention.
export const REFERRAL_NOTES: Record<string, Record<Locale, string>> = {
  no_referral_emergency: loc({
    en: "Kein Überweisungsschein erforderlich — Notfall (§ 76 SGB V)",
    de: "Kein Überweisungsschein erforderlich — Notfall (§ 76 SGB V)",
  }),
  no_referral_gp: loc({
    en: `${term("en", "gp")} visit without ${term("en", "referral")} possible`,
    de: `${term("de", "gp")}besuch ohne ${term("de", "referral")} möglich`,
  }),
  no_referral_direct: loc({
    en: `Direct access without ${term("en", "referral")} possible`,
    de: `Direktzugang ohne ${term("de", "referral")} möglich`,
  }),
  no_referral_emergency_specialist: loc({
    en: `Emergency — direct ${term("en", "specialist")} access without ${term("en", "referral")} (§ 76 Abs. 1 SGB V)`,
    de: `Notfall — Direktzugang zum ${term("de", "specialist")} ohne ${term("de", "referral")} (§ 76 Abs. 1 SGB V)`,
  }),
  no_referral_private: loc({
    en: `Private patients can access ${term("en", "specialist")}s directly.`,
    de: `Privatpatienten können ${term("de", "specialist")}ärzte direkt aufsuchen.`,
  }),
  no_referral_psychiatric: loc({
    en: `No ${term("en", "referral")} required — psychiatric emergency`,
    de: `Keine ${term("de", "referral")} erforderlich — psychiatrischer Notfall`,
  }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// s() — look up any translated string map by key + locale
export function s(map: Record<string, Record<Locale, string>>, key: string, locale: Locale): string {
  return map[key]?.[locale] ?? map[key]?.en ?? key;
}

// getFollowUpQs() — return symptom-specific questions in the right language
export function getFollowUpQs(symptom: string, locale: Locale): string[] {
  return FOLLOW_UP_QUESTIONS[symptom]?.[locale]
    ?? FOLLOW_UP_QUESTIONS[symptom]?.en
    ?? DEFAULT_QUESTIONS[locale];
}