'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  FileText,
  Clipboard,
  AlertTriangle,
  Eye,
  Activity,
} from 'lucide-react';

const ACCENT = '#1A56A0';
const ACCENT_LIGHT = '#EBF2FB';

const WORKFLOW_STEPS = [
  'Intake',
  'AI Extraction',
  'Clinical Review',
  'Approval',
  'FHIR Export',
];

const QUICK_TEMPLATES = [
  {
    label: 'ACS rule-out — chest pain',
    demographics: '58-year-old male. Smoker. Not known to be diabetic.',
    complaint:
      'Patient reports acute central crushing chest pain for 45 minutes while at rest. Severity 8/10. Pain radiates to left arm and jaw. Associated diaphoresis, nausea and shortness of breath. Denies trauma.',
    medications:
      'Amlodipine 5mg PO OD. Atorvastatin 40mg PO nocte. Salbutamol inhaler PRN.',
    changes: 'No recent medication changes. Took Paracetamol 1g PO with no relief.',
    history:
      'Hypertension. Hyperlipidaemia. Family history of premature MI. NKDA. No previous PCI or CABG documented.',
  },
  {
    label: 'Stroke query — FAST positive',
    demographics: '72-year-old female. Lives alone. Independent baseline mobility.',
    complaint:
      'Patient presents with sudden onset right facial droop, slurred speech and right arm weakness noticed 40 minutes ago. Last known well 09:10. No seizure activity reported. Blood glucose not yet documented.',
    medications:
      'Apixaban 5mg PO BD. Bisoprolol 2.5mg PO OD. Ramipril 5mg PO OD.',
    changes: 'No recent medication changes. Missed morning Apixaban dose today according to daughter.',
    history:
      'Atrial fibrillation. Hypertension. Previous TIA 2022. Allergy: Penicillin — rash.',
  },
  {
    label: 'Sepsis screen — UTI source',
    demographics: '81-year-old female. Care home resident. Frailty noted.',
    complaint:
      'Patient has fever, acute confusion and reduced oral intake for 24 hours. Dysuria reported by carers. Temperature 38.7°C. New tachypnoea and general weakness. No flank pain documented.',
    medications:
      'Metformin 500mg PO BD. Furosemide 40mg PO OD. Donepezil 5mg PO nocte.',
    changes: 'Reduced oral intake and missed evening medications yesterday. No new medicines started.',
    history:
      'Type 2 diabetes mellitus. Mild dementia. Recurrent UTIs. CKD stage 3. NKDA.',
  },
  {
    label: 'Asthma exacerbation — wheeze',
    demographics: '24-year-old female. Not pregnant. Non-smoker.',
    complaint:
      'Patient reports worsening wheeze and shortness of breath since last night. Speaking in short sentences. Chest tightness severity 6/10. Dry cough present. Denies fever or chest pain.',
    medications:
      'Salbutamol inhaler 100mcg PRN. Beclometasone inhaler 200mcg BD.',
    changes:
      'Increased Salbutamol use to every 2 hours today. Poor adherence to preventer inhaler for 2 weeks.',
    history:
      'Asthma diagnosed in childhood. Previous ED attendance for asthma 2023. NKDA.',
  },
  {
    label: 'COPD exacerbation — infective',
    demographics: '67-year-old male. Ex-smoker. Uses home nebuliser PRN.',
    complaint:
      'Patient reports increased breathlessness, productive cough and green sputum for 3 days. Reduced exercise tolerance. Denies pleuritic chest pain. Reports low-grade fever and fatigue.',
    medications:
      'Tiotropium inhaler OD. Salbutamol inhaler PRN. Prednisolone rescue pack available at home.',
    changes:
      'Started rescue Prednisolone 30mg PO OD yesterday without clinical review. No antibiotics commenced.',
    history:
      'COPD GOLD II. Hypertension. Previous pneumonia 2021. NKDA.',
  },
  {
    label: 'Hypoglycaemia — insulin treated',
    demographics: '46-year-old male. Type 1 diabetes. Alert but shaky.',
    complaint:
      'Patient reports sweating, tremor, palpitations and confusion after skipping lunch. Capillary blood glucose 2.8 mmol/L. Symptoms improved after oral glucose but recurrent dizziness reported.',
    medications:
      'Insulin glargine 18 units SC nocte. Insulin aspart SC with meals using carbohydrate ratio.',
    changes:
      'Took usual rapid-acting insulin dose but missed lunch due to work. No recent insulin regimen changes.',
    history:
      'Type 1 diabetes mellitus. Previous severe hypoglycaemia episode 2022. NKDA.',
  },
  {
    label: 'DKA query — vomiting',
    demographics: '19-year-old female. Type 1 diabetes. University student.',
    complaint:
      'Patient reports vomiting, abdominal pain and excessive thirst for 12 hours. Polyuria present. Feels weak and drowsy. Capillary glucose 22.4 mmol/L. Ketones not yet documented.',
    medications:
      'Insulin degludec 20 units SC OD. Insulin lispro SC with meals.',
    changes:
      'Missed basal insulin yesterday evening. Reduced food intake due to nausea.',
    history:
      'Type 1 diabetes mellitus diagnosed 2015. Previous DKA admission 2020. NKDA.',
  },
  {
    label: 'Anaphylaxis — antibiotic reaction',
    demographics: '32-year-old female. Not pregnant.',
    complaint:
      'Patient developed widespread urticaria, lip swelling, throat tightness and wheeze 20 minutes after first antibiotic dose. Feels faint. No chest pain reported.',
    medications:
      'Amoxicillin 500mg PO TDS commenced today. Cetirizine 10mg PO OD PRN hay fever.',
    changes: 'First dose of Amoxicillin taken 20 minutes before symptom onset.',
    history:
      'Hay fever. No previously documented drug allergies. No asthma history documented.',
  },
  {
    label: 'Upper GI bleed — melaena',
    demographics: '64-year-old male. Drinks alcohol socially.',
    complaint:
      'Patient reports black tarry stools for 2 days with dizziness on standing and epigastric discomfort. One episode of coffee-ground vomiting this morning. Severity of abdominal pain 4/10.',
    medications:
      'Aspirin 75mg PO OD. Naproxen 500mg PO BD PRN. Omeprazole 20mg PO OD.',
    changes: 'Naproxen used regularly for back pain over the last 10 days.',
    history:
      'Previous peptic ulcer disease. Ischaemic heart disease. NKDA.',
  },
  {
    label: 'Pneumonia query — febrile cough',
    demographics: '59-year-old female. Non-smoker.',
    complaint:
      'Patient reports fever, productive cough, pleuritic right-sided chest pain and shortness of breath for 4 days. Sputum yellow. Severity of chest pain 5/10 on inspiration.',
    medications:
      'Ramipril 10mg PO OD. Simvastatin 20mg PO nocte.',
    changes: 'No recent medication changes. Took Paracetamol 1g PO QDS for fever.',
    history:
      'Hypertension. Hyperlipidaemia. Previous community-acquired pneumonia 2019. NKDA.',
  },
  {
    label: 'Acute abdomen — appendicitis query',
    demographics: '27-year-old male. Normally fit and well.',
    complaint:
      'Patient reports abdominal pain starting peri-umbilically yesterday, now localised to right iliac fossa. Severity 7/10. Associated anorexia and nausea. Low-grade fever. Denies diarrhoea.',
    medications: 'No regular medications.',
    changes: 'Took Ibuprofen 400mg PO once this morning with minimal relief.',
    history: 'No significant past medical history. NKDA. No previous abdominal surgery.',
  },
  {
    label: 'Renal colic — flank pain',
    demographics: '41-year-old male. Works outdoors.',
    complaint:
      'Patient reports sudden severe left flank pain radiating to groin for 3 hours. Severity 9/10, colicky. Associated nausea and visible haematuria. Afebrile.',
    medications: 'No regular medications.',
    changes: 'Took Diclofenac 50mg PO at home 1 hour ago.',
    history: 'Previous renal stone 2018. NKDA. No known CKD.',
  },
  {
    label: 'Heart failure — fluid overload',
    demographics: '76-year-old male. Reduced mobility. Lives with spouse.',
    complaint:
      'Patient reports worsening breathlessness over 1 week, orthopnoea, ankle swelling and 3kg weight gain. No chest pain. Reduced exercise tolerance from 200 metres to room-to-room walking.',
    medications:
      'Furosemide 40mg PO OD. Bisoprolol 5mg PO OD. Ramipril 10mg PO OD. Spironolactone 25mg PO OD.',
    changes: 'Missed Furosemide doses for 3 days due to urinary frequency concerns.',
    history:
      'Heart failure with reduced ejection fraction. Hypertension. CKD stage 3. NKDA.',
  },
  {
    label: 'AF — palpitations',
    demographics: '69-year-old female. Independent. No pregnancy risk.',
    complaint:
      'Patient reports sudden palpitations and light-headedness for 6 hours. Mild shortness of breath. Denies chest pain or syncope. Irregular pulse noted by triage nurse.',
    medications:
      'Levothyroxine 75mcg PO OD. Amlodipine 5mg PO OD.',
    changes: 'No recent medication changes. Increased caffeine intake this week.',
    history:
      'Hypertension. Hypothyroidism. No previous atrial fibrillation documented. NKDA.',
  },
  {
    label: 'DVT query — unilateral leg swelling',
    demographics: '38-year-old female. 6 weeks postpartum.',
    complaint:
      'Patient reports painful swelling of left calf for 2 days. Calf feels warm and tender. Mild shortness of breath denied. No chest pain. Recent reduced mobility after delivery.',
    medications: 'Ferrous sulfate 200mg PO OD. Paracetamol 1g PO PRN.',
    changes: 'No recent medication changes. Not taking hormonal contraception.',
    history:
      'Postpartum 6 weeks. No previous VTE. Family history of DVT in mother. NKDA.',
  },
  {
    label: 'PE query — pleuritic chest pain',
    demographics: '55-year-old male. Recent long-haul flight.',
    complaint:
      'Patient reports sudden pleuritic chest pain and shortness of breath since this morning. Severity 7/10 on inspiration. Mild haemoptysis reported. No fever.',
    medications: 'Lisinopril 10mg PO OD.',
    changes: 'No recent medication changes.',
    history:
      'Hypertension. Recent 11-hour flight 4 days ago. Previous DVT 2017. NKDA.',
  },
  {
    label: 'Medication toxicity — digoxin',
    demographics: '83-year-old female. Low body weight. Lives with daughter.',
    complaint:
      'Patient reports nausea, anorexia, visual disturbance and confusion for 3 days. Bradycardia noted at home. No chest pain. Reduced urine output reported.',
    medications:
      'Digoxin 125mcg PO OD. Furosemide 40mg PO OD. Ramipril 5mg PO OD.',
    changes: 'Recent Clarithromycin 500mg PO BD started 4 days ago for chest infection.',
    history:
      'Atrial fibrillation. Heart failure. CKD stage 3b. Allergy: Penicillin — rash.',
  },
  {
    label: 'Warfarin safety — high INR query',
    demographics: '70-year-old male. Uses community anticoagulation clinic.',
    complaint:
      'Patient reports spontaneous bruising, epistaxis and bleeding gums for 2 days. Denies haematemesis, melaena or head injury. Mild fatigue present.',
    medications:
      'Warfarin variable dose PO OD. Simvastatin 40mg PO nocte. Lansoprazole 30mg PO OD.',
    changes: 'Started Metronidazole 400mg PO TDS 5 days ago for dental infection.',
    history:
      'Atrial fibrillation. Previous DVT. No known liver disease. NKDA.',
  },
  {
    label: 'Paediatric fever — meningitis red flags',
    demographics: '4-year-old male child. Vaccination status unclear.',
    complaint:
      'Child has fever, lethargy, reduced oral intake and vomiting since yesterday. Parent reports neck stiffness and dislike of bright light. Non-blanching rash not confirmed. Reduced urine output.',
    medications: 'Paracetamol suspension PRN. No regular medications.',
    changes: 'Paracetamol given twice today with partial fever reduction.',
    history: 'No significant past medical history. NKDA. No recent travel.',
  },
  {
    label: 'Pregnancy — reduced fetal movement',
    demographics: '30-year-old female. 34 weeks pregnant. G2P1.',
    complaint:
      'Patient reports reduced fetal movements since this morning. No abdominal trauma. Mild lower abdominal tightening. Denies vaginal bleeding or fluid loss. No fever.',
    medications: 'Folic acid 400mcg PO OD. Ferrous sulfate 200mg PO OD.',
    changes: 'No recent medication changes.',
    history:
      'Previous uncomplicated vaginal delivery. Current pregnancy otherwise low risk. NKDA.',
  },
];

