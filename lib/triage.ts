// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — Triage Core
//
// Exports: all types, clinical codes, care context, pattern detection,
// medication risk, referral logic, FHIR builder, MTS color.
//
// triageEngine() lives in triage-engine.ts and imports from here.
// This file does NOT import from triage-strings.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from "./i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Symptom =
  | "Chest pain" | "Palpitations" | "Syncope / collapse" | "Leg swelling"
  | "Hypertensive crisis" | "Shortness of breath" | "Cough (acute)" | "Cough (chronic)"
  | "Haemoptysis" | "Stridor / wheeze" | "Headache" | "Dizziness / vertigo"
  | "Seizure" | "Stroke symptoms" | "Weakness / paralysis" | "Tremor"
  | "Memory problems" | "Loss of consciousness" | "Abdominal pain" | "Nausea / vomiting"
  | "Diarrhoea" | "Constipation" | "Rectal bleeding" | "Jaundice" | "Dysphagia"
  | "Back pain" | "Joint pain" | "Limb injury" | "Neck pain" | "Hip pain"
  | "Skin rash" | "Wound / laceration" | "Burn" | "Allergic reaction" | "Insect bite"
  | "Ear pain" | "Sore throat" | "Nosebleed" | "Hearing loss" | "Eye pain"
  | "Eye redness / discharge" | "Urinary symptoms" | "Haematuria" | "Flank pain"
  | "Scrotal pain" | "Pelvic pain" | "Vaginal bleeding" | "Pregnancy concern"
  | "Breast problem" | "Vaginal discharge" | "Child fever" | "Child rash"
  | "Child vomiting" | "Child crying / inconsolable" | "Child injury"
  | "Anxiety / panic" | "Depression" | "Self-harm" | "Psychosis"
  | "Substance intoxication" | "Suicidal ideation" | "Fever" | "Fatigue"
  | "Weight loss" | "Night sweats" | "Lymph node swelling" | "Anaphylaxis"
  | "Medication refill" | "Follow-up question" | "Sick note (AU)"
  | "Vaccination" | "Lab results";

export type Sex = "female" | "male" | "diverse";

export type InsuranceFund =
  | "AOK" | "TK" | "Barmer" | "DAK" | "IKK" | "BKK" | "Private Insurance";

export type CarePathway =
  | "AMBULANCE_112" | "HOSPITAL_ER" | "HOSPITAL_SPECIALIST"
  | "AMBULATORY_SPECIALIST" | "AMBULATORY_GP" | "VIRTUAL_CONSULT"
  | "PSYCHIATRIC_EMERGENCY" | "KBD_116117";

export type TriageColor = "red" | "orange" | "yellow" | "green" | "blue";

export interface FHIRTriageOutput {
  resourceType: "ClinicalImpression";
  status: "completed";
  subject: { reference: string };
  date: string;
  description: string;
  finding: { itemCodeableConcept: { coding: { system: string; code: string; display: string }[] } }[];
  note: { text: string }[];
  extension: { url: string; valueString?: string; valueCode?: string; valueBoolean?: boolean }[];
}

export interface TriageResult {
  title: string;
  carePath: string;
  pathway: CarePathway;
  triageColor: TriageColor;
  score: number;
  snomedCode: string;
  snomedDisplay: string;
  icd10Code: string;
  icd10Display: string;
  specialty: string;
  germanSpecialty: string;
  requiredReferral: boolean;
  referralNote: string;
  coverageNote: string;
  dispatch112: boolean;
  isOutOfHours: boolean;
  outOfHoursNote: string;
  redFlags: string[];
  questions: string[];
  auditTrace: string[];
  fhir: FHIRTriageOutput;
}

export interface GermanCareContext {
  isOutOfHours: boolean;
  isWeekend: boolean;
  currentHour: number;
  dayOfWeek: number;
  dayName: string;
  recommendation: string;
  kbdActive: boolean;
}

export interface TriageInput {
  age: number;
  sex: Sex;
  symptom: Symptom;
  severity: number;
  chronic: boolean;
  emergency: boolean;
  durationDays: number;
  fever: boolean;
  breathingIssue: boolean;
  chestTightness: boolean;
  neuroWarning: boolean;
  pregnant: boolean;
  childPatient: boolean;
  radiatingPain: boolean;
  exertionalPain: boolean;
  confusion: boolean;
  dehydration: boolean;
  selfHarmRisk: boolean;
  medications: string;
  allergies: string;
  diagnoses: string;
  insurance: InsuranceFund;
}

export interface MedicationRisk {
  scoreBoost: number;
  redFlags: string[];
  auditNotes: string[];
  pathwayEscalation: boolean;
  escalateTo112: boolean;
}

export interface ClinicalCode {
  snomed: string;
  snomedDisplay: string;
  icd10: string;
  icd10Display: string;
  specialty: string;
  germanSpecialty: string;
  defaultPathway: CarePathway;
  gpDirect: boolean;
  adminOnly: boolean;
  baseScoreBoost: number;
}

// ── Clinical codes ────────────────────────────────────────────────────────────
// Wrapped in a getter to avoid Webpack module-init crash in Next.js 15.
// A large top-level object literal causes "__webpack_modules__[moduleId] is not
// a function" during SSR bundle evaluation. Lazy init defers past Webpack init.

let _clinicalCodesCache: Record<Symptom, ClinicalCode> | null = null;

