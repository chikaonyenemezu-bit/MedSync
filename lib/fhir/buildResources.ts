import type {
  FHIRPatient,
  FHIRObservation,
  FHIRCondition,
  FHIREncounter,
  FHIRClinicalImpression,
} from '@/types/fhir';

// ── Patient ─────────────────────────────────────────────────────────────────

export function buildPatient(intakeId: string): FHIRPatient {
  return {
    resourceType: 'Patient',
    id: `pat-${intakeId}`,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    identifier: [
      {
        system: 'https://medsync.demo/patient-ref',
        value: intakeId,
      },
    ],
  };
}

// ── Observation ──────────────────────────────────────────────────────────────

export function buildObservation(
  intakeId: string,
  chiefComplaint: string,
  snomedCode: string,
  snomedDisplay: string
): FHIRObservation {
  return {
    resourceType: 'Observation',
    id: `obs-${intakeId}`,
    status: 'preliminary',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: snomedCode || '404684003',
          display: snomedDisplay || 'Clinical finding',
        },
      ],
      text: chiefComplaint,
    },
    subject: {
      reference: `Patient/pat-${intakeId}`,
    },
    valueString: chiefComplaint,
    effectiveDateTime: new Date().toISOString(),
  };
}

// ── Condition ────────────────────────────────────────────────────────────────

export function buildCondition(
  intakeId: string,
  chiefComplaint: string,
  icd10Code: string,
  icd10Display: string,
  snomedCode: string,
  snomedDisplay: string,
  onset: string
): FHIRCondition {
  return {
    resourceType: 'Condition',
    id: `con-${intakeId}`,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://fhir.de/CodeSystem/bfarm/icd-10-gm',
          code: icd10Code || 'Z03.9',
          display: icd10Display || 'Observation for suspected disease',
        },
        ...(snomedCode
          ? [
              {
                system: 'http://snomed.info/sct',
                code: snomedCode,
                display: snomedDisplay,
              },
            ]
          : []),
      ],
      text: chiefComplaint,
    },
    subject: {
      reference: `Patient/pat-${intakeId}`,
    },
    onsetString: onset || undefined,
    recordedDate: new Date().toISOString(),
  };
}

// ── Encounter ────────────────────────────────────────────────────────────────

export function buildEncounter(intakeId: string): FHIREncounter {
  return {
    resourceType: 'Encounter',
    id: `enc-${intakeId}`,
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'Ambulatory',
    },
    subject: {
      reference: `Patient/pat-${intakeId}`,
    },
    period: {
      start: new Date().toISOString(),
    },
  };
}

// ── ClinicalImpression ───────────────────────────────────────────────────────

export function buildClinicalImpression(
  intakeId: string,
  clinicalImpression: string,
  chiefComplaint: string,
  snomedCode: string,
  snomedDisplay: string,
  icd10Code: string
): FHIRClinicalImpression {
  return {
    resourceType: 'ClinicalImpression',
    id: `ci-${intakeId}`,
    status: 'completed',
    subject: {
      reference: `Patient/pat-${intakeId}`,
    },
    summary: clinicalImpression,
    finding: [
      {
        itemCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: snomedCode || '404684003',
              display: snomedDisplay || 'Clinical finding',
            },
          ],
          text: chiefComplaint,
        },
      },
    ],
    note: icd10Code
      ? [{ text: `ICD-10-GM suggestion: ${icd10Code}` }]
      : undefined,
    effectiveDateTime: new Date().toISOString(),
  };
}
