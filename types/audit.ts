export type AuditEventType =
  | 'intake_created'
  | 'intake_updated'
  | 'ai_extraction_completed'
  | 'intake_assigned'
  | 'intake_reviewed'
  | 'intake_approved'
  | 'intake_rejected'
  | 'fhir_bundle_generated'
  | 'fhir_bundle_validated'
  | 'fhir_bundle_exported'
  | 'icd10_suggested'
  | 'icd10_confirmed'
  | 'icd10_overridden'
  | 'snomed_suggested'
  | 'snomed_confirmed'
  | 'snomed_overridden';

export interface AuditEntry {
  id: string;
  eventType: AuditEventType;
  description: string;
  intakeId: string | null;
  fhirExportId: string | null;
  actorId: string | null;
  actorLabel: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogParams {
  eventType: AuditEventType;
  description: string;
  intakeId?: string;
  fhirExportId?: string;
  actorId?: string;
  actorLabel?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
