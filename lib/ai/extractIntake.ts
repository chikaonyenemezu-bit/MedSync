import Groq from 'groq-sdk';
import type { ExtractedData, UrgencyLevel } from '@/types/intake';
import { validateICD10Code, searchICD10 } from '@/lib/coding/icd10Lookup';
import {
  validateSNOMEDConcept,
  searchSNOMEDConcepts,
  type SNOMEDSearchResult,
} from '@/lib/coding/snomedLookup';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a clinical intake assistant. Your job is to extract structured clinical information from a patient-reported narrative.

You must respond with a single valid JSON object and nothing else — no preamble, no explanation, no markdown fences.

The JSON must match this exact shape:
{
  "chiefComplaint": "string — primary symptom or presenting complaint in short clinical language",
  "duration": "string — how long the symptom has been present",
  "onset": "string — how it started, e.g. Sudden, Acute, Gradual",
  "severity": "string — perceived severity: Mild / Moderate / Severe",
  "associatedSymptoms": ["array of strings"],
  "aggravatingFactors": ["array of strings — what makes it worse"],
  "alleviatingFactors": ["array of strings — what makes it better"],
  "trigger": "string — any identifiable trigger or empty string",
  "clinicalImpression": "string — one sentence clinical impression, not a diagnosis",
  "urgency": "one of: routine | moderate | urgent | emergency"
}

