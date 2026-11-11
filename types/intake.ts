export type IntakeStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'exported';
export type UrgencyLevel = 'routine' | 'moderate' | 'urgent' | 'emergency';

export interface ExtractedData {
  chiefComplaint: string;
  duration: string;
  onset: string;
  severity: string;
  associatedSymptoms: string[];
  aggravatingFactors: string[];
  alleviatingFactors: string[];
  trigger: string;
  icd10Suggestion: string;
  icd10Display: string;
  snomedSuggestion: string;
  snomedDisplay: string;
  clinicalImpression: string;
  urgency: UrgencyLevel;
}

export interface IntakeRecord {
  id: string;
  patientRef: string;
  narrative: string;
  chiefComplaint: string | null;
  duration: string | null;
  onset: string | null;
  severity: string | null;
  associatedSymptoms: string[] | null;
  aggravatingFactors: string[] | null;
  alleviatingFactors: string[] | null;
  trigger: string | null;
  icd10Suggestion: string | null;
  icd10Display: string | null;
  snomedSuggestion: string | null;
  snomedDisplay: string | null;
  clinicalImpression: string | null;
  urgency: UrgencyLevel;
  status: IntakeStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  clinicianNotes: string | null;
  icd10Confirmed: string | null;
  snomedConfirmed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewIntakeInput {
  patientRef: string;
  narrative: string;
}

export interface ReviewAction {
  intakeId: string;
  action: 'approve' | 'reject';
  clinicianNotes?: string;
  rejectionReason?: string;
  icd10Override?: string;
  snomedOverride?: string;
}