export function getClinicalCodes(): Record<Symptom, ClinicalCode> {
  if (_clinicalCodesCache) return _clinicalCodesCache;
  _clinicalCodesCache = {
    "Chest pain":                  { snomed: "29857009",  snomedDisplay: "Chest pain (finding)",                       icd10: "R07.4",  icd10Display: "Thoraxschmerz, nicht näher bezeichnet",                                                  specialty: "Cardiology",          germanSpecialty: "Kardiologie",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    Palpitations:                  { snomed: "80313002",  snomedDisplay: "Palpitations (finding)",                     icd10: "R00.2",  icd10Display: "Palpitationen",                                                                           specialty: "Cardiology",          germanSpecialty: "Kardiologie",        defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 5  },
    "Syncope / collapse":          { snomed: "271594007", snomedDisplay: "Syncope (disorder)",                         icd10: "R55",    icd10Display: "Synkope und Kollaps",                                                                     specialty: "Cardiology",          germanSpecialty: "Kardiologie",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 25 },
    "Leg swelling":                { snomed: "449754000", snomedDisplay: "Swelling of lower limb (finding)",           icd10: "R60.0",  icd10Display: "Umschriebenes Ödem",                                                                      specialty: "Internal Medicine",   germanSpecialty: "Innere Medizin",     defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Hypertensive crisis":         { snomed: "371125006", snomedDisplay: "Labile essential hypertension (disorder)",   icd10: "I10",    icd10Display: "Essentielle (primäre) Hypertonie",                                                        specialty: "Emergency Medicine",  germanSpecialty: "Notaufnahme",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 30 },
    "Shortness of breath":         { snomed: "230145002", snomedDisplay: "Difficulty breathing (finding)",             icd10: "R06.0",  icd10Display: "Dyspnoe",                                                                                 specialty: "Pulmonology",         germanSpecialty: "Pneumologie",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    "Cough (acute)":               { snomed: "49727002",  snomedDisplay: "Cough (finding)",                            icd10: "R05",    icd10Display: "Husten",                                                                                  specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Cough (chronic)":             { snomed: "68154008",  snomedDisplay: "Chronic cough (finding)",                    icd10: "R05",    icd10Display: "Husten, chronisch",                                                                       specialty: "Pulmonology",         germanSpecialty: "Pneumologie",        defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 5  },
    Haemoptysis:                   { snomed: "66857006",  snomedDisplay: "Haemoptysis (finding)",                      icd10: "R04.2",  icd10Display: "Hämoptyse",                                                                               specialty: "Pulmonology",         germanSpecialty: "Pneumologie",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 25 },
    "Stridor / wheeze":            { snomed: "70407001",  snomedDisplay: "Stridor (finding)",                          icd10: "R06.1",  icd10Display: "Stridor",                                                                                 specialty: "Emergency Medicine",  germanSpecialty: "Notaufnahme",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 30 },
    Headache:                      { snomed: "25064002",  snomedDisplay: "Headache (finding)",                         icd10: "R51",    icd10Display: "Kopfschmerz",                                                                             specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Dizziness / vertigo":         { snomed: "404640003", snomedDisplay: "Dizziness (finding)",                        icd10: "R42",    icd10Display: "Schwindel und Taumel",                                                                    specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    Seizure:                       { snomed: "91175000",  snomedDisplay: "Seizure (finding)",                          icd10: "R56.8",  icd10Display: "Sonstige und nicht näher bezeichnete Krämpfe",                                            specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 35 },
    "Stroke symptoms":             { snomed: "230690007", snomedDisplay: "Cerebrovascular accident (disorder)",        icd10: "I63.9",  icd10Display: "Hirninfarkt, nicht näher bezeichnet",                                                     specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "AMBULANCE_112",       gpDirect: false, adminOnly: false, baseScoreBoost: 50 },
    "Weakness / paralysis":        { snomed: "13791008",  snomedDisplay: "Weakness (finding)",                         icd10: "R53",    icd10Display: "Unwohlsein und Ermüdung",                                                                 specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    Tremor:                        { snomed: "26079004",  snomedDisplay: "Tremor (finding)",                           icd10: "R25.1",  icd10Display: "Tremor, nicht näher bezeichnet",                                                          specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 5  },
    "Memory problems":             { snomed: "386807006", snomedDisplay: "Memory impairment (finding)",                icd10: "R41.3",  icd10Display: "Sonstige Gedächtnisstörungen",                                                            specialty: "Neurology",           germanSpecialty: "Neurologie",         defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 0  },
    "Loss of consciousness":       { snomed: "419045004", snomedDisplay: "Loss of consciousness (finding)",            icd10: "R55",    icd10Display: "Synkope und Kollaps",                                                                     specialty: "Emergency Medicine",  germanSpecialty: "Notaufnahme",        defaultPathway: "AMBULANCE_112",       gpDirect: false, adminOnly: false, baseScoreBoost: 50 },
    "Abdominal pain":              { snomed: "21522001",  snomedDisplay: "Abdominal pain (finding)",                   icd10: "R10.4",  icd10Display: "Sonstige und nicht näher bezeichnete Bauchschmerzen",                                     specialty: "Gastroenterology",    germanSpecialty: "Gastroenterologie",  defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Nausea / vomiting":           { snomed: "422587007", snomedDisplay: "Nausea (finding)",                           icd10: "R11",    icd10Display: "Übelkeit und Erbrechen",                                                                  specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Diarrhoea:                     { snomed: "62315008",  snomedDisplay: "Diarrhea (finding)",                         icd10: "R19.7",  icd10Display: "Durchfall, nicht näher bezeichnet",                                                       specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Constipation:                  { snomed: "14760008",  snomedDisplay: "Constipation (finding)",                     icd10: "K59.0",  icd10Display: "Obstipation",                                                                             specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "VIRTUAL_CONSULT",     gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Rectal bleeding":             { snomed: "405729008", snomedDisplay: "Haematochezia (finding)",                    icd10: "K92.1",  icd10Display: "Meläna",                                                                                  specialty: "Gastroenterology",    germanSpecialty: "Gastroenterologie",  defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    Jaundice:                      { snomed: "18165001",  snomedDisplay: "Jaundice (finding)",                         icd10: "R17",    icd10Display: "Nicht näher bezeichneter Ikterus",                                                        specialty: "Gastroenterology",    germanSpecialty: "Gastroenterologie",  defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    Dysphagia:                     { snomed: "40739000",  snomedDisplay: "Dysphagia (finding)",                        icd10: "R13",    icd10Display: "Dysphagie",                                                                               specialty: "Gastroenterology",    germanSpecialty: "Gastroenterologie",  defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 10 },
    "Back pain":                   { snomed: "161891005", snomedDisplay: "Backache (finding)",                         icd10: "M54.5",  icd10Display: "Kreuzschmerz",                                                                            specialty: "Orthopedics",         germanSpecialty: "Orthopädie",         defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Joint pain":                  { snomed: "57676002",  snomedDisplay: "Joint pain (finding)",                       icd10: "M25.5",  icd10Display: "Gelenkschmerz",                                                                           specialty: "Rheumatology",        germanSpecialty: "Rheumatologie",      defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Limb injury":                 { snomed: "125604002", snomedDisplay: "Injury of extremity (disorder)",             icd10: "T14.0",  icd10Display: "Oberflächliche Verletzung",                                                               specialty: "Surgery",             germanSpecialty: "Chirurgie",          defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 15 },
    "Neck pain":                   { snomed: "81680005",  snomedDisplay: "Neck pain (finding)",                        icd10: "M54.2",  icd10Display: "Zervikalneuralgie",                                                                       specialty: "Orthopedics",         germanSpecialty: "Orthopädie",         defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Hip pain":                    { snomed: "57773001",  snomedDisplay: "Hip pain (finding)",                         icd10: "M25.55", icd10Display: "Gelenkschmerz, Beckenregion und Oberschenkel",                                            specialty: "Orthopedics",         germanSpecialty: "Orthopädie",         defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Skin rash":                   { snomed: "271807003", snomedDisplay: "Eruption of skin (disorder)",                icd10: "R21",    icd10Display: "Hautausschlag und sonstige unspezifische Hauteruptionen",                                  specialty: "Dermatology",         germanSpecialty: "Dermatologie",       defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Wound / laceration":          { snomed: "312249006", snomedDisplay: "Wound (disorder)",                           icd10: "T14.1",  icd10Display: "Offene Wunde",                                                                            specialty: "Surgery",             germanSpecialty: "Chirurgie",          defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 10 },
    Burn:                          { snomed: "125666000", snomedDisplay: "Burn (disorder)",                            icd10: "T30.0",  icd10Display: "Verbrennung, nicht näher bezeichnet",                                                     specialty: "Surgery",             germanSpecialty: "Chirurgie",          defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    "Allergic reaction":           { snomed: "473010000", snomedDisplay: "Hypersensitivity condition (disorder)",      icd10: "T78.4",  icd10Display: "Allergie, nicht näher bezeichnet",                                                        specialty: "Allergy / Immunology",germanSpecialty: "Allergologie",       defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Insect bite":                 { snomed: "242879009", snomedDisplay: "Insect bite (disorder)",                     icd10: "W57",    icd10Display: "Biss oder Stich durch Insekten und sonstige Tiere",                                       specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Ear pain":                    { snomed: "16001004",  snomedDisplay: "Otalgia (finding)",                          icd10: "H92.0",  icd10Display: "Otalgie",                                                                                 specialty: "ENT",                 germanSpecialty: "HNO",                defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Sore throat":                 { snomed: "162397003", snomedDisplay: "Sore throat (finding)",                      icd10: "J02.9",  icd10Display: "Akute Pharyngitis, nicht näher bezeichnet",                                               specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Nosebleed:                     { snomed: "12441001",  snomedDisplay: "Epistaxis (disorder)",                       icd10: "R04.0",  icd10Display: "Epistaxis",                                                                               specialty: "ENT",                 germanSpecialty: "HNO",                defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Hearing loss":                { snomed: "343087000", snomedDisplay: "Hearing loss (finding)",                     icd10: "H91.9",  icd10Display: "Hörverlust, nicht näher bezeichnet",                                                      specialty: "ENT",                 germanSpecialty: "HNO",                defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 0  },
    "Eye pain":                    { snomed: "41652007",  snomedDisplay: "Eye pain (finding)",                         icd10: "H57.1",  icd10Display: "Augenschmerzen",                                                                          specialty: "Ophthalmology",       germanSpecialty: "Augenheilkunde",     defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 10 },
    "Eye redness / discharge":     { snomed: "301201001", snomedDisplay: "Red eye (finding)",                          icd10: "H10.9",  icd10Display: "Konjunktivitis, nicht näher bezeichnet",                                                  specialty: "Ophthalmology",       germanSpecialty: "Augenheilkunde",     defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Urinary symptoms":            { snomed: "49650001",  snomedDisplay: "Dysuria (finding)",                          icd10: "R30.0",  icd10Display: "Dysurie",                                                                                 specialty: "Urology",             germanSpecialty: "Urologie",           defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Haematuria:                    { snomed: "53298000",  snomedDisplay: "Haematuria (finding)",                       icd10: "R31",    icd10Display: "Nicht näher bezeichnete Hämaturie",                                                       specialty: "Urology",             germanSpecialty: "Urologie",           defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    "Flank pain":                  { snomed: "247355005", snomedDisplay: "Flank pain (finding)",                       icd10: "N23",    icd10Display: "Nicht näher bezeichnete Nierenkolik",                                                     specialty: "Urology",             germanSpecialty: "Urologie",           defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 20 },
    "Scrotal pain":                { snomed: "182294004", snomedDisplay: "Scrotal pain (finding)",                     icd10: "N50.8",  icd10Display: "Sonstige näher bezeichnete Krankheiten der männlichen Genitalorgane",                     specialty: "Urology",             germanSpecialty: "Urologie",           defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 30 },
    "Pelvic pain":                 { snomed: "30473006",  snomedDisplay: "Pelvic pain (finding)",                      icd10: "R10.2",  icd10Display: "Beckenschmerz",                                                                           specialty: "Gynecology",          germanSpecialty: "Gynäkologie",        defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Vaginal bleeding":            { snomed: "289530006", snomedDisplay: "Vaginal bleeding (finding)",                 icd10: "N93.9",  icd10Display: "Abnorme Uterus- oder Vaginalblutung",                                                     specialty: "Gynecology",          germanSpecialty: "Gynäkologie",        defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 10 },
    "Pregnancy concern":           { snomed: "72892002",  snomedDisplay: "Normal pregnancy (finding)",                 icd10: "Z34.9",  icd10Display: "Überwachung einer normalen Schwangerschaft",                                              specialty: "Obstetrics",          germanSpecialty: "Geburtshilfe",       defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Breast problem":              { snomed: "71611007",  snomedDisplay: "Breast problem (finding)",                   icd10: "N64.9",  icd10Display: "Krankheit der Mamma, nicht näher bezeichnet",                                             specialty: "Gynecology",          germanSpecialty: "Gynäkologie",        defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: false, adminOnly: false, baseScoreBoost: 0  },
    "Vaginal discharge":           { snomed: "271939006", snomedDisplay: "Vaginal discharge (finding)",                icd10: "N89.8",  icd10Display: "Sonstige näher bezeichnete nichtentzündliche Krankheiten der Vagina",                     specialty: "Gynecology",          germanSpecialty: "Gynäkologie",        defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Child fever":                 { snomed: "386661006", snomedDisplay: "Fever (finding)",                            icd10: "R50.9",  icd10Display: "Fieber, nicht näher bezeichnet",                                                          specialty: "Pediatrics",          germanSpecialty: "Pädiatrie",          defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Child rash":                  { snomed: "271807003", snomedDisplay: "Eruption of skin (disorder)",                icd10: "R21",    icd10Display: "Hautausschlag beim Kind",                                                                  specialty: "Pediatrics",          germanSpecialty: "Pädiatrie",          defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Child vomiting":              { snomed: "422587007", snomedDisplay: "Nausea (finding)",                           icd10: "R11",    icd10Display: "Erbrechen beim Kind",                                                                      specialty: "Pediatrics",          germanSpecialty: "Pädiatrie",          defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Child crying / inconsolable": { snomed: "28263002",  snomedDisplay: "Crying (finding)",                           icd10: "R68.1",  icd10Display: "Unspezifische Symptome bei Säugling",                                                     specialty: "Pediatrics",          germanSpecialty: "Pädiatrie",          defaultPathway: "AMBULATORY_SPECIALIST", gpDirect: true,  adminOnly: false, baseScoreBoost: 10 },
    "Child injury":                { snomed: "125604002", snomedDisplay: "Injury of extremity (disorder)",             icd10: "T14.9",  icd10Display: "Verletzung, nicht näher bezeichnet",                                                      specialty: "Pediatrics",          germanSpecialty: "Pädiatrie",          defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 15 },
    "Anxiety / panic":             { snomed: "48694002",  snomedDisplay: "Anxiety (finding)",                          icd10: "F41.0",  icd10Display: "Panikstörung",                                                                            specialty: "Psychiatry",          germanSpecialty: "Psychiatrie",        defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Depression:                    { snomed: "35489007",  snomedDisplay: "Depressive disorder (disorder)",             icd10: "F32.9",  icd10Display: "Depressive Episode, nicht näher bezeichnet",                                               specialty: "Psychiatry",          germanSpecialty: "Psychiatrie",        defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Self-harm":                   { snomed: "248062006", snomedDisplay: "Self-harm (finding)",                        icd10: "X84",    icd10Display: "Vorsätzliche Selbstverletzung",                                                            specialty: "Psychiatry",          germanSpecialty: "Psychiatrie",        defaultPathway: "PSYCHIATRIC_EMERGENCY", gpDirect: false, adminOnly: false, baseScoreBoost: 40 },
    Psychosis:                     { snomed: "69322001",  snomedDisplay: "Psychotic disorder (disorder)",              icd10: "F29",    icd10Display: "Nicht näher bezeichnete nichtorganische Psychose",                                         specialty: "Psychiatry",          germanSpecialty: "Psychiatrie",        defaultPathway: "PSYCHIATRIC_EMERGENCY", gpDirect: false, adminOnly: false, baseScoreBoost: 35 },
    "Substance intoxication":      { snomed: "6525002",   snomedDisplay: "Substance intoxication (disorder)",          icd10: "F10.0",  icd10Display: "Akute Alkoholvergiftung",                                                                 specialty: "Emergency Medicine",  germanSpecialty: "Notaufnahme",        defaultPathway: "HOSPITAL_ER",         gpDirect: false, adminOnly: false, baseScoreBoost: 30 },
    "Suicidal ideation":           { snomed: "6471006",   snomedDisplay: "Suicidal ideation (finding)",                icd10: "R45.8",  icd10Display: "Suizidgedanken",                                                                          specialty: "Psychiatry",          germanSpecialty: "Psychiatrie",        defaultPathway: "PSYCHIATRIC_EMERGENCY", gpDirect: false, adminOnly: false, baseScoreBoost: 50 },
    Fever:                         { snomed: "386661006", snomedDisplay: "Fever (finding)",                            icd10: "R50.9",  icd10Display: "Fieber, nicht näher bezeichnet",                                                          specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    Fatigue:                       { snomed: "84229001",  snomedDisplay: "Fatigue (finding)",                          icd10: "R53",    icd10Display: "Unwohlsein und Ermüdung",                                                                 specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Weight loss":                 { snomed: "89362005",  snomedDisplay: "Weight loss (finding)",                      icd10: "R63.4",  icd10Display: "Abnormer Gewichtsverlust",                                                                specialty: "Internal Medicine",   germanSpecialty: "Innere Medizin",     defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    "Night sweats":                { snomed: "42984000",  snomedDisplay: "Night sweats (finding)",                     icd10: "R61.9",  icd10Display: "Hyperhidrose, nicht näher bezeichnet",                                                    specialty: "Internal Medicine",   germanSpecialty: "Innere Medizin",     defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 0  },
    "Lymph node swelling":         { snomed: "30746006",  snomedDisplay: "Lymphadenopathy (finding)",                  icd10: "R59.9",  icd10Display: "Vergrößerte Lymphknoten, nicht näher bezeichnet",                                         specialty: "Internal Medicine",   germanSpecialty: "Innere Medizin",     defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: false, baseScoreBoost: 5  },
    Anaphylaxis:                   { snomed: "39579001",  snomedDisplay: "Anaphylaxis (disorder)",                     icd10: "T78.2",  icd10Display: "Anaphylaktischer Schock, nicht näher bezeichnet",                                         specialty: "Emergency Medicine",  germanSpecialty: "Notaufnahme",        defaultPathway: "AMBULANCE_112",       gpDirect: false, adminOnly: false, baseScoreBoost: 60 },
    "Medication refill":           { snomed: "182817000", snomedDisplay: "Drug prescription (procedure)",              icd10: "Z76.0",  icd10Display: "Wiederholungsrezept",                                                                     specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "VIRTUAL_CONSULT",     gpDirect: true,  adminOnly: true,  baseScoreBoost: 0  },
    "Follow-up question":          { snomed: "390906007", snomedDisplay: "Follow-up encounter (procedure)",            icd10: "Z09.9",  icd10Display: "Nachuntersuchung nach sonstiger Behandlung",                                               specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "VIRTUAL_CONSULT",     gpDirect: true,  adminOnly: true,  baseScoreBoost: 0  },
    "Sick note (AU)":              { snomed: "183051005", snomedDisplay: "Provision of sickness certificate",          icd10: "Z02.7",  icd10Display: "Ärztliche Bescheinigung",                                                                 specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "VIRTUAL_CONSULT",     gpDirect: true,  adminOnly: true,  baseScoreBoost: 0  },
    Vaccination:                   { snomed: "33879002",  snomedDisplay: "Administration of vaccine (procedure)",      icd10: "Z23",    icd10Display: "Impfung gegen einzelne Bakterienkrankheiten",                                             specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "AMBULATORY_GP",       gpDirect: true,  adminOnly: true,  baseScoreBoost: 0  },
    "Lab results":                 { snomed: "441742003", snomedDisplay: "Evaluation of results (procedure)",          icd10: "Z09.9",  icd10Display: "Nachuntersuchung nach sonstiger Behandlung",                                               specialty: "General Medicine",    germanSpecialty: "Allgemeinmedizin",   defaultPathway: "VIRTUAL_CONSULT",     gpDirect: true,  adminOnly: true,  baseScoreBoost: 0  },
  };
  return _clinicalCodesCache;
}

// ── MTS color ─────────────────────────────────────────────────────────────────

export function getMTSColor(score: number): TriageColor {
  if (score >= 85) return "red";
  if (score >= 65) return "orange";
  if (score >= 40) return "yellow";
  if (score >= 20) return "green";
  return "blue";
}

// ── Care context ──────────────────────────────────────────────────────────────

export function getGermanCareContext(locale: Locale = "de"): GermanCareContext {
  const now = new Date();
  const germanTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const hour = germanTime.getHours();
  const day  = germanTime.getDay();
  const dayNames: Record<Locale, string[]> = {
    en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    de: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
  };
  const dayName    = dayNames[locale][day];
  const isWeekend  = day === 0 || day === 6;
  const isOutOfHours = isWeekend || hour < 8 || hour >= 18;
  let recommendation = "";
  if (locale === "de") {
    if (isWeekend)       recommendation = `${dayName} — Kassenärztlicher Bereitschaftsdienst aktiv. Anruf: 116 117 (kostenlos, 24h)`;
    else if (hour >= 18) recommendation = `Nach Sprechzeiten (${hour}:00 Uhr) — Bereitschaftsdienst: 116 117`;
    else if (hour < 8)   recommendation = `Vor Sprechzeiten (${hour}:00 Uhr) — Bereitschaftsdienst: 116 117`;
    else                 recommendation = `Sprechzeiten aktiv (${hour}:00 Uhr) — Hausärzte und Fachärzte erreichbar`;
  } else {
    if (isWeekend)       recommendation = `${dayName} — Out-of-hours service active. Call 116 117 (free, 24h)`;
    else if (hour >= 18) recommendation = `After office hours (${hour}:00) — Out-of-hours service: 116 117`;
    else if (hour < 8)   recommendation = `Before office hours (${hour}:00) — Out-of-hours service: 116 117`;
    else                 recommendation = `Office hours (${hour}:00) — GPs and specialists available`;
  }
  return { isOutOfHours, isWeekend, currentHour: hour, dayOfWeek: day, dayName, recommendation, kbdActive: isOutOfHours };
}

// ── Referral logic (§ 73 / § 76 SGB V) ───────────────────────────────────────

export function getReferralRequirement(
  pathway: CarePathway,
  insurance: InsuranceFund,
  isEmergency: boolean,
  germanSpecialty: string,
  gpDirect: boolean,
  locale: Locale
): { required: boolean; note: string } {
  const isGKV        = insurance !== "Private Insurance";
  const isER         = pathway === "HOSPITAL_ER" || pathway === "AMBULANCE_112" || pathway === "PSYCHIATRIC_EMERGENCY" || pathway === "KBD_116117";
  const isGP         = pathway === "AMBULATORY_GP" || pathway === "VIRTUAL_CONSULT";
  const isSpecialist = pathway === "AMBULATORY_SPECIALIST" || pathway === "HOSPITAL_SPECIALIST";

  if (isER)
    return { required: false, note: "Kein Überweisungsschein erforderlich — Notfall (§ 76 SGB V)" };
  if (isGP)
    return { required: false, note: locale === "de" ? "Hausarztbesuch ohne Überweisung möglich" : "GP visit without referral possible" };
  if (gpDirect)
    return { required: false, note: locale === "de" ? `Direktzugang zu ${germanSpecialty} ohne Überweisung möglich` : `Direct access to ${germanSpecialty} without referral possible` };
  if (isSpecialist && isGKV && !isEmergency)
    return { required: true,  note: locale === "de" ? `GKV: Überweisung vom Hausarzt für ${germanSpecialty} erforderlich (§ 73 SGB V). Terminservicestelle: 116 117` : `GKV: GP referral required for ${germanSpecialty} (§ 73 SGB V). Appointment service: 116 117` };
  if (isSpecialist && isGKV && isEmergency)
    return { required: false, note: locale === "de" ? "Notfall — Direktzugang zum Facharzt ohne Überweisung (§ 76 Abs. 1 SGB V)" : "Emergency — direct specialist access without referral (§ 76 Abs. 1 SGB V)" };
  if (!isGKV)
    return { required: false, note: locale === "de" ? "Privatpatienten können Fachärzte direkt aufsuchen." : "Private patients can access specialists directly." };
  return { required: false, note: "" };
}

// ── FHIR builder ──────────────────────────────────────────────────────────────

export function buildFHIR(input: TriageInput, result: Omit<TriageResult, "fhir">): FHIRTriageOutput {
  return {
    resourceType: "ClinicalImpression",
    status: "completed",
    subject: { reference: `Patient/anonymous-${Date.now()}` },
    date: new Date().toISOString(),
    description: result.carePath,
    finding: [{ itemCodeableConcept: { coding: [
      { system: "http://snomed.info/sct",                        code: result.snomedCode, display: result.snomedDisplay },
      { system: "http://fhir.de/CodeSystem/bfarm/icd-10-gm",    code: result.icd10Code,  display: result.icd10Display  },
    ]}}],
    note: [{ text: result.auditTrace.join(" | ") }, { text: result.referralNote }],
    extension: [
      { url: "triageColor",      valueCode:    result.triageColor },
      { url: "acuityScore",      valueString:  String(result.score) },
      { url: "pathway",          valueCode:    result.pathway },
      { url: "dispatch112",      valueBoolean: result.dispatch112 },
      { url: "germanSpecialty",  valueString:  result.germanSpecialty },
      { url: "icd10gmCode",      valueString:  result.icd10Code },
      { url: "snomedCode",       valueString:  result.snomedCode },
      { url: "referralRequired", valueBoolean: result.requiredReferral },
      { url: "insuranceFund",    valueString:  input.insurance },
      { url: "isOutOfHours",     valueBoolean: result.isOutOfHours },
    ],
  };
}

// ── Clinical pattern detection ────────────────────────────────────────────────

export function detectMeningitis(symptom: Symptom, fever: boolean, neuroWarning: boolean, severity: number): boolean {
  if (symptom !== "Headache" && symptom !== "Fever") return false;
  return fever && neuroWarning && severity >= 6;
}

export function detectAppendicitis(symptom: Symptom, fever: boolean, severity: number, age: number): boolean {
  if (symptom !== "Abdominal pain") return false;
  return fever && severity >= 6 && age >= 5 && age <= 50;
}

export function detectDKA(symptom: Symptom, confusion: boolean, dehydration: boolean, diagnoses: string): boolean {
  if (symptom !== "Nausea / vomiting" && symptom !== "Abdominal pain") return false;
  return diagnoses.toLowerCase().includes("diabet") && (confusion || dehydration);
}

// ── Medication risk analysis ──────────────────────────────────────────────────

export function analyzeMedications(
  medications: string,
  symptom: Symptom,
  severity: number,
  fever: boolean,
  confusion: boolean,
  age: number,
  pregnant: boolean,
  diagnoses: string
): MedicationRisk {
  const meds = medications.toLowerCase();
  const result: MedicationRisk = { scoreBoost: 0, redFlags: [], auditNotes: [], pathwayEscalation: false, escalateTo112: false };
  if (!meds.trim()) return result;

  function flag(msg: string, score: number, escalate = false, call112 = false) {
    result.scoreBoost += score;
    result.redFlags.push(msg);
    result.auditNotes.push(`Med risk: ${msg.slice(0, 80)}... → +${score} pts`);
    if (escalate) result.pathwayEscalation = true;
    if (call112)  result.escalateTo112 = true;
  }
  function has(...terms: string[]): boolean { return terms.some(t => meds.includes(t)); }

  const isAnticoagulant    = has("warfarin","marcumar","phenprocoumon","falithrom","rivaroxaban","xarelto","apixaban","eliquis","dabigatran","pradaxa","edoxaban","lixiana","heparin","enoxaparin","clexane","dalteparin","fondaparinux");
  const isAntiplatelet     = has("aspirin","ass ","acetylsalicylsäure","clopidogrel","plavix","ticagrelor","brilique","prasugrel","efient","dipyridamol","abciximab","tirofiban");
  const isNSAID            = has("ibuprofen","diclofenac","naproxen","indometacin","meloxicam","piroxicam","celecoxib","etoricoxib","ketoprofen","aceclofenac","dexibuprofen");
  const isOpioid           = has("morphin","morphine","oxycodon","oxycodone","fentanyl","fentanil","sufentanil","alfentanil","tramadol","tramal","buprenorphin","buprenorphine","codein","codeine","dihydrocodein","hydromorphon","tapentadol","palexia","methadon","levomethadon","pethidin","tilidine","tilidin","valoron");
  const isImmunosuppressant= has("prednisolon","prednison","dexamethason","methylprednisolon","betamethason","hydrocortison","triamcinolon","methotrexat","methotrexate","azathioprin","azathioprine","imurek","mycophenolatmofetil","mycophenolsäure","cellcept","ciclosporin","cyclosporin","sandimmun","tacrolimus","prograf","advagraf","sirolimus","everolimus","rituximab","mabthera","infliximab","remicade","adalimumab","humira","etanercept","enbrel","tocilizumab","roactemra","secukinumab","cosentyx","ustekinumab","stelara","abatacept","vedolizumab","belimumab","ocrelizumab");
  const isGlucocorticoid   = has("prednisolon","prednison","methylprednisolon","dexamethason","betamethason","hydrocortison","cortison","fludrocortison","triamcinolon","budesonid","beclomethason","fluticason","mometason");
  const isInsulinOrAD      = has("insulin","actrapid","novorapid","humalog","levemir","lantus","toujeo","tresiba","mixtard","novomix","metformin","glucophage","glibenclamid","glimepirid","glipizid","gliquidon","sitagliptin","januvia","saxagliptin","alogliptin","linagliptin","vildagliptin","empagliflozin","jardiance","dapagliflozin","forxiga","canagliflozin","invokana","ertugliflozin","semaglutid","ozempic","wegovy","liraglutid","victoza","exenatid","dulaglutid","trulicity","pioglitazon","acarbose");
  const isSGLT2            = has("empagliflozin","jardiance","dapagliflozin","forxiga","canagliflozin","invokana","ertugliflozin");
  const isBetaBlocker      = has("metoprolol","beloc","bisoprolol","concor","carvedilol","dilatrend","atenolol","tenormin","nebivolol","bystolic","propranolol","sotalol","celiprolol","betaxolol");
  const isACEI             = has("ramipril","delix","lisinopril","enalapril","perindopril","captopril","fosinopril","quinapril","trandolapril","benazepril","cilazapril","imidapril");
  const isARB              = has("losartan","cozaar","valsartan","diovan","candesartan","irbesartan","telmisartan","olmesartan","azilsartan","eprosartan");
  const isAntipsychotic    = has("haloperidol","haldol","olanzapin","olanzapine","zyprexa","quetiapin","quetiapine","seroquel","risperidon","risperidone","risperdal","clozapin","clozapine","leponex","aripiprazol","aripiprazole","abilify","ziprasidon","paliperidon","invega","amisulprid","sulpirid","chlorpromazin","fluphenazin","perphenazin","fluspirilen","zuclopentixol","flupentixol");
  const isLithium          = has("lithium","quilonum","lithiofor");
  const isSSRI_SNRI        = has("sertralin","escitalopram","citalopram","fluoxetin","paroxetin","fluvoxamin","venlafaxin","duloxetin","milnacipran","desvenlafaxin");
  const isMAOI             = has("tranylcypromin","jatrosom","phenelzin","moclobemid","aurorix","selegilin","rasagilin","safinamid");
  const isTCA              = has("amitriptylin","nortriptylin","imipramin","clomipramin","doxepin","trimipramin");
  const isAnticonvulsant   = has("phenytoin","dilantin","carbamazepin","tegretol","valproat","valproinsäure","depakine","ergenyl","levetiracetam","keppra","lamotrigin","lamictal","topiramat","topamax","gabapentin","neurontin","pregabalin","lyrica","oxcarbazepin","lacosamid","zonisamid","rufinamid","phenobarbital","primidon","vigabatrin");
  const isDiuretic         = has("furosemid","lasix","torasemid","hydrochlorothiazid","hct","chlortalidon","indapamid","spironolacton","aldactone","eplerenon","amilorid","triamteren","acetazolamid");
  const isAntiarrhythmic   = has("amiodaron","cordarex","dronedarone","multaq","flecainid","propafenon","verapamil","diltiazem","adenosin");
  const isDigoxin          = has("digoxin","lanitop","digitoxin");
  const isStatin           = has("simvastatin","atorvastatin","rosuvastatin","pravastatin","fluvastatin","pitavastatin","lovastatin","cerivastatin");
  const isChemotherapy     = has("chemotherapy","chemo","cyclophosphamid","ifosfamid","doxorubicin","epirubicin","daunorubicin","paclitaxel","taxol","docetaxel","carboplatin","cisplatin","oxaliplatin","capecitabin","xeloda","fluorouracil","5-fu","gemcitabin","pemetrexed","vincristin","vinblastin","vinorelbine","etoposid","irinotecan","topotecan","bortezomib","lenalidomid","thalidomid","imatinib","gleevec","erlotinib","gefitinib","sorafenib","sunitinib","pazopanib","bevacizumab","avastin","trastuzumab","herceptin","pertuzumab","nivolumab","pembrolizumab","ipilimumab","atezolizumab","durvalumab");
  const isAntibiotic       = has("amoxicillin","ampicillin","flucloxacillin","piperacillin","tazobactam","cefuroxim","ceftriaxon","cefotaxim","ceftazidim","meropenem","imipenem","ertapenem","ciprofloxacin","levofloxacin","moxifloxacin","clarithromycin","azithromycin","erythromycin","doxycyclin","tetracyclin","minocyclin","clindamycin","metronidazol","vancomycin","linezolid","daptomycin","colistin","trimethoprim","cotrimoxazol","nitrofurantoin","fosfomycin");
  const isBenzo            = has("diazepam","valium","lorazepam","tavor","alprazolam","xanax","clonazepam","rivotril","midazolam","dormicum","oxazepam","temazepam","nitrazepam","flunitrazepam","triazolam","bromazepam","clobazam");
  const isZDrug            = has("zolpidem","stilnox","zopiclone","imovane","zaleplon");
  const isQTProlonging     = has("amiodaron","sotalol","haloperidol","droperidol","quetiapin","quetiapine","clarithromycin","azithromycin","moxifloxacin","methadon","cisaprid","hydroxychloroquin","flecainid","disopyramid");
  const isNephrotoxic      = has("vancomycin","gentamicin","tobramycin","amikacin","colistin","polymyxin","amphotericin","cidofovir","cisplatin","ifosfamid","tenofovir","adefovir","ciclosporin","tacrolimus");
  const isHepatotoxic      = has("methotrexat","methotrexate","isoniazid","rifampicin","pyrazinamid","valproat","valproinsäure","amiodaron","ketoconazol","diclofenac","nimesulid","tamoxifen","flutamid");
  const isCCB              = has("amlodipin","nifedipin","felodipin","lercanidipin","isradipin","nimodipin","verapamil","diltiazem");
  const isNitrate          = has("glyceroltrinitrat","nitroglycerin","isdn","isosorbiddinitrat","isosorbidmononitrat","molsidomin","nitroprusside");
  const isThrombolytic     = has("alteplase","rtpa","tenecteplase","reteplase","streptokinase","urokinase");
  const isMTX              = has("methotrexat","methotrexate","mtx");
  const isPPI              = has("omeprazol","pantoprazol","esomeprazol","lansoprazol","rabeprazol","dexlansoprazol");
  const isAnticholinergic  = has("atropin","scopolamin","ipratropium","tiotropium","oxybutynin","tolterodine","solifenacin","fesoterodin","trospium","biperiden","trihexyphenidyl","amitriptylin","clomipramin","doxepin");

  if (isAnticoagulant || isAntiplatelet) {
    const bleedSymptoms: Symptom[]  = ["Rectal bleeding","Haematuria","Haemoptysis","Vaginal bleeding","Nosebleed"];
    const neuroSymptoms: Symptom[]  = ["Headache","Stroke symptoms","Weakness / paralysis","Loss of consciousness","Seizure"];
    const traumaSymptoms: Symptom[] = ["Limb injury","Wound / laceration","Burn"];
    if (bleedSymptoms.includes(symptom))  flag(`${isAnticoagulant ? "Anticoagulant" : "Antiplatelet"} + bleeding (${symptom}) — major haemorrhage risk. Reversal agent may be required (T45.5 ICD-10-GM).`, 25, true);
    if (neuroSymptoms.includes(symptom))  flag(`${isAnticoagulant ? "Anticoagulant" : "Antiplatelet"} + neurological symptoms — exclude intracranial haemorrhage (I62 ICD-10-GM). Urgent CT head required.`, 25, true);
    if (traumaSymptoms.includes(symptom)) flag(`${isAnticoagulant ? "Anticoagulant" : "Antiplatelet"} + trauma — bleeding risk markedly elevated. Emergency assessment required.`, 18, true);
    if (symptom === "Abdominal pain") flag("Anticoagulant + abdominal pain — exclude retroperitoneal/intraabdominal haemorrhage (K92.2 ICD-10-GM).", 15, true);
    if (isAnticoagulant && isAntiplatelet) flag("Dual antithrombotic therapy — very high bleeding risk. Any bleeding is a medical emergency.", 10, true);
    if (isNSAID) flag("Anticoagulant/antiplatelet + NSAID — significantly elevated GI and systemic bleeding risk (Z88 ICD-10-GM).", 15, true);
  }
  if (isThrombolytic) {
    if (symptom === "Headache" || symptom === "Stroke symptoms") flag("Thrombolytic + new neurological symptom — exclude intracranial haemorrhage (I61 ICD-10-GM). Call 112.", 40, true, true);
    flag("Recent thrombolytic therapy — all bleeding symptoms are medical emergencies.", 20, true);
  }
  if (isImmunosuppressant || isGlucocorticoid) {
    if (fever) flag("Immunosuppression + fever — exclude serious bacterial/fungal/opportunistic infection. Sepsis risk elevated (A41.9 ICD-10-GM).", 25, true);
    if (symptom === "Headache" && fever) flag("Immunosuppression + headache + fever — exclude CNS infection: bacterial meningitis (G00), cryptococcal meningitis, CMV encephalitis.", 25, true);
    if (symptom === "Cough (acute)" || symptom === "Shortness of breath") flag("Immunosuppression + respiratory symptoms — exclude PCP (B59 ICD-10-GM), invasive aspergillosis, CMV pneumonitis.", 15, true);
    if (symptom === "Skin rash") flag("Immunosuppression + rash — exclude disseminated herpes zoster (B02 ICD-10-GM), drug reaction, systemic infection.", 10, true);
    if (isGlucocorticoid && symptom === "Abdominal pain") flag("Glucocorticoid + abdominal pain — exclude peptic ulceration/GI perforation (K26 ICD-10-GM). Steroids mask peritoneal signs.", 15, true);
    if (isMTX) {
      if (symptom === "Cough (acute)" || symptom === "Shortness of breath") flag("Methotrexate + respiratory symptoms — exclude methotrexate pneumonitis (J70.2 ICD-10-GM). Medical emergency.", 20, true);
      if (symptom === "Nausea / vomiting" || symptom === "Abdominal pain") flag("Methotrexate + GI symptoms — exclude hepatotoxicity (K71 ICD-10-GM) or mucositis.", 15, true);
      if (fever) flag("Methotrexate + fever — exclude bone marrow suppression and febrile neutropenia (D70 ICD-10-GM).", 20, true);
      if (isNSAID) flag("DANGEROUS: Methotrexate + NSAID — NSAIDs reduce MTX clearance causing toxicity: pancytopenia, hepatotoxicity (T45.1 ICD-10-GM).", 25, true);
    }
  }
  if (isChemotherapy) {
    if (fever) flag("Chemotherapy + fever — FEBRILE NEUTROPENIA (D70 ICD-10-GM) until proven otherwise. Oncological emergency. IV antibiotics within 1 hour. Call 112.", 40, true, true);
    if (symptom === "Shortness of breath") flag("Chemotherapy + dyspnoea — exclude pulmonary embolism (I26), bleomycin toxicity, anthracycline cardiomyopathy.", 20, true);
    if (symptom === "Chest pain") flag("Chemotherapy + chest pain — exclude anthracycline cardiomyopathy (I42) or 5-FU coronary vasospasm.", 20, true);
    if (symptom === "Nausea / vomiting") flag("Chemotherapy + vomiting — assess for tumour lysis syndrome (E88.3 ICD-10-GM): check uric acid, creatinine, electrolytes.", 15, true);
    if (confusion) flag("Chemotherapy + confusion — exclude hypercalcaemia of malignancy (E83.5), CNS metastases, or encephalopathy.", 20, true);
    if (has("nivolumab","pembrolizumab","ipilimumab","atezolizumab","durvalumab","avelumab")) {
      if (symptom === "Shortness of breath") flag("Checkpoint inhibitor + dyspnoea — exclude immune-related pneumonitis (J70.2). Urgent CT chest.", 20, true);
      if (symptom === "Diarrhoea") flag("Checkpoint inhibitor + diarrhoea — exclude immune-related colitis (K52.9). Steroids may be required.", 15, true);
      if (symptom === "Headache" || symptom === "Weakness / paralysis") flag("Checkpoint inhibitor + neurological symptoms — exclude immune-related encephalitis or meningitis.", 20, true);
    }
  }
  if (isInsulinOrAD) {
    if (confusion || symptom === "Loss of consciousness" || symptom === "Seizure") flag("Antidiabetic therapy + altered consciousness — HYPOGLYCAEMIA (E16.0 ICD-10-GM) until proven otherwise. Check glucose. If <4 mmol/L administer glucose. Call 112.", 30, true, true);
    if (symptom === "Nausea / vomiting" || symptom === "Abdominal pain") flag("Antidiabetic + GI symptoms — exclude DKA (E10.1/E11.1 ICD-10-GM) or hyperglycaemic hyperosmolar state.", 15, true);
    if (symptom === "Chest pain") flag("Diabetic patient + chest pain — silent MI risk elevated (I21 ICD-10-GM). Autonomic neuropathy may mask typical symptoms.", 15, true);
  }
  if (isSGLT2) {
    if (symptom === "Nausea / vomiting" || symptom === "Abdominal pain" || symptom === "Fatigue") flag("SGLT2 inhibitor + GI symptoms — exclude EUGLYCAEMIC DKA (E13.1 ICD-10-GM). May present with NORMAL blood glucose. Emergency assessment.", 20, true);
    if (symptom === "Urinary symptoms" || fever) flag("SGLT2 inhibitor + urinary/fever — exclude Fournier's gangrene (N49.3 ICD-10-GM) or severe genitourinary infection.", 15, true);
  }
  if (isBetaBlocker) {
    if (symptom === "Shortness of breath" || symptom === "Chest pain") flag("Beta-blocker — tachycardia may be masked. Heart rate is NOT a reliable severity indicator.", 8);
    if (symptom === "Syncope / collapse" || symptom === "Dizziness / vertigo") flag("Beta-blocker + syncope/dizziness — exclude bradycardia (R00.1) or AV block (I44 ICD-10-GM).", 12, true);
    if (symptom === "Stridor / wheeze" || symptom === "Shortness of breath") flag("Beta-blocker + bronchospasm — beta-blocker-induced bronchospasm (J68.3 ICD-10-GM). Beta-2 agonists may be ineffective.", 12, true);
  }
  if (isDigoxin) {
    if (symptom === "Nausea / vomiting" || symptom === "Dizziness / vertigo" || symptom === "Palpitations" || confusion) flag("Digoxin + symptoms — exclude digoxin toxicity (T46.0 ICD-10-GM): nausea, xanthopsia, bradycardia, arrhythmias. Check digoxin level and ECG urgently.", 25, true);
    if (isDiuretic) flag("Digoxin + diuretic — hypokalaemia risk increases digoxin toxicity. Electrolyte monitoring essential.", 8);
  }
  if (isAntiarrhythmic) {
    if (symptom === "Palpitations" || symptom === "Syncope / collapse") flag("Antiarrhythmic + cardiac symptoms — proarrhythmic effect possible. Urgent ECG required.", 15, true);
    if (has("amiodaron","cordarex")) {
      if (symptom === "Shortness of breath" || symptom === "Cough (chronic)") flag("Amiodarone + pulmonary symptoms — exclude amiodarone pulmonary toxicity (J70.2 ICD-10-GM). Can be fatal. Urgent CT + PFTs.", 20, true);
      if (fever) flag("Amiodarone + fever — exclude hepatotoxicity (K71) or pulmonary toxicity.", 12, true);
    }
  }
  if (isACEI || isARB) {
    if (symptom === "Stridor / wheeze" || (symptom === "Shortness of breath" && severity >= 6)) flag("ACE inhibitor/ARB + airway symptoms — exclude ANGIOEDEMA (T78.3 ICD-10-GM). Fatal laryngeal oedema possible. Call 112.", 30, true, true);
    if (symptom === "Syncope / collapse" || symptom === "Dizziness / vertigo") flag("ACE inhibitor/ARB + syncope — exclude hypotension or renal impairment (N17 ICD-10-GM).", 10, true);
    if (symptom === "Weakness / paralysis" || symptom === "Palpitations") flag("ACE inhibitor/ARB + weakness/palpitations — exclude hyperkalaemia (E87.5 ICD-10-GM).", 12, true);
    if (isNSAID && isDiuretic) flag("TRIPLE WHAMMY: NSAID + ACE inhibitor/ARB + diuretic — very high acute kidney injury risk (N17 ICD-10-GM).", 20, true);
  }
  if (isDiuretic) {
    if (symptom === "Syncope / collapse" || symptom === "Dizziness / vertigo" || symptom === "Weakness / paralysis") flag("Diuretic + dizziness/syncope/weakness — exclude electrolyte disturbance (E87 ICD-10-GM): hypokalaemia, hyponatraemia, dehydration.", 10, true);
    if (confusion) flag("Diuretic + confusion — exclude severe hyponatraemia (E87.1 ICD-10-GM). Common in elderly on thiazides.", 15, true);
    if (has("furosemid","torasemid") && (symptom === "Hearing loss" || symptom === "Dizziness / vertigo")) flag("Loop diuretic + hearing loss/vertigo — exclude furosemide ototoxicity (H91.0 ICD-10-GM).", 10, true);
  }
  if (isCCB) {
    if (symptom === "Leg swelling") flag("Dihydropyridine calcium channel blocker + leg oedema — likely drug side effect (T46.1 ICD-10-GM). Consider before cardiac workup.", 5);
    if (has("verapamil","diltiazem") && (symptom === "Syncope / collapse" || symptom === "Palpitations")) flag("Non-dihydropyridine CCB (verapamil/diltiazem) + syncope/palpitations — exclude complete heart block (I44 ICD-10-GM).", 15, true);
  }
  if (isNitrate) {
    if (symptom === "Headache") flag("Nitrate + headache — common nitrate side effect (T46.3 ICD-10-GM). Exclude other causes if severe.", 5);
    if (symptom === "Syncope / collapse" || symptom === "Dizziness / vertigo") flag("Nitrate + syncope/dizziness — exclude nitrate hypotension. DANGEROUS if combined with PDE5 inhibitors.", 12, true);
    if (has("sildenafil","viagra","tadalafil","cialis","vardenafil","avanafil")) flag("DANGEROUS: Nitrate + PDE5 inhibitor — severe potentially fatal hypotension (T46.3 ICD-10-GM). Emergency assessment.", 30, true, true);
  }
  if (isAntipsychotic) {
    if (fever && (symptom === "Weakness / paralysis" || symptom === "Fatigue" || confusion || symptom === "Fever")) flag("Antipsychotic + fever + rigidity/altered consciousness — NEUROLEPTIC MALIGNANT SYNDROME (G21.0 ICD-10-GM). Life-threatening. Stop drug. Call 112.", 40, true, true);
    if (symptom === "Syncope / collapse" || symptom === "Palpitations") flag("Antipsychotic + syncope/palpitations — QT prolongation. Exclude torsades de pointes (I47.2). Urgent ECG.", 15, true);
    if (symptom === "Dizziness / vertigo" || symptom === "Weakness / paralysis") flag("Antipsychotic + movement symptoms — exclude extrapyramidal effects: acute dystonia (G24.0), akathisia, parkinsonism.", 10, true);
    if (has("clozapin","clozapine","leponex")) {
      if (fever || symptom === "Sore throat") flag("Clozapine + fever/sore throat — exclude AGRANULOCYTOSIS (D70 ICD-10-GM). Life-threatening. Urgent FBC immediately.", 30, true);
      if (symptom === "Shortness of breath" || symptom === "Chest pain") flag("Clozapine + cardiorespiratory symptoms — exclude clozapine-induced myocarditis (I40 ICD-10-GM).", 20, true);
      if (symptom === "Constipation" && severity >= 5) flag("Clozapine + severe constipation — exclude paralytic ileus (K56.0 ICD-10-GM). Can be fatal.", 15, true);
    }
  }
  if (isLithium) {
    if (symptom === "Diarrhoea" || symptom === "Nausea / vomiting" || confusion || symptom === "Tremor" || symptom === "Dizziness / vertigo") flag("Lithium + GI/neurological symptoms — LITHIUM TOXICITY (T43.5 ICD-10-GM). Narrow therapeutic index. Check level urgently.", 25, true);
    if (symptom === "Seizure" || symptom === "Weakness / paralysis") flag("Lithium + seizure/weakness — severe toxicity. Irreversible neurological damage possible. Call 112.", 35, true, true);
    if (isNSAID || isDiuretic || isACEI || isARB) flag("Lithium + NSAID/diuretic/ACEI/ARB — reduces lithium clearance. Toxicity risk. Review lithium level.", 15, true);
  }
  if (isSSRI_SNRI || isMAOI) {
    const hasSerotonergic = (isSSRI_SNRI && isMAOI) || (isSSRI_SNRI && has("tramadol","fentanyl","pethidin","linezolid","triptane","sumatriptan","rizatriptan")) || (isMAOI && isOpioid);
    if (hasSerotonergic && (fever || confusion || symptom === "Tremor")) flag("SEROTONIN SYNDROME (G25.8 ICD-10-GM): SSRI/SNRI/MAOI + serotonergic agent + agitation/tremor/fever. Life-threatening. Call 112.", 40, true, true);
    if (isSSRI_SNRI && symptom === "Nausea / vomiting" && confusion) flag("SSRI/SNRI + confusion/vomiting — exclude SIADH-induced hyponatraemia (E22.2 ICD-10-GM). Common in elderly.", 15, true);
    if (isSSRI_SNRI && (symptom === "Rectal bleeding" || symptom === "Haematuria" || symptom === "Haemoptysis")) flag("SSRI + bleeding — SSRIs impair platelet aggregation. Combined with NSAIDs/anticoagulants: very high risk.", 12, true);
    if (isMAOI && symptom === "Headache" && severity >= 7) flag("MAOI + severe headache — exclude hypertensive crisis from tyramine interaction (I10 ICD-10-GM). Medical emergency.", 25, true);
  }
  if (isTCA) {
    if (symptom === "Palpitations" || symptom === "Syncope / collapse" || confusion) flag("Tricyclic antidepressant + cardiac/neurological symptoms — exclude TCA cardiotoxicity (T43.0 ICD-10-GM): QRS widening, arrhythmia, hypotension, seizures. Urgent ECG.", 20, true);
  }
  if (isAnticonvulsant) {
    if (symptom === "Dizziness / vertigo" || symptom === "Tremor" || confusion || symptom === "Nausea / vomiting") flag("Anticonvulsant + CNS symptoms — exclude drug toxicity. Check carbamazepine/phenytoin/valproate levels.", 12, true);
    if (has("valproat","valproinsäure","depakine","ergenyl")) {
      if (symptom === "Jaundice" || symptom === "Abdominal pain") flag("Valproate + hepatic symptoms — exclude valproate hepatotoxicity (K71 ICD-10-GM). Can be fatal in children <2y. Urgent LFTs.", 20, true);
      if (symptom === "Nausea / vomiting" || confusion) flag("Valproate + vomiting/confusion — exclude hyperammonaemia (E72.2 ICD-10-GM) even with normal LFTs.", 15, true);
    }
    if (has("carbamazepin","tegretol") && (symptom === "Skin rash" || fever)) flag("Carbamazepine + rash/fever — exclude DRESS (L27.0) or Stevens-Johnson syndrome (L51.1 ICD-10-GM). Life-threatening. Stop drug.", 30, true);
    if (has("lamotrigin","lamictal") && symptom === "Skin rash") flag("Lamotrigine + rash — exclude Stevens-Johnson syndrome (L51.1) or TEN (L51.2 ICD-10-GM). Life-threatening. Stop drug. Emergency referral.", 30, true);
    if (has("phenytoin","dilantin") && (symptom === "Dizziness / vertigo" || symptom === "Tremor")) flag("Phenytoin + cerebellar symptoms — exclude phenytoin toxicity (T42.0 ICD-10-GM). Narrow therapeutic index.", 15, true);
    if (pregnant) flag("Anticonvulsant in pregnancy — teratogenicity risk (valproate: O35.5 ICD-10-GM). Specialist obstetric neurology review. Do not stop abruptly.", 10, true);
  }
  if (isBenzo || isZDrug) {
    if (symptom === "Shortness of breath" || confusion) flag("Benzodiazepine/Z-drug + respiratory depression/confusion — exclude toxicity (T42.4 ICD-10-GM).", 15, true);
    if ((isBenzo || isZDrug) && isOpioid) flag("DANGEROUS: Benzodiazepine + opioid — synergistic respiratory depression. Any deterioration is a medical emergency.", 25, true, true);
  }
  if (isAnticholinergic && confusion && age >= 65) flag("Anticholinergic + confusion in elderly — anticholinergic toxidrome (T44.3 ICD-10-GM): dry skin, urinary retention, confusion, tachycardia.", 15, true);
  if (isOpioid) {
    if (symptom === "Shortness of breath" || confusion) flag("Opioid + respiratory depression/confusion — exclude OPIOID TOXICITY (F11.0 ICD-10-GM). Triad: miosis, respiratory depression, decreased consciousness. Naloxone required. Call 112.", 25, true, true);
    if (symptom === "Constipation" && severity >= 6) flag("Opioid + severe constipation — exclude opioid-induced ileus (K56.0 ICD-10-GM) or bowel perforation.", 12, true);
    if (has("fentanyl") && fever) flag("Fentanyl patch + fever — increased transdermal absorption. Risk of rapid fentanyl toxicity. Emergency assessment.", 20, true);
  }
  if (isNephrotoxic && (symptom === "Flank pain" || symptom === "Haematuria" || symptom === "Urinary symptoms")) flag("Nephrotoxic medication + renal symptoms — exclude acute kidney injury (N17 ICD-10-GM). Urgent renal function tests.", 15, true);
  if (isHepatotoxic && (symptom === "Jaundice" || symptom === "Abdominal pain")) flag("Hepatotoxic medication + hepatic symptoms — exclude drug-induced liver injury (K71 ICD-10-GM). Urgent LFTs.", 20, true);
  if (isAntibiotic) {
    if (symptom === "Diarrhoea" && has("amoxicillin","ampicillin","clindamycin","ciprofloxacin","ceftriaxon","meropenem")) flag("Recent antibiotic + diarrhoea — exclude Clostridioides difficile colitis (A04.7 ICD-10-GM).", 12, true);
    if (symptom === "Skin rash") flag("Antibiotic + rash — exclude drug hypersensitivity, Stevens-Johnson syndrome (L51.1), or DRESS.", 15, true);
    if (has("ciprofloxacin","levofloxacin","moxifloxacin")) {
      if (symptom === "Joint pain" || symptom === "Back pain") flag("Fluoroquinolone + tendon pain — exclude fluoroquinolone tendinopathy/Achilles rupture (M76.6 ICD-10-GM). Stop drug.", 12, true);
      if (symptom === "Palpitations" || symptom === "Syncope / collapse") flag("Fluoroquinolone + cardiac symptoms — QT prolongation risk (I47.2 ICD-10-GM). Urgent ECG.", 15, true);
      if (confusion || symptom === "Seizure") flag("Fluoroquinolone + CNS symptoms — fluoroquinolone neurotoxicity (G92 ICD-10-GM).", 15, true);
    }
    if (has("linezolid") && isSSRI_SNRI) flag("Linezolid (MAOI properties) + SSRI/SNRI — SEROTONIN SYNDROME risk (G25.8 ICD-10-GM). Life-threatening. Emergency assessment.", 30, true, true);
  }
  if (has("levothyroxin","l-thyroxin","euthyrox") && (symptom === "Palpitations" || symptom === "Chest pain")) flag("Levothyroxine + cardiac symptoms — exclude thyrotoxicosis from over-replacement (E05.0 ICD-10-GM). Check TSH.", 12, true);
  if (has("carbimazol","thiamazol","propylthiouracil") && (fever || symptom === "Sore throat")) flag("Antithyroid drug + fever/sore throat — exclude AGRANULOCYTOSIS (D70 ICD-10-GM). Life-threatening. Urgent FBC. Stop drug.", 30, true);
  if (isStatin) {
    if (symptom === "Joint pain" || symptom === "Back pain" || symptom === "Weakness / paralysis") flag("Statin + muscle symptoms — exclude rhabdomyolysis (M62.8 ICD-10-GM). Check CK urgently.", 12, true);
    if (has("simvastatin") && has("amiodaron","verapamil","diltiazem","clarithromycin","itraconazol")) flag("Simvastatin + CYP3A4 inhibitor — very high rhabdomyolysis risk (M62.8 ICD-10-GM). Urgent medication review.", 15, true);
  }
  if (isNSAID) {
    if (symptom === "Rectal bleeding" || symptom === "Abdominal pain") flag("NSAID + GI symptoms — peptic ulcer/GI haemorrhage (K25 ICD-10-GM). Risk elevated without PPI cover.", isPPI ? 8 : 15, !isPPI);
    if (symptom === "Flank pain" || symptom === "Urinary symptoms") flag("NSAID + renal symptoms — NSAID-induced AKI (N14.0 ICD-10-GM). Check renal function.", 10, true);
    if (has("aspirin","ass ") && symptom === "Shortness of breath") flag("Aspirin + respiratory symptoms — aspirin-exacerbated respiratory disease (J45.1 ICD-10-GM).", 12, true);
    if (pregnant) flag("NSAID in pregnancy after 20 weeks — premature ductus arteriosus closure risk (O35 ICD-10-GM). Urgent obstetric review.", 20, true);
  }
  if (isQTProlonging && (symptom === "Palpitations" || symptom === "Syncope / collapse")) flag("QT-prolonging medication + palpitations/syncope — exclude torsades de pointes (I47.2 ICD-10-GM). Urgent ECG.", 18, true);
  const qtCount = [has("amiodaron"),has("sotalol"),has("haloperidol"),has("quetiapin","quetiapine"),has("clarithromycin"),has("azithromycin"),has("moxifloxacin"),has("methadon")].filter(Boolean).length;
  if (qtCount >= 2) flag(`Multiple QT-prolonging agents (${qtCount} detected) — cumulative QT prolongation risk. Urgent ECG.`, 15, true);
  if (pregnant) {
    if (has("valproat","valproinsäure","depakine","ergenyl")) flag("Valproate in pregnancy — CONTRAINDICATED (O35.5 ICD-10-GM). High teratogenicity. Urgent specialist review.", 25, true);
    if (isMTX) flag("Methotrexate in pregnancy — ABSOLUTELY CONTRAINDICATED (O35.5 ICD-10-GM). Emergency obstetric review.", 30, true);
    if (has("isotretinoin","roaccutan","aknenormin")) flag("Isotretinoin in pregnancy — ABSOLUTELY CONTRAINDICATED (O35.5 ICD-10-GM). Severe teratogenicity. Emergency obstetric review.", 30, true);
    if (isACEI || isARB) flag("ACE inhibitor/ARB in pregnancy — CONTRAINDICATED from second trimester (O35.5 ICD-10-GM). Renal agenesis risk. Urgent switch.", 20, true);
    if (has("warfarin","marcumar","phenprocoumon")) flag("Warfarin in first trimester — warfarin embryopathy risk. Switch to LMWH. Urgent haematology/obstetric review.", 20, true);
  }

  result.scoreBoost = Math.min(result.scoreBoost, 50);
  return result;
}