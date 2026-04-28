// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — Triage Engine
//
// Pure function: TriageInput + Locale → TriageResult.
// No side effects. Imports clinical logic from triage.ts and
// patient-facing strings from triage-strings.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from "./i18n";
import {
  getClinicalCodes,
  getGermanCareContext,
  analyzeMedications,
  detectMeningitis,
  detectAppendicitis,
  detectDKA,
  getReferralRequirement,
  buildFHIR,
  getMTSColor,
  type TriageInput,
  type TriageResult,
  type CarePathway,
} from "./triage";
import {
  s,
  getFollowUpQs,
  PATHWAY_TITLES,
  CARE_PATHS,
  RED_FLAGS,
  COVERAGE_NOTES,
  REFERRAL_NOTES,
} from "./triage-strings";

export function triageEngine(input: TriageInput, locale: Locale = "de"): TriageResult {
  const {
    age, symptom, severity, chronic, emergency, durationDays,
    fever, breathingIssue, chestTightness, neuroWarning, pregnant, childPatient,
    radiatingPain, exertionalPain, confusion, dehydration, selfHarmRisk,
    insurance,
  } = input;

  // ts() — shorthand for looking up a translated string by map + key
  const ts = (map: Record<string, Record<Locale, string>>, key: string) =>
    s(map, key, locale);

  const CODES      = getClinicalCodes();
  const codes      = CODES[symptom] ?? CODES["Follow-up question"];
  const careCtx    = getGermanCareContext(locale);
  const auditTrace: string[] = [];
  const redFlags:   string[] = [];
  let   score = 0;

  // ── Base score ──────────────────────────────────────────────────────────────
  const severityScore = Math.round((severity / 10) * 40);
  score += severityScore;
  auditTrace.push(`Severity ${severity}/10 → +${severityScore} pts`);
  if (codes.baseScoreBoost > 0) {
    score += codes.baseScoreBoost;
    auditTrace.push(`${symptom} base risk → +${codes.baseScoreBoost} pts`);
  }
  if      (age >= 75) { score += 12; auditTrace.push("Age ≥75 → +12 pts"); }
  else if (age >= 65) { score += 8;  auditTrace.push("Age ≥65 → +8 pts"); }
  else if (age <= 2)  { score += 15; auditTrace.push("Age ≤2 → +15 pts"); }
  else if (age <= 12) { score += 8;  auditTrace.push("Age ≤12 → +8 pts"); }
  if (chronic)                            { score += 8; auditTrace.push("Chronic condition → +8 pts"); }
  if (durationDays <= 1 && severity >= 6) { score += 5; auditTrace.push("Acute onset <24h + severity ≥6 → +5 pts"); }
  if (pregnant)                           { score += 8; auditTrace.push("Pregnancy → +8 pts"); }
  if (codes.adminOnly) {
    score = Math.min(score, 15);
    auditTrace.push("Administrative encounter — score capped at 15");
  }

  // ── Clinical pattern detection ──────────────────────────────────────────────
  if (detectMeningitis(symptom, fever, neuroWarning, severity)) {
    score = Math.max(score, 85);
    redFlags.push(ts(RED_FLAGS, "meningitis"));
    auditTrace.push("Meningitis triad detected → HOSPITAL ER escalation");
  }
  if (detectAppendicitis(symptom, fever, severity, age)) {
    score = Math.max(score, 70);
    redFlags.push(ts(RED_FLAGS, "appendicitis"));
    auditTrace.push("Appendicitis pattern detected → HOSPITAL ER escalation");
  }
  if (detectDKA(symptom, confusion, dehydration, input.diagnoses || "")) {
    score = Math.max(score, 80);
    redFlags.push(ts(RED_FLAGS, "dka"));
    auditTrace.push("DKA pattern detected → HOSPITAL ER escalation");
  }

  // ── Medication risk ─────────────────────────────────────────────────────────
  const medRisk = analyzeMedications(
    input.medications || "", symptom, severity, fever,
    confusion, age, pregnant, input.diagnoses || ""
  );

  if (medRisk.escalateTo112) {
    score = 100;
    redFlags.push(...medRisk.redFlags.filter(r => !redFlags.includes(r)));
    auditTrace.push(...medRisk.auditNotes.filter(n => !auditTrace.includes(n)));
    auditTrace.push("Medication risk → AMBULANCE 112 escalation");
    const referral = getReferralRequirement("AMBULANCE_112", insurance, true, codes.germanSpecialty, codes.gpDirect, locale);
    const partial: Omit<TriageResult, "fhir"> = {
      title: ts(PATHWAY_TITLES, "AMBULANCE_112"), carePath: ts(CARE_PATHS, "ambulance_med_risk"),
      pathway: "AMBULANCE_112", triageColor: "red", score: 100,
      snomedCode: codes.snomed, snomedDisplay: codes.snomedDisplay,
      icd10Code: codes.icd10, icd10Display: codes.icd10Display,
      specialty: codes.specialty, germanSpecialty: codes.germanSpecialty,
      requiredReferral: false, referralNote: referral.note,
      coverageNote: ts(COVERAGE_NOTES, "ambulance_covered"),
      dispatch112: true, isOutOfHours: careCtx.isOutOfHours, outOfHoursNote: careCtx.recommendation,
      redFlags, questions: [], auditTrace,
    };
    return { ...partial, fhir: buildFHIR(input, partial) };
  }

  if (medRisk.scoreBoost > 0) {
    score = Math.min(100, score + medRisk.scoreBoost);
    redFlags.push(...medRisk.redFlags.filter(r => !redFlags.includes(r)));
    auditTrace.push(...medRisk.auditNotes.filter(n => !auditTrace.includes(n)));
  }

  // ── Immediate life threats → 112 ────────────────────────────────────────────
  const isSTEMI          = symptom === "Chest pain" && radiatingPain && exertionalPain && severity >= 7;
  const isStroke         = symptom === "Stroke symptoms" || ((symptom === "Headache" || symptom === "Dizziness / vertigo") && neuroWarning && confusion && severity >= 8);
  const isRespFail       = (symptom === "Shortness of breath" || symptom === "Stridor / wheeze") && breathingIssue && severity >= 8;
  const isAnaphylaxis    = symptom === "Anaphylaxis" || (symptom === "Allergic reaction" && breathingIssue && severity >= 8);
  const isObstetricEmerg = pregnant && (symptom === "Abdominal pain" || symptom === "Pelvic pain" || symptom === "Vaginal bleeding") && severity >= 8;
  const isLOC            = symptom === "Loss of consciousness" || (symptom === "Seizure" && confusion);
  const isSepsis         = fever && confusion && severity >= 8;
  const dispatch112      = isSTEMI || isStroke || isRespFail || isAnaphylaxis || isObstetricEmerg || isLOC || isSepsis || (emergency && severity >= 9);

  if (dispatch112) {
    score = 100;
    if (isSTEMI)          redFlags.push(ts(RED_FLAGS, "stemi"));
    if (isStroke)         redFlags.push(ts(RED_FLAGS, "stroke"));
    if (isRespFail)       redFlags.push(ts(RED_FLAGS, "respiratory_failure"));
    if (isAnaphylaxis)    redFlags.push(ts(RED_FLAGS, "anaphylaxis"));
    if (isObstetricEmerg) redFlags.push(ts(RED_FLAGS, "obstetric_emergency"));
    if (isLOC)            redFlags.push(ts(RED_FLAGS, "loss_of_consciousness"));
    if (isSepsis)         redFlags.push(ts(RED_FLAGS, "sepsis"));
    auditTrace.push("Immediate life threat → AMBULANCE 112");
    const referral = getReferralRequirement("AMBULANCE_112", insurance, true, codes.germanSpecialty, codes.gpDirect, locale);
    const partial: Omit<TriageResult, "fhir"> = {
      title: ts(PATHWAY_TITLES, "AMBULANCE_112"), carePath: ts(CARE_PATHS, "ambulance_general"),
      pathway: "AMBULANCE_112", triageColor: "red", score: 100,
      snomedCode: codes.snomed, snomedDisplay: codes.snomedDisplay,
      icd10Code: codes.icd10, icd10Display: codes.icd10Display,
      specialty: codes.specialty, germanSpecialty: codes.germanSpecialty,
      requiredReferral: false, referralNote: referral.note,
      coverageNote: ts(COVERAGE_NOTES, "ambulance_covered"),
      dispatch112: true, isOutOfHours: careCtx.isOutOfHours, outOfHoursNote: careCtx.recommendation,
      redFlags, questions: [], auditTrace,
    };
    return { ...partial, fhir: buildFHIR(input, partial) };
  }

  // ── Psychiatric emergency ────────────────────────────────────────────────────
  const isPsychEmerg = symptom === "Suicidal ideation" || symptom === "Psychosis"
    || (symptom === "Self-harm" && severity >= 6) || selfHarmRisk;
  if (isPsychEmerg) {
    score = Math.max(score, 80);
    redFlags.push(ts(RED_FLAGS, "psychiatric_emergency"));
    if (symptom === "Suicidal ideation") redFlags.push(ts(RED_FLAGS, "suicidal_ideation"));
    auditTrace.push("Psychiatric emergency detected");
    const partial: Omit<TriageResult, "fhir"> = {
      title: ts(PATHWAY_TITLES, "PSYCHIATRIC_EMERGENCY"), carePath: ts(CARE_PATHS, "psychiatric_emergency"),
      pathway: "PSYCHIATRIC_EMERGENCY", triageColor: "red", score,
      snomedCode: codes.snomed, snomedDisplay: codes.snomedDisplay,
      icd10Code: codes.icd10, icd10Display: codes.icd10Display,
      specialty: codes.specialty, germanSpecialty: codes.germanSpecialty,
      requiredReferral: false,
      referralNote: ts(REFERRAL_NOTES, "no_referral_psychiatric"),
      coverageNote:  ts(COVERAGE_NOTES, "psychiatric_covered"),
      dispatch112: false, isOutOfHours: careCtx.isOutOfHours, outOfHoursNote: careCtx.recommendation,
      redFlags, questions: getFollowUpQs(symptom, locale), auditTrace,
    };
    return { ...partial, fhir: buildFHIR(input, partial) };
  }

  // ── Red flag scoring ──────────────────────────────────────────────────────────
  if (breathingIssue) { score += 15; redFlags.push(ts(RED_FLAGS, "breathing_difficulty")); auditTrace.push("Breathing difficulty → +15 pts"); }
  if (chestTightness && (symptom === "Chest pain" || symptom === "Shortness of breath")) { score += 20; redFlags.push(ts(RED_FLAGS, "chest_tightness")); auditTrace.push("Chest tightness → +20 pts"); }
  if (radiatingPain && symptom === "Chest pain") { score += 15; redFlags.push(ts(RED_FLAGS, "radiating_pain")); auditTrace.push("Radiating chest pain → +15 pts"); }
  if (exertionalPain && symptom === "Chest pain") { score += 10; auditTrace.push("Exertional chest pain → +10 pts"); }
  if (neuroWarning) { score += 18; redFlags.push(ts(RED_FLAGS, "neuro_warning")); auditTrace.push("Neuro warning → +18 pts"); }
  if (confusion)    { score += 15; redFlags.push(ts(RED_FLAGS, "confusion")); auditTrace.push("Confusion → +15 pts"); }
  if (fever && severity >= 7 && !childPatient) { score += 10; redFlags.push(ts(RED_FLAGS, "high_fever")); auditTrace.push("High fever + severity ≥7 → +10 pts"); }
  if (dehydration && (childPatient || age >= 70)) { score += 12; redFlags.push(ts(RED_FLAGS, "dehydration_risk")); auditTrace.push("Dehydration in risk patient → +12 pts"); }
  if (pregnant && fever) { score += 12; redFlags.push(ts(RED_FLAGS, "fever_pregnancy")); auditTrace.push("Fever in pregnancy → +12 pts"); }
  if (symptom === "Rectal bleeding" && severity >= 6) { score += 15; redFlags.push(ts(RED_FLAGS, "rectal_bleeding")); auditTrace.push("Rectal bleeding + severity ≥6 → +15 pts"); }
  if (symptom === "Scrotal pain" && severity >= 5)    { score += 20; redFlags.push(ts(RED_FLAGS, "scrotal_pain")); auditTrace.push("Scrotal pain → +20 pts"); }
  if (symptom === "Haemoptysis")                      { score += 15; redFlags.push(ts(RED_FLAGS, "haemoptysis")); auditTrace.push("Haemoptysis → +15 pts"); }
  if (symptom === "Jaundice" && severity >= 5)        { score += 10; redFlags.push(ts(RED_FLAGS, "jaundice")); auditTrace.push("Jaundice + severity ≥5 → +10 pts"); }

  score = Math.min(100, score);
  const triageColor  = getMTSColor(score);
  const hasRedFlag   = redFlags.length > 0;
  const isHighAcuity = score >= 65;
  const isMedAcuity  = score >= 40;
  const isEmergency  = hasRedFlag && isHighAcuity;

  // ── Pathway decision ──────────────────────────────────────────────────────────
  let pathway: CarePathway;
  let title: string;
  let carePath: string;

  if (codes.adminOnly) {
    pathway  = "VIRTUAL_CONSULT";
    title    = ts(PATHWAY_TITLES, "VIRTUAL_CONSULT");
    carePath = ts(CARE_PATHS, "virtual_admin");
    auditTrace.push("Administrative request → VIRTUAL CONSULT");
  } else if (hasRedFlag && isHighAcuity) {
    pathway  = "HOSPITAL_ER";
    title    = ts(PATHWAY_TITLES, "HOSPITAL_ER");
    carePath = ts(CARE_PATHS, "hospital_er_redflag");
    auditTrace.push(`Red flag + acuity ${score} → HOSPITAL ER`);
  } else if (codes.defaultPathway === "AMBULANCE_112") {
    pathway  = "HOSPITAL_ER";
    title    = ts(PATHWAY_TITLES, "HOSPITAL_ER");
    carePath = `${ts(CARE_PATHS, "hospital_er_highrisk")} (${codes.germanSpecialty})`;
    auditTrace.push("High-risk symptom → HOSPITAL ER");
  } else if (isHighAcuity && !hasRedFlag) {
    pathway  = "HOSPITAL_SPECIALIST";
    title    = ts(PATHWAY_TITLES, "HOSPITAL_SPECIALIST");
    carePath = `${ts(CARE_PATHS, "hospital_specialist")} (${codes.germanSpecialty})`;
    auditTrace.push(`High acuity → HOSPITAL SPECIALIST (${codes.germanSpecialty})`);
  } else if (childPatient || symptom.startsWith("Child")) {
    pathway  = "AMBULATORY_SPECIALIST";
    title    = ts(PATHWAY_TITLES, "AMBULATORY_CARE");
    carePath = ts(CARE_PATHS, "ambulatory_paediatric");
    auditTrace.push("Child patient → PEDIATRICS direct");
  } else if (pregnant) {
    pathway  = "AMBULATORY_SPECIALIST";
    title    = ts(PATHWAY_TITLES, "AMBULATORY_CARE");
    carePath = ts(CARE_PATHS, "ambulatory_obstetric");
    auditTrace.push("Pregnancy → OB/GYN direct");
  } else if (isMedAcuity && !codes.gpDirect) {
    pathway  = "AMBULATORY_SPECIALIST";
    title    = ts(PATHWAY_TITLES, "AMBULATORY_CARE");
    carePath = ts(CARE_PATHS, "ambulatory_specialist").replace("{{specialty}}", codes.germanSpecialty);
    auditTrace.push(`Medium acuity → AMBULATORY SPECIALIST (${codes.germanSpecialty})`);
  } else if (codes.gpDirect && severity <= 3 && !fever && !hasRedFlag) {
    pathway  = "VIRTUAL_CONSULT";
    title    = ts(PATHWAY_TITLES, "VIRTUAL_CONSULT");
    carePath = ts(CARE_PATHS, "virtual_low_severity");
    auditTrace.push("Low severity → VIRTUAL CONSULT");
  } else {
    pathway  = "AMBULATORY_GP";
    title    = ts(PATHWAY_TITLES, "AMBULATORY_CARE");
    carePath = ts(CARE_PATHS, "ambulatory_gp");
    auditTrace.push("Default → AMBULATORY GP");
  }

  // ── Medication escalation override ───────────────────────────────────────────
  if (medRisk.pathwayEscalation) {
    if (pathway === "AMBULATORY_GP" || pathway === "VIRTUAL_CONSULT" || pathway === "AMBULATORY_SPECIALIST") {
      pathway  = "HOSPITAL_ER";
      title    = ts(PATHWAY_TITLES, "HOSPITAL_ER");
      carePath = locale === "de"
        ? `Notfallbeurteilung wegen Medikationsrisiko erforderlich. ${carePath}`
        : `Emergency assessment required due to medication risk. ${carePath}`;
      auditTrace.push("Medication risk → HOSPITAL ER pathway override");
    }
  }

  // ── Out-of-hours override ─────────────────────────────────────────────────────
  if (careCtx.isOutOfHours && (pathway === "AMBULATORY_GP" || pathway === "AMBULATORY_SPECIALIST") && !hasRedFlag) {
    pathway  = "KBD_116117";
    title    = ts(PATHWAY_TITLES, "BEREITSCHAFTSDIENST");
    carePath = locale === "de"
      ? `${careCtx.recommendation}. Rufen Sie 116 117 an für dringende, nicht-notfallmäßige Anliegen außerhalb der Sprechzeiten.`
      : `${careCtx.recommendation}. Call 116 117 for urgent but non-emergency concerns outside GP hours.`;
    auditTrace.push(`Out of hours (${careCtx.dayName} ${careCtx.currentHour}:00) → KBD 116 117`);
  }

  const referral = getReferralRequirement(pathway, insurance, isEmergency, codes.germanSpecialty, codes.gpDirect, locale);

  const coverageNote = (() => {
    if (insurance === "Private Insurance")                          return ts(COVERAGE_NOTES, "private");
    if (pathway === "HOSPITAL_ER")                                  return ts(COVERAGE_NOTES, "emergency");
    if (pathway === "KBD_116117")                                   return ts(COVERAGE_NOTES, "kbd");
    if (pathway === "AMBULATORY_SPECIALIST" && referral.required)   return ts(COVERAGE_NOTES, "specialist_referral");
    return ts(COVERAGE_NOTES, "standard");
  })();

  const partial: Omit<TriageResult, "fhir"> = {
    title, carePath, pathway, triageColor, score,
    snomedCode: codes.snomed, snomedDisplay: codes.snomedDisplay,
    icd10Code: codes.icd10, icd10Display: codes.icd10Display,
    specialty: codes.specialty, germanSpecialty: codes.germanSpecialty,
    requiredReferral: referral.required,
    referralNote:     referral.note,
    coverageNote,
    dispatch112:    false,
    isOutOfHours:   careCtx.isOutOfHours,
    outOfHoursNote: careCtx.recommendation,
    redFlags,
    questions: getFollowUpQs(symptom, locale),
    auditTrace,
  };
  return { ...partial, fhir: buildFHIR(input, partial) };
}