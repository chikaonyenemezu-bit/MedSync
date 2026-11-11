import { randomUUID } from 'crypto';
import type { FHIRBundle } from '@/types/fhir';
import type { IntakeRecord } from '@/types/intake';
import {
  buildPatient,
  buildObservation,
  buildCondition,
  buildEncounter,
  buildClinicalImpression,
} from './buildResources';

export function buildBundle(intake: IntakeRecord): FHIRBundle {
  const id = intake.id;

  // Use confirmed codes if clinician overrode them, otherwise use AI suggestions
  const icd10Code = intake.icd10Confirmed ?? intake.icd10Suggestion ?? '';
  const icd10Display = intake.icd10Display ?? '';
  const snomedCode = intake.snomedConfirmed ?? intake.snomedSuggestion ?? '';
  const snomedDisplay = intake.snomedDisplay ?? '';

  const patient = buildPatient(id);
  const observation = buildObservation(id, intake.chiefComplaint ?? '', snomedCode, snomedDisplay);
  const condition = buildCondition(
    id,
    intake.chiefComplaint ?? '',
    icd10Code,
    icd10Display,
    snomedCode,
    snomedDisplay,
    intake.onset ?? ''
  );
  const encounter = buildEncounter(id);
  const clinicalImpression = buildClinicalImpression(
    id,
    intake.clinicalImpression ?? '',
    intake.chiefComplaint ?? '',
    snomedCode,
    snomedDisplay,
    icd10Code
  );

  return {
    resourceType: 'Bundle',
    id: randomUUID(),
    type: 'transaction',
    timestamp: new Date().toISOString(),
    entry: [
      { resource: patient,            request: { method: 'POST', url: 'Patient' } },
      { resource: observation,        request: { method: 'POST', url: 'Observation' } },
      { resource: condition,          request: { method: 'POST', url: 'Condition' } },
      { resource: encounter,          request: { method: 'POST', url: 'Encounter' } },
      { resource: clinicalImpression, request: { method: 'POST', url: 'ClinicalImpression' } },
    ],
  };
}