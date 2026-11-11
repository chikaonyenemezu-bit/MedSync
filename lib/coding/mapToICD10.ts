// Common ICD-10-GM codes for quick lookup and display
// This is a curated subset for demo purposes.
// In production, query the BfArM ICD-10-GM catalog directly.

export const ICD10_MAP: Record<string, string> = {
  'R07.9': 'Chest pain, unspecified',
  'R07.0': 'Pain in throat',
  'R07.1': 'Chest pain on breathing',
  'R07.4': 'Chest pain, other',
  'R05':   'Cough',
  'R06.0': 'Dyspnoea',
  'R06.00':'Dyspnoea, unspecified',
  'R42':   'Dizziness and giddiness',
  'R51':   'Headache',
  'R10.9': 'Unspecified abdominal pain',
  'R10.0': 'Acute abdomen',
  'R10.1': 'Pain localised to upper abdomen',
  'R10.4': 'Other and unspecified abdominal pain',
  'R11':   'Nausea and vomiting',
  'R50.9': 'Fever, unspecified',
  'R54':   'Senility',
  'R41.3': 'Other amnesia',
  'R55':   'Syncope and collapse',
  'R00.0': 'Tachycardia, unspecified',
  'R00.1': 'Bradycardia, unspecified',
  'R73.0': 'Abnormal glucose',
  'Z03.9': 'Observation for suspected disease, unspecified',
};

export const SNOMED_MAP: Record<string, string> = {
  '29857009':  'Chest pain',
  '230145002': 'Difficulty breathing',
  '25064002':  'Headache',
  '404640003': 'Dizziness',
  '21522001':  'Abdominal pain',
  '422587007': 'Nausea',
  '386661006': 'Fever',
  '57676002':  'Joint pain',
  '49727002':  'Cough',
  '271807003': 'Eruption of skin',
  '48694002':  'Anxiety',
  '35489007':  'Depressive disorder',
};

export function lookupICD10Display(code: string): string {
  return ICD10_MAP[code] ?? code;
}

export function lookupSNOMEDDisplay(code: string): string {
  return SNOMED_MAP[code] ?? code;
}
