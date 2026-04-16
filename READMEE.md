# MedSync — AI-Assisted Care Routing Infrastructure for the German Healthcare System

MedSync is a clinical decision support system that routes patients to the appropriate care pathway within the German statutory health insurance (GKV) context. It combines structured clinical triage logic with real German provider data, multilingual patient interaction, and HL7 FHIR R4 output for audit and interoperability compliance.

The system is developed as part of an MSc Digital Health research project at Technische Hochschule Deggendorf, with a focus on reducing inappropriate emergency department utilisation and improving care access in rural Niederbayern.

---

## Clinical Standards

| Standard                       | Implementation                                            |
| ------------------------------ | --------------------------------------------------------- |
| SNOMED CT                      | 65 symptom categories with clinical codes                 |
| ICD-11                         | Diagnostic mapping for all symptom categories             |
| Manchester Triage System (MTS) | 5-level acuity scoring (0–100) with colour classification |
| HL7 FHIR R4                    | ClinicalImpression resource output per triage event       |
| German referral rules          | §73 and §76 SGB V enforced in routing logic               |
| Bereitschaftsdienst routing    | Time-aware routing to 116 117 KBD outside GP hours        |

---

## Care Pathways

The triage engine resolves each case to one of eight care pathways:

- `AMBULANCE_112` — Immediate life threat, dispatch emergency services
- `HOSPITAL_ER` — Emergency department, no referral required
- `HOSPITAL_SPECIALIST` — Inpatient specialist assessment
- `AMBULATORY_SPECIALIST` — Outpatient specialist, referral rules applied
- `AMBULATORY_GP` — General practitioner visit
- `VIRTUAL_CONSULT` — Teleconsultation sufficient
- `PSYCHIATRIC_EMERGENCY` — Crisis intervention, psychiatric emergency department
- `KBD_116117` — Kassenärztlicher Bereitschaftsdienst, out-of-hours routing

---

## Clinical Pattern Detection

Beyond single-symptom scoring, the engine detects composite clinical patterns:

**Immediate life threats → AMBULANCE 112**

- STEMI: chest pain + radiation + exertional onset + severity ≥7
- Stroke: FAST criteria (facial droop, arm weakness, speech, time)
- Respiratory failure: dyspnoea + breathing difficulty + severity ≥8
- Anaphylaxis: allergic reaction + airway compromise
- Obstetric emergency: pregnant + abdominal/pelvic pain + severity ≥8
- Sepsis: fever + confusion + severity ≥8

**Clinical syndrome detection**

- Meningitis: headache/fever + neck stiffness (neuroWarning) + severity ≥6
- Appendicitis: abdominal pain + fever + severity ≥6 + age 5–50
- Diabetic ketoacidosis: diabetic patient + vomiting + confusion or dehydration

**Time-aware routing**

- Detects current time in Europe/Berlin timezone
- Routes ambulatory cases to KBD 116 117 outside GP hours (weekdays before 08:00 and after 18:00, weekends)
- Displays out-of-hours banner to patient with direct 116 117 guidance

---

## German Regulatory Framework

| Regulation  | Implementation                                            |
| ----------- | --------------------------------------------------------- |
| §73 SGB V   | GKV referral requirement enforced for specialist pathways |
| §76 SGB V   | Emergency bypass — no referral required                   |
| §291g SGB V | Teleconsultation pathway                                  |
| §341 SGB V  | ePA-compatible FHIR R4 output                             |
| §65a SGB V  | Krankenkassen digital bonus programme metrics             |
| KHVVG 2025  | Hospital reform context for ER deflection rationale       |

---

## Data Sources

**Hospital registry**

- Source: InEK (Institut für das Entgeltsystem im Krankenhaus)
- Coverage: 1,592 German hospitals nationwide
- Fields: name, location, specialties, nursing ratio (Pflegepersonalquotient), annual case volume, insurance acceptance
- Load scoring: calculated from annual cases and nursing ratio, classified as Normal / Moderate / Crowded

**Ambulatory providers**

- Source: OpenStreetMap Overpass API (kumi.systems server)
- Coverage: 41,869 German healthcare providers (doctors, clinics, hospitals)
- Filtered: Germany only, named providers only, pharmacies excluded
- Fields: name, address, coordinates, opening hours, phone, website, insurance type

**Spatial querying**

- Database: Supabase PostgreSQL with PostGIS extension
- Function: `nearby_unified()` — radius-based spatial search combining both datasets
- Insurance filtering: GKV / PKV applied at query level

---

## Architecture

---

## Technology Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Frontend         | Next.js 15 (App Router), TypeScript, React |
| AI Chat          | Groq API — llama-3.3-70b-versatile         |
| Database         | Supabase (PostgreSQL + PostGIS)            |
| Interoperability | HL7 FHIR R4                                |
| Clinical coding  | SNOMED CT, ICD-11                          |
| Charts           | Recharts                                   |
| Hosting          | Vercel (frontend), Supabase (backend)      |

---

## Multilingual Support

The patient interface supports 10 languages, reflecting the linguistic diversity of patients in the German healthcare system:

| Language  | Locale | RTL |
| --------- | ------ | --- |
| English   | en     | No  |
| German    | de     | No  |
| French    | fr     | No  |
| Turkish   | tr     | No  |
| Russian   | ru     | No  |
| Ukrainian | uk     | No  |
| Hindi     | hi     | No  |
| Urdu      | ur     | Yes |
| Arabic    | ar     | Yes |
| Farsi     | fa     | Yes |

The AI chat layer responds in the selected language via locale-specific system prompts. The clinician portal is restricted to English and German.

---

## Clinician Portal

The clinician portal provides:

- **Analytics dashboard** — pathway distribution, acuity trend, red flag rate, ER deflection savings
- **Krankenkassen-Cockpit** — ROI metrics for GKV partners, FHIR export, regulatory basis
- **Clinician override** — pathway override with justification and audit trail
- **Audit trail** — timestamped triage events with pathway, score, and override history

---

## FHIR R4 Output

Each triage event produces an HL7 FHIR R4 `ClinicalImpression` resource containing:

- SNOMED CT and ICD-11 coding
- MTS acuity score and triage colour
- Recommended care pathway
- Referral requirement status
- Insurance fund
- Out-of-hours flag
- Full decision audit trace

This output is compatible with the German elektronische Patientenakte (ePA) under §341 SGB V and supports MDK audit processes.

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/wilson-bit/MedSync.git
cd MedSync

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
# Add your keys:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# GROQ_API_KEY=

# Run development server
pnpm dev
```

---

## Research Context

This system is developed as part of an MSc Digital Health thesis at Technische Hochschule Deggendorf. The research investigates the feasibility of AI-assisted triage routing in the German GKV context, with a focus on:

- Clinical appropriateness of AI-generated pathway recommendations
- Barriers and enablers to implementation from clinician and Krankenkassen perspectives
- Rural healthcare access in Niederbayern
- ER deflection potential and GKV cost implications

The system is a research prototype. It supports care routing decisions and does not replace physician judgment. Emergency symptoms always require immediate medical attention.

---

## Disclaimer

MedSync is a research prototype developed for academic and feasibility research purposes. It is not a certified medical device and does not constitute medical advice. All triage recommendations are decision support only and must be validated by qualified healthcare professionals before clinical use.

---

## Author

Chika Wilson Onyenemezu Pharmacist · MSc Digital Health Student Technische Hochschule Deggendorf, Germany

Built with the German healthcare system in mind — for every patient who deserves to find the right care, in the right place, at the right time.
