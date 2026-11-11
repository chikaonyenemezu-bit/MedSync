export type FHIRResourceType =
  | 'Patient'
  | 'Observation'
  | 'Condition'
  | 'Encounter'
  | 'ClinicalImpression'
  | 'Bundle';

export type FHIRValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_validated';

export interface FHIRCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  meta?: { profile: string[] };
  identifier?: { system: string; value: string }[];
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary' | 'amended';
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  valueString?: string;
  effectiveDateTime?: string;
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: FHIRCodeableConcept;
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  onsetString?: string;
  recordedDate?: string;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'in-progress' | 'finished' | 'cancelled';
  class: FHIRCoding;
  subject: FHIRReference;
  period?: { start: string; end?: string };
}

export interface FHIRClinicalImpression {
  resourceType: 'ClinicalImpression';
  id: string;
  status: 'completed' | 'in-progress';
  subject: FHIRReference;
  summary: string;
  finding?: { itemCodeableConcept: FHIRCodeableConcept }[];
  note?: { text: string }[];
  effectiveDateTime?: string;
}

export interface FHIRBundleEntry {
  resource:
    | FHIRPatient
    | FHIRObservation
    | FHIRCondition
    | FHIREncounter
    | FHIRClinicalImpression;
  request?: {
    method: 'POST' | 'PUT' | 'GET' | 'DELETE' | 'PATCH';
    url: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'transaction' | 'collection';
  timestamp: string;
  entry: FHIRBundleEntry[];
}

export interface FHIRExportRecord {
  id: string;
  intakeId: string;
  bundle: FHIRBundle;
  patientResourceId: string | null;
  observationResourceId: string | null;
  conditionResourceId: string | null;
  encounterResourceId: string | null;
  clinicalImpressionId: string | null;
  validationStatus: FHIRValidationStatus;
  validationErrors: object[] | null;
  validatedAt: string | null;
  exportedAt: string | null;
  exportDestination: string | null;
  createdAt: string;
  updatedAt: string;
}