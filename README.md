# MedSync

### Clinical Intake & Healthcare Interoperability Platform

MedSync is a web-based healthcare application designed to simplify clinical documentation and improve the exchange of patient information between healthcare systems.

It uses AI to extract relevant information from clinical notes, supports medical coding, and converts approved records into HL7 FHIR R4 resources.

**Live Demo:** https://med-sync-plum.vercel.app/dashboard

## Features

- **Clinical Intake:** Record patient symptoms, medical history, and observations.
- **AI-Assisted Documentation:** Extract and organize clinical information from free-text notes.
- **Medical Coding:** Suggest SNOMED CT and ICD-10-GM codes.
- **Clinical Review:** Review, approve, or reject records before export.
- **FHIR Integration:** Generate FHIR R4 resources for healthcare data exchange.
- **Audit Trail:** Track clinical activities and record changes.
- **Dashboard:** Monitor patient intakes, pending reviews, and exports.

## Workflow

```text
Patient Intake
      ↓
AI Information Extraction
      ↓
Medical Coding Suggestions
      ↓
Clinical Review & Approval
      ↓
FHIR R4 Generation
      ↓
Healthcare Data Exchange
```

## Standards

- **HL7 FHIR R4** – Healthcare data exchange
- **SNOMED CT** – Clinical terminology
- **ICD-10-GM** – Medical classification
- **HAPI FHIR** – FHIR server integration

## Project Purpose

MedSync demonstrates how AI and healthcare interoperability standards can be combined to improve clinical documentation, reduce manual data entry, and support structured information exchange.

The application is a demonstration project and is not intended for actual patient care.

## Live Demo

https://med-sync-plum.vercel.app/dashboard