Rules:
- Never diagnose. clinicalImpression must say "possible", "may suggest", or "further assessment required".
- Extract the chiefComplaint from the narrative only.
- Do not invent symptoms.
- Do not choose a default complaint.
- Do not return chest pain unless chest pain is clearly stated in the narrative.
- If pregnancy-related symptoms are present, prioritise the obstetric presenting complaint over general symptoms.
- If the narrative mentions reduced fetal movement, decreased fetal movement, baby moving less, reduced foetal movement, or reduced fetal movements, chiefComplaint must be "Reduced fetal movement".
- Reduced fetal movement in the third trimester must be urgency = urgent.
- urgency = emergency only if symptoms suggest immediate life threat, such as chest pain with dyspnoea, signs of stroke, severe trauma, severe bleeding, or airway compromise.
- urgency = urgent if symptoms are significant and need same-day attention.
- urgency = moderate if symptoms need attention within 24-48 hours.
- urgency = routine for all other cases.
- Do not return ICD-10 codes.
- Do not return icd10Suggestion.
- Do not return icd10Display.
- Do not return SNOMED CT codes.
- Do not return snomedSuggestion.
- Do not return snomedDisplay.
- ICD-10-GM and SNOMED CT mapping will be performed separately by the application using terminology lookup services.
- onset: use "Acute" if symptoms escalated rapidly within hours. Use "Sudden" for instantaneous onset. Use "Gradual" only for progression over days or weeks.
- trigger: extract any identifiable precipitating factor including medication non-adherence, recent illness, allergen exposure, exercise, stress, or overuse of reliever medication. Do not leave empty if the narrative contains a plausible trigger.
- If a field cannot be determined from the narrative, use an empty string or empty array.`;

type AIExtractedData = {
  chiefComplaint?: string;
  duration?: string;
  onset?: string;
  severity?: string;
  associatedSymptoms?: string[];
  aggravatingFactors?: string[];
  alleviatingFactors?: string[];
  trigger?: string;
  clinicalImpression?: string;
  urgency?: UrgencyLevel;

  // AI may still hallucinate these, so we ignore them.
  icd10Suggestion?: string;
  icd10Display?: string;
  snomedSuggestion?: string;
  snomedDisplay?: string;
};

type ICD10SearchResult = {
  code: string;
  title: string;
  isBillable?: boolean;
  level?: number;
};

export async function extractIntake(narrative: string): Promise<ExtractedData> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Extract structured clinical information from this patient narrative:\n\n"${narrative}"`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: AIExtractedData;

  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse Groq response as JSON: ${clean}`);
  }

  console.log('[extractIntake] raw parsed:', JSON.stringify(parsed, null, 2));

  const extracted: ExtractedData = {
    chiefComplaint: parsed.chiefComplaint ?? '',
    duration: parsed.duration ?? '',
    onset: parsed.onset ?? '',
    severity: parsed.severity ?? '',
    associatedSymptoms: Array.isArray(parsed.associatedSymptoms)
      ? parsed.associatedSymptoms
      : [],
    aggravatingFactors: Array.isArray(parsed.aggravatingFactors)
      ? parsed.aggravatingFactors
      : [],
    alleviatingFactors: Array.isArray(parsed.alleviatingFactors)
      ? parsed.alleviatingFactors
      : [],
    trigger: parsed.trigger ?? '',

    // Important: ICD-10 always starts empty.
    // We do NOT trust or use AI-generated ICD-10 values.
    icd10Suggestion: '',
    icd10Display: '',

    // Important: SNOMED always starts empty.
    // We do NOT trust or use AI-generated SNOMED values.
    snomedSuggestion: '',
    snomedDisplay: '',

    clinicalImpression: parsed.clinicalImpression ?? '',
    urgency: parsed.urgency ?? 'routine',
  };

  applyClinicalOverrides(extracted, narrative);

  const validUrgencies: UrgencyLevel[] = [
    'routine',
    'moderate',
    'urgent',
    'emergency',
  ];

  if (!validUrgencies.includes(extracted.urgency)) {
    extracted.urgency = 'routine';
  }

  await Promise.all([
    searchAndValidateICD10(extracted, narrative),
    searchAndValidateSNOMED(extracted),
  ]);

  console.log(
    '[extractIntake] final extracted:',
    JSON.stringify(extracted, null, 2)
  );

  return extracted;
}

function applyClinicalOverrides(parsed: ExtractedData, narrative: string): void {
  const text = narrative.toLowerCase();

  const hasReducedFetalMovement =
    text.includes('reduced fetal movement') ||
    text.includes('reduced fetal movements') ||
    text.includes('decreased fetal movement') ||
    text.includes('decreased fetal movements') ||
    text.includes('reduced foetal movement') ||
    text.includes('reduced foetal movements') ||
    text.includes('baby moving less');

  const isPregnant =
    text.includes('pregnant') ||
    text.includes('pregnancy') ||
    /\b\d{1,2}\s*weeks\b/.test(text) ||
    /\bg\d+p\d+\b/i.test(narrative);

  const thirdTrimester =
    /\b(2[8-9]|3[0-9]|4[0-2])\s*weeks\b/.test(text) ||
    text.includes('third trimester');

  if (hasReducedFetalMovement) {
    parsed.chiefComplaint = 'Reduced fetal movement';

    parsed.clinicalImpression =
      'Reduced fetal movement in pregnancy may suggest fetal wellbeing concern; urgent maternity assessment required.';

    if (isPregnant && thirdTrimester) {
      parsed.urgency = 'urgent';
    }

    if (!parsed.associatedSymptoms) {
      parsed.associatedSymptoms = [];
    }

    if (
      text.includes('abdominal tightening') &&
      !parsed.associatedSymptoms.some((symptom) =>
        symptom.toLowerCase().includes('abdominal tightening')
      )
    ) {
      parsed.associatedSymptoms.push('Mild lower abdominal tightening');
    }

    parsed.associatedSymptoms = parsed.associatedSymptoms.filter((symptom) => {
      const s = symptom.toLowerCase();

      if (
        text.includes('denies vaginal bleeding') &&
        s.includes('vaginal bleeding')
      ) {
        return false;
      }

      if (
        text.includes('denies fluid loss') &&
        (s.includes('fluid loss') || s.includes('rupture of membranes'))
      ) {
        return false;
      }

      if (text.includes('no fever') && s.includes('fever')) {
        return false;
      }

      return true;
    });
  }
}

async function searchAndValidateICD10(
  parsed: ExtractedData,
  narrative: string
): Promise<void> {
  const query = buildICD10SearchQuery(parsed, narrative);

  parsed.icd10Suggestion = '';
  parsed.icd10Display = '';

  if (!query) return;

  const results = await searchICD10(query);

  console.log('[ICD-10 search query]', query);
  console.log('[ICD-10 search results]', JSON.stringify(results, null, 2));

  if (!results.length) return;

  const best = selectBestICD10Match(query, results);

  if (!best) return;

  const validated = await validateICD10Code(best.code);

  if (validated?.valid) {
    parsed.icd10Suggestion = best.code;
    parsed.icd10Display = validated.title;
    return;
  }

  parsed.icd10Suggestion = best.code;
  parsed.icd10Display = best.title;
}

function buildICD10SearchQuery(
  parsed: ExtractedData,
  narrative: string
): string {
  const complaint = parsed.chiefComplaint?.trim() ?? '';
  const text = narrative.toLowerCase();

  if (
    complaint.toLowerCase().includes('reduced fetal movement') ||
    text.includes('reduced fetal movement') ||
    text.includes('reduced fetal movements') ||
    text.includes('decreased fetal movement') ||
    text.includes('decreased fetal movements')
  ) {
    return 'verminderte kindsbewegungen schwangerschaft';
  }

  if (
    complaint.toLowerCase().includes('chest pain') ||
    text.includes('chest pain') ||
    text.includes('central crushing chest pain')
  ) {
    return 'brustschmerz';
  }

  if (
    complaint.toLowerCase().includes('shortness of breath') ||
    complaint.toLowerCase().includes('dyspnoea') ||
    complaint.toLowerCase().includes('dyspnea')
  ) {
    return 'dyspnoe';
  }

  if (complaint.toLowerCase().includes('headache')) {
    return 'kopfschmerz';
  }

  if (complaint.toLowerCase().includes('abdominal pain')) {
    return 'bauchschmerz';
  }

  if (complaint.toLowerCase().includes('fever')) {
    return 'fieber';
  }

  if (complaint.toLowerCase().includes('dizziness')) {
    return 'schwindel';
  }

  return complaint;
}

async function searchAndValidateSNOMED(parsed: ExtractedData): Promise<void> {
  const query = parsed.chiefComplaint?.trim();

  parsed.snomedSuggestion = '';
  parsed.snomedDisplay = '';

  if (!query) return;

  const results = await searchSNOMEDConcepts(query, 10);

  console.log('[SNOMED search query]', query);
  console.log('[SNOMED search results]', JSON.stringify(results, null, 2));

  if (!results.length) return;

  const best = selectBestSNOMEDMatch(query, results);

  if (!best) return;

  const validated = await validateSNOMEDConcept(best.conceptId);

  if (validated?.valid && validated.active) {
    parsed.snomedSuggestion = validated.conceptId;
    parsed.snomedDisplay = validated.display;
    return;
  }

  parsed.snomedSuggestion = best.conceptId;
  parsed.snomedDisplay = best.display;
}

function normaliseClinicalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/foetal/g, 'fetal')
    .replace(/movements/g, 'movement')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normaliseCodingText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectBestSNOMEDMatch(
  query: string,
  results: SNOMEDSearchResult[]
): SNOMEDSearchResult | null {
  const q = normaliseClinicalText(query);

  const exact = results.find((result) => {
    const display = normaliseClinicalText(result.display);
    return display === q;
  });

  if (exact) return exact;

  const strongContainment = results.find((result) => {
    const display = normaliseClinicalText(result.display);
    return display.includes(q) || q.includes(display);
  });

  if (strongContainment) return strongContainment;

  const queryTokens = q.split(' ').filter((token) => token.length > 2);

  if (!queryTokens.length) {
    return results[0] ?? null;
  }

  const scored = results
    .map((result) => {
      const display = normaliseClinicalText(result.display);
      const displayTokens = display.split(' ');

      const overlap = queryTokens.filter((token) =>
        displayTokens.includes(token)
      ).length;

      return {
        result,
        overlap,
      };
    })
    .filter((item) => {
      const requiredOverlap = Math.max(
        1,
        Math.ceil(queryTokens.length * 0.6)
      );

      return item.overlap >= requiredOverlap;
    })
    .sort((a, b) => b.overlap - a.overlap);

  return scored[0]?.result ?? null;
}

function selectBestICD10Match(
  query: string,
  results: ICD10SearchResult[]
): ICD10SearchResult | null {
  const q = normaliseCodingText(query);

  const billableResults = results.filter((result) => result.isBillable);
  const candidates = billableResults.length ? billableResults : results;

  const exact = candidates.find((result) => {
    const title = normaliseCodingText(result.title);
    return title === q;
  });

  if (exact) return exact;

  const strongContainment = candidates.find((result) => {
    const title = normaliseCodingText(result.title);
    return title.includes(q) || q.includes(title);
  });

  if (strongContainment) return strongContainment;

  const queryTokens = q.split(' ').filter((token) => token.length > 2);

  if (!queryTokens.length) {
    return candidates[0] ?? null;
  }

  const scored = candidates
    .map((result) => {
      const title = normaliseCodingText(result.title);
      const titleTokens = title.split(' ');

      const overlap = queryTokens.filter((token) =>
        titleTokens.includes(token)
      ).length;

      const billableBoost = result.isBillable ? 2 : 0;
      const levelBoost = result.level === 4 || result.level === 5 ? 1 : 0;

      return {
        result,
        score: overlap + billableBoost + levelBoost,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.result ?? null;
}