const SECTIONS = [
  {
    id: 'demographics',
    label: 'Patient demographics',
    hint: 'Age, sex, pregnancy status',
    placeholder:
      'Document patient age, biological sex, pregnancy status, smoking status, and relevant demographic context.',
    example: 'e.g. 45-year-old female. Not pregnant. Non-smoker.',
    required: true,
    rows: 2,
  },
  {
    id: 'complaint',
    label: 'Presenting complaint',
    hint: 'Chief complaint, onset, duration, severity, character',
    placeholder:
      'Document the presenting complaint using clinical language. Include onset, duration, severity using NRS 0–10, character, radiation, and associated symptoms.',
    example:
      'e.g. Patient reports chest pain for 2 days, severity 6/10, worsening on exertion. Associated dyspnoea. Denies radiation or diaphoresis.',
    required: true,
    rows: 4,
  },
  {
    id: 'medications',
    label: 'Medication history',
    hint: 'Name, dose, frequency, route',
    placeholder:
      'List all current medications including name, dose, frequency, route of administration, and indication where known.',
    example:
      'e.g. Metformin 500mg PO BD. Ramipril 5mg PO OD. Atorvastatin 20mg PO nocte.',
    required: false,
    rows: 3,
  },
  {
    id: 'changes',
    label: 'Recent medication changes',
    hint: 'New, stopped, dose changes, missed doses',
    placeholder:
      'Document recent medication changes: commenced, discontinued, dose-adjusted, missed doses, or patient-initiated changes. Include date where known.',
    example:
      'e.g. Ibuprofen 400mg PO OD commenced 2 days ago. Missed last dose of Metformin. Recent Ramipril dose change requires verification.',
    required: false,
    rows: 3,
  },
  {
    id: 'history',
    label: 'Allergies, reactions and clinical history',
    hint: 'Known diagnoses, allergies with reaction type',
    placeholder:
      'Document known diagnoses, previous episodes, drug allergies with reaction type, and relevant family or social history.',
    example:
      'e.g. T2DM diagnosed 2019. Hypertension. Allergy: Penicillin — anaphylaxis. NKDA to NSAIDs. Previous MI 2021.',
    required: false,
    rows: 3,
  },
];

