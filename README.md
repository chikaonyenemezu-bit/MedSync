# MedSync — AI-Assisted Care Routing for the German Healthcare System

MedSync is an AI-assisted clinical decision support platform designed to guide patients toward appropriate care pathways within the German statutory health insurance (GKV) system. The platform combines structured clinical triage logic, multilingual patient interaction, German healthcare operational rules, and interoperable clinical outputs to support transparent and auditable care routing workflows.

The platform addresses three operational challenges within the German healthcare system:

* Improving patient navigation
* Reducing inappropriate emergency department utilisation
* Expanding access to care in underserved and rural regions such as Niederbayern

---

## Clinical Standards

| Standard                        | Implementation                                             |
| ------------------------------- | ---------------------------------------------------------- |
| SNOMED CT                       | 77 symptom categories with coded clinical terminology      |
| ICD-10-GM                       | Diagnostic mapping across symptom groups                   |
| Manchester Triage System (MTS)  | Five-level acuity classification with severity scoring     |
| German referral regulations     | §73 and §76 SGB V routing logic enforcement                |
| Bereitschaftsdienst integration | Time-aware routing to 116117 outside ambulatory care hours |

---

## Care Pathways

The routing engine maps each presentation to one of eight care pathways:

| Pathway                 | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `AMBULANCE_112`         | Immediate life-threatening emergency requiring dispatch      |
| `HOSPITAL_ER`           | Emergency department evaluation                              |
| `HOSPITAL_SPECIALIST`   | Inpatient specialist assessment                              |
| `AMBULATORY_SPECIALIST` | Outpatient specialist consultation with referral enforcement |
| `AMBULATORY_GP`         | General practitioner management                              |
| `VIRTUAL_CONSULT`       | Teleconsultation appropriate                                 |
| `PSYCHIATRIC_EMERGENCY` | Psychiatric crisis intervention                              |
| `KBD_116117`            | Kassenärztlicher Bereitschaftsdienst out-of-hours routing    |

---

## Clinical Pattern Detection

Beyond isolated symptom scoring, MedSync evaluates composite clinical presentations and escalation patterns.

### Immediate life-threatening presentations → `AMBULANCE_112`

* STEMI: chest pain + radiation + exertional onset + high severity
* Stroke: FAST criteria detection
* Respiratory failure: dyspnoea + respiratory distress
* Anaphylaxis: allergic symptoms with airway compromise
* Obstetric emergency: pregnancy-associated severe abdominal or pelvic pain
* Sepsis: fever with confusion or systemic deterioration

### Clinical syndrome detection

* Meningitis: headache/fever with neck stiffness
* Appendicitis: abdominal pain with fever in appropriate age ranges
* Diabetic ketoacidosis: diabetes history with vomiting, dehydration, or confusion

### Safety Constraints

* Ambiguous presentations bias toward higher-acuity pathways
* Red flag symptoms override confidence-based routing
* Low-confidence assessments escalate to clinician review
* Recommendations remain non-binding clinical decision support only

---

## Time-Aware Routing Logic

The platform detects local time within the Europe/Berlin timezone and dynamically adjusts ambulatory routing.

Cases requiring non-emergent ambulatory care are redirected to the Kassenärztlicher Bereitschaftsdienst (116117) outside GP operating hours:

* Weekdays before 08:00 and after 18:00
* Weekends and public holidays

Patients receive contextual out-of-hours guidance with direct 116117 routing instructions.

---

## German Regulatory Framework

| Regulation  | Implementation                                              |
| ----------- | ----------------------------------------------------------- |
| §73 SGB V   | Referral requirement enforcement for specialist pathways    |
| §76 SGB V   | Emergency care bypass logic                                 |
| §291g SGB V | Teleconsultation pathway support                            |
| §65a SGB V  | Digital bonus programme analytics support                   |
| KHVVG 2025  | Hospital reform context for emergency utilisation reduction |

---

## Healthcare Data Sources

### Hospital Registry

**Source:** InEK (Institut für das Entgeltsystem im Krankenhaus)

Coverage includes 1,592 hospitals across Germany with:

* Hospital location and specialty data
* Annual case volume
* Insurance acceptance
* Pflegepersonalquotient (nursing staffing ratio)

Operational load scoring is calculated using annual volume and staffing metrics and classified as:

* Normal
* Moderate
* Crowded

### Ambulatory Provider Registry

**Source:** OpenStreetMap Overpass API (kumi.systems)

Coverage includes 41,869 German healthcare providers.

Filtering logic includes:

* Germany-only providers
* Named healthcare facilities only
* Pharmacy exclusion

Available fields:

* Name
* Address
* Coordinates
* Opening hours
* Contact details
* Insurance acceptance

### Spatial Query Infrastructure

| Component           | Implementation                                  |
| ------------------- | ----------------------------------------------- |
| Database            | Supabase PostgreSQL with PostGIS                |
| Spatial search      | `nearby_unified()` radius-based querying        |
| Query logic         | Unified hospital and ambulatory provider search |
| Insurance filtering | GKV/PKV filtering at query level                |

---

## Technology Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| Frontend             | Next.js 15, TypeScript, React      |
| Conversational Layer | Groq API — llama-3.3-70b-versatile |
| Database             | Supabase PostgreSQL + PostGIS      |
| Clinical coding      | SNOMED CT, ICD-10-GM               |
| Analytics            | Recharts                           |
| Hosting              | Vercel + Supabase                  |

---

## Clinician Portal

The clinician portal provides operational oversight and auditability features, including:

* Analytics dashboard for pathway distribution and acuity trends
* Acute care utilisation analytics and emergency diversion metrics
* GKV-oriented reporting and ROI dashboards
* Clinician pathway override with justification logging
* Timestamped audit trails for triage events and routing decisions

---

## Multilingual Support

| Language | Locale |
| -------- | ------ |
| English  | `en`   |
| German   | `de`   |

The patient-facing conversational layer responds in the selected locale using language-specific system prompts. The clinician portal is restricted to English and German.

---

## Local Development

```bash
git clone https://github.com/wilson-bit/MedSync.git
cd MedSync

pnpm install

cp .env.example .env.local

# Required environment variables:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# GROQ_API_KEY=

pnpm dev
```

---

## Disclaimer

MedSync is a research prototype and is not a certified medical device. The platform is intended for clinical decision support and does not provide autonomous diagnosis or definitive medical recommendations.

All triage recommendations require validation by qualified healthcare professionals before clinical use.

Emergency symptoms always require immediate medical attention.

---

## Author

**Pharm Chika Wilson Onyenemezu**
MSc Industrial Pharmacy 

Built with the German healthcare system in mind — for every patient who deserves to find the right care, in the right place, at the right time.