type IntakeFields = {
  demographics: string;
  complaint: string;
  medications: string;
  changes: string;
  history: string;
};

function buildNarrative(fields: IntakeFields): string {
  const parts = [
    fields.demographics && `${fields.demographics}`,
    fields.complaint && `Presenting complaint: ${fields.complaint}`,
    fields.medications && `Medication history: ${fields.medications}`,
    fields.changes && `Recent medication changes: ${fields.changes}`,
    fields.history && `Allergies and clinical history: ${fields.history}`,
  ].filter(Boolean);

  return parts.join(' ');
}

export default function NarrativeInput() {
  const router = useRouter();

  const [patientRef, setPatientRef] = useState('');
  const [fields, setFields] = useState<IntakeFields>({
    demographics: '',
    complaint: '',
    medications: '',
    changes: '',
    history: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  function applyTemplate(template: (typeof QUICK_TEMPLATES)[0]) {
    setFields({
      demographics: template.demographics,
      complaint: template.complaint,
      medications: template.medications,
      changes: template.changes,
      history: template.history,
    });

    setActiveTemplate(template.label);
  }

  const narrative = buildNarrative(fields);

  const completedCount = SECTIONS.filter((section) => {
    return fields[section.id as keyof IntakeFields]?.trim();
  }).length;

  const requiredComplete =
    fields.demographics.trim().length > 0 && fields.complaint.trim().length > 0;

  const isReady = patientRef.trim().length > 0 && requiredComplete;

  async function handleSubmit() {
    if (!isReady || loading) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        patientRef: patientRef.trim(),
        narrative,
        structuredInput: {
          demographics: fields.demographics,
          presentingComplaint: fields.complaint,
          medicationHistory: fields.medications,
          recentMedicationChanges: fields.changes,
          allergiesAndClinicalHistory: fields.history,
        },
        workflow: {
          stage: 'AI_EXTRACTION',
          status: 'SUBMITTED_FOR_EXTRACTION',
          fhirStatus: 'NOT_GENERATED',
        },
        auditTrail: [
          {
            action: 'INTAKE_CREATED',
            actor: 'Nurse',
            timestamp: new Date().toISOString(),
          },
          {
            action: 'SUBMITTED_FOR_AI_EXTRACTION',
            actor: 'Nurse',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to create clinical intake');
      }

      router.push(`/dashboard/intake/${data.intake.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
              letterSpacing: '-0.2px',
            }}
          >
            Nurse-led clinical intake
          </h1>

          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              maxWidth: 620,
            }}
          >
            Capture the patient narrative as structured clinical documentation.
            MedSync will extract coded clinical data for review, approval, audit
            trail tracking, and FHIR R4 bundle generation.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '6px 12px',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Sections completed
          </span>

          <span
            style={{
              fontWeight: 600,
              color:
                completedCount >= 2 ? ACCENT : 'var(--color-text-secondary)',
            }}
          >
            {completedCount} / {SECTIONS.length}
          </span>
        </div>
      </div>

      {/* Patient reference row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} color={ACCENT} />

          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Patient reference <span style={{ color: '#A32D2D' }}>*</span>
          </label>
        </div>

        <input
          value={patientRef}
          onChange={(e) => setPatientRef(e.target.value)}
          placeholder="e.g. P-1006"
          style={{
            width: 160,
            fontSize: 13,
          }}
        />

        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            marginLeft: 'auto',
          }}
        >
          This reference will follow the case through review, FHIR generation,
          and audit trail.
        </div>
      </div>

      {/* Case workflow tracker */}
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            color: 'var(--color-text-primary)',
          }}
        >
          <Activity size={14} color={ACCENT} />
          Case workflow
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = index === 0;

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: isActive ? ACCENT : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isActive
                      ? ACCENT
                      : 'var(--color-background-secondary)',
                    border: `1px solid ${
                      isActive ? ACCENT : 'var(--color-border-tertiary)'
                    }`,
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Left column */}
        <div>
          {SECTIONS.map((section, index) => {
            const fieldKey = section.id as keyof IntakeFields;
            const isDone = fields[fieldKey].trim().length > 0;

            return (
              <div
                key={section.id}
                style={{
                  background: 'var(--color-background-primary)',
                  border: `0.5px solid ${
                    isDone ? '#B5D4F4' : 'var(--color-border-tertiary)'
                  }`,
                  borderRadius: 'var(--border-radius-lg)',
                  overflow: 'hidden',
                  marginBottom: 10,
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                    background: isDone
                      ? ACCENT_LIGHT
                      : 'var(--color-background-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isDone
                          ? ACCENT
                          : 'var(--color-background-primary)',
                        border: `1.5px solid ${
                          isDone ? ACCENT : 'var(--color-border-secondary)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: isDone ? '#fff' : 'var(--color-text-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {section.label}
                        {section.required && (
                          <span style={{ color: '#A32D2D', marginLeft: 3 }}>
                            *
                          </span>
                        )}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          marginLeft: 8,
                        }}
                      >
                        {section.hint}
                      </span>
                    </div>
                  </div>

                  {isDone && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#3B6D11',
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle size={12} color="#639922" />
                      Completed
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <div style={{ padding: '10px 14px' }}>
                  <textarea
                    value={fields[fieldKey]}
                    onChange={(e) =>
                      setFields((previous) => ({
                        ...previous,
                        [fieldKey]: e.target.value,
                      }))
                    }
                    placeholder={section.placeholder}
                    rows={section.rows}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 13,
                      lineHeight: 1.7,
                      padding: 0,
                      fontFamily: 'inherit',
                      color: 'var(--color-text-primary)',
                    }}
                  />

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                      marginTop: 4,
                      fontStyle: 'italic',
                    }}
                  >
                    {section.example}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-md)',
                background: '#FCEBEB',
                color: '#A32D2D',
                fontSize: 13,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Submit row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={loading || !isReady}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--border-radius-md)',
                background:
                  !isReady || loading
                    ? 'var(--color-background-secondary)'
                    : ACCENT,
                color:
                  !isReady || loading ? 'var(--color-text-secondary)' : '#fff',
                border: 'none',
                cursor: !isReady || loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {loading
                ? 'Running AI extraction...'
                : 'Run AI extraction & send to review'}
            </button>

            {!isReady && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Patient reference, demographics and presenting complaint required
                before AI extraction
              </span>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick templates */}
          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '9px 14px',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Clipboard size={13} color={ACCENT} />
              Quick clinical templates
            </div>

            <div
              style={{
                padding: 8,
                maxHeight: 520,
                overflowY: 'auto',
              }}
            >
              {QUICK_TEMPLATES.map((template) => {
                const isActive = activeTemplate === template.label;

                return (
                  <button
                    key={template.label}
                    onClick={() => applyTemplate(template)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: 6,
                      borderRadius: 'var(--border-radius-md)',
                      border: `0.5px solid ${
                        isActive ? ACCENT : 'var(--color-border-tertiary)'
                      }`,
                      background: isActive
                        ? ACCENT_LIGHT
                        : 'var(--color-background-secondary)',
                      color: isActive
                        ? ACCENT
                        : 'var(--color-text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>
                      {template.label}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {template.complaint.slice(0, 95)}...
                    </div>
                  </button>
                );
              })}

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  padding: '2px 4px',
                }}
              >
                {QUICK_TEMPLATES.length} templates · For demonstration and testing only.
              </div>
            </div>
          </div>

          {/* Narrative preview */}
          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '9px 14px',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Eye size={13} color={ACCENT} />
              Live clinical narrative preview
            </div>

            <div style={{ padding: '10px 14px' }}>
              {narrative ? (
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.75,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  {narrative}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  The clinical narrative will update here as sections are
                  completed. This is the text sent to the AI extraction engine.
                </p>
              )}
            </div>

            {narrative && (
              <div
                style={{
                  padding: '6px 14px',
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {narrative.length} characters · {narrative.split(' ').length}{' '}
                words
              </div>
            )}
          </div>

          {/* Clinical reminder */}
          <div
            style={{
              background: '#FAEEDA',
              border: '0.5px solid #FAC775',
              borderRadius: 'var(--border-radius-lg)',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                color: '#854F0B',
                marginBottom: 8,
              }}
            >
              <AlertTriangle size={13} />
              Clinical documentation reminder
            </div>

            <ul
              style={{
                margin: 0,
                padding: '0 0 0 16px',
                fontSize: 11,
                color: '#854F0B',
                lineHeight: 1.8,
              }}
            >
              <li>Record drug allergies with documented reaction type</li>
              <li>Include dose, frequency and route for all medications</li>
              <li>Flag recent medication changes: commenced, stopped, dose-adjusted</li>
              <li>Note missed doses or patient-initiated changes requiring verification</li>
              <li>Use standard abbreviations: OD, BD, TDS, PRN, STAT, NKDA</li>
              <li>Document symptom severity using NRS 0–10 where applicable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}