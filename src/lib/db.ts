// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — In-Memory Data Store (No Database Required)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Replaces Prisma/SQLite with a simple in-memory store.
// Data is pre-loaded with demo seed data and persists during the server runtime.
// For production, replace with a real DB (PostgreSQL, MongoDB, etc.).

import { createId } from '@paralleldrive/cuid2';

// ── Type Definitions ──

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  specialty?: string;
  npi?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  mrn?: string;
  memberId?: string;
  payerId?: string;
  payerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  diagnosisNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Biomarker {
  id: string;
  patientId: string;
  type: string;
  value: number;
  unit?: string;
  dateCollected: string;
  notes?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  patientId: string;
  createdById?: string;
  drugId: string;
  drugName: string;
  indicationId: string;
  indication: string;
  payerId: string;
  payerName: string;
  icd10Code?: string;
  icd10Desc?: string;
  stage: string;
  priority: string;
  gapCheckResult?: string;
  docCheckResult?: string;
  icd10Validation?: string;
  aiVerdict?: string;
  aiNotes?: string;
  denialReason?: string;
  denialDate?: string;
  appealResult?: string;
  appealDate?: string;
  appealStatus?: string;
  submittedDate?: string;
  approvedDate?: string;
  deniedDate?: string;
  closedDate?: string;
  daysToDecision?: number;
  externalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  submissionId: string;
  type: string;
  name: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileData?: string;
  category: string;
  status: string;
  notes?: string;
  uploadedById?: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  submissionId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  submissionId: string;
  event: string;
  description: string;
  metadata?: string;
  userId?: string;
  createdAt: string;
}

// ── In-Memory Collections ──

const users: Map<string, User> = new Map();
const patients: Map<string, Patient> = new Map();
const biomarkers: Map<string, Biomarker> = new Map();
const submissions: Map<string, Submission> = new Map();
const documents: Map<string, Document> = new Map();
const auditLogs: Map<string, AuditLog> = new Map();
const timelineEvents: Map<string, TimelineEvent> = new Map();

// ── Helper Functions ──

function now(): string {
  return new Date().toISOString();
}

function createRecord<T extends Record<string, unknown>>(base: T, id?: string): T & { id: string; createdAt: string; updatedAt: string } {
  const record = {
    ...base,
    id: id || createId(),
    createdAt: now(),
    updatedAt: now(),
  } as T & { id: string; createdAt: string; updatedAt: string };
  return record;
}

// ── Seed Data ──

function seedData() {
  // Users
  const admin = createRecord({ email: 'admin@maya.com', name: 'Maya Admin', role: 'admin', phone: '(303) 555-0001', npi: '1234567890', specialty: 'Healthcare Administration', isActive: true });
  const coordinator = createRecord({ email: 'coordinator@maya.com', name: 'Sarah Mitchell', role: 'coordinator', phone: '(303) 555-0002', isActive: true });
  const provider = createRecord({ email: 'dr.chen@maya.com', name: 'Dr. Emily Chen', role: 'provider', specialty: 'Allergy & Immunology', npi: '9876543210', phone: '(303) 555-0003', isActive: true });
  users.set(admin.id, admin);
  users.set(coordinator.id, coordinator);
  users.set(provider.id, provider);

  // Patients
  const patient1 = createRecord({
    firstName: 'James', lastName: 'Rodriguez', dateOfBirth: '1985-03-15', gender: 'Male',
    mrn: 'MRN-2024-0001', memberId: 'UHC-MBR-8847291', payerId: 'uhc', payerName: 'UnitedHealthcare (UHC)',
    phone: '(720) 555-0101', email: 'james.rodriguez@email.com', address: '1842 Oak Street, Denver, CO 80202',
    allergies: JSON.stringify(['Dust mites', 'Cat dander', 'Cockroach', 'Tree pollen']),
    diagnosisNotes: 'Severe persistent allergic asthma (J45.50) with documented IgE-mediated response to perennial allergens. History of 4 exacerbations in past 12 months requiring OCS bursts. Failed high-dose ICS+LABA for 6 months.',
    isActive: true,
  });
  const patient2 = createRecord({
    firstName: 'Maria', lastName: 'Thompson', dateOfBirth: '1992-07-22', gender: 'Female',
    mrn: 'MRN-2024-0002', memberId: 'BCBS-MBR-5562938', payerId: 'bcbs', payerName: 'Blue Cross Blue Shield (BCBS)',
    phone: '(720) 555-0102', address: '2331 Pine Avenue, Boulder, CO 80301',
    allergies: JSON.stringify(['None known']),
    diagnosisNotes: 'Eosinophilic asthma (J45.50, D72.1) with elevated blood eosinophils. 3 exacerbations/year despite high-dose ICS+LABA+LAMA for 4 months. OCS-dependent. FeNO elevated at 48 ppb.',
    isActive: true,
  });
  const patient3 = createRecord({
    firstName: 'Robert', lastName: 'Kim', dateOfBirth: '1978-11-08', gender: 'Male',
    mrn: 'MRN-2024-0003', memberId: 'CIGNA-MBR-7728194', payerId: 'cigna', payerName: 'Cigna',
    phone: '(303) 555-0103', address: '455 Elm Court, Aurora, CO 80012',
    allergies: JSON.stringify(['Aspirin (exacerbation)', 'Dust mites', 'Mold']),
    diagnosisNotes: 'Chronic spontaneous urticaria (L50.1) refractory to up-titrated H1-antihistamines (cetirizine 40mg daily) and H2 blocker (famotidine). UAS7 score of 28. Duration >12 weeks. DLQI severely impaired.',
    isActive: true,
  });
  const patient4 = createRecord({
    firstName: 'Emma', lastName: 'Williams', dateOfBirth: '2010-05-30', gender: 'Female',
    mrn: 'MRN-2024-0004', memberId: 'AETNA-MBR-3317825', payerId: 'aetna', payerName: 'Aetna',
    phone: '(720) 555-0104', address: '678 Birch Lane, Englewood, CO 80110',
    allergies: JSON.stringify(['Peanut', 'Tree nuts', 'Egg', 'Milk', 'Dust mites', 'Cat dander']),
    diagnosisNotes: 'Severe atopic dermatitis (L20.9) - EASI score 28, IGA 4. Failed medium-potency TCS for 6 weeks, tacrolimus ointment for 4 weeks. BSA affected 45%. DLQI 22.',
    isActive: true,
  });
  const patient5 = createRecord({
    firstName: 'David', lastName: 'Patel', dateOfBirth: '1965-09-12', gender: 'Male',
    mrn: 'MRN-2024-0005', memberId: 'MCD-MBR-9920184', payerId: 'co-medicaid', payerName: 'Colorado Medicaid',
    phone: '(303) 555-0105', address: '312 Maple Drive, Lakewood, CO 80226',
    allergies: JSON.stringify(['Ragweed', 'Grass', 'Dog dander']),
    diagnosisNotes: 'Severe persistent asthma (J45.50) with low biomarkers: eos 120, IgE 22, FeNO 18. Rules out Xolair (IgE <30), Nucala/Fasenra (eos <150), Dupixent (eos <150, FeNO <25). Tezspire is the ONLY option. ACT score 12. 5 exacerbations/year including 2 hospitalizations.',
    isActive: true,
  });
  patients.set(patient1.id, patient1);
  patients.set(patient2.id, patient2);
  patients.set(patient3.id, patient3);
  patients.set(patient4.id, patient4);
  patients.set(patient5.id, patient5);

  // Biomarkers
  const bio1: Biomarker[] = [
    { id: createId(), patientId: patient1.id, type: 'ige', value: 342, unit: 'IU/mL', dateCollected: '2024-09-15', notes: 'Positive for dust mite, cat, cockroach', createdAt: now() },
    { id: createId(), patientId: patient1.id, type: 'eosinophils', value: 280, unit: 'cells/uL', dateCollected: '2024-09-15', notes: 'Mildly elevated', createdAt: now() },
    { id: createId(), patientId: patient1.id, type: 'fev1', value: 68, unit: '%', dateCollected: '2024-10-01', notes: 'Moderately reduced', createdAt: now() },
    { id: createId(), patientId: patient1.id, type: 'act', value: 11, unit: 'score', dateCollected: '2024-10-01', notes: 'Uncontrolled (<19)', createdAt: now() },
    { id: createId(), patientId: patient1.id, type: 'feno', value: 52, unit: 'ppb', dateCollected: '2024-09-20', notes: 'Elevated', createdAt: now() },
  ];
  const bio2: Biomarker[] = [
    { id: createId(), patientId: patient2.id, type: 'eosinophils', value: 520, unit: 'cells/uL', dateCollected: '2024-08-10', notes: 'Significantly elevated', createdAt: now() },
    { id: createId(), patientId: patient2.id, type: 'eosinophils', value: 480, unit: 'cells/uL', dateCollected: '2024-06-15', notes: 'Elevated (on OCS at time)', createdAt: now() },
    { id: createId(), patientId: patient2.id, type: 'eosinophils', value: 680, unit: 'cells/uL', dateCollected: '2024-03-20', notes: 'Pre-OCS baseline', createdAt: now() },
    { id: createId(), patientId: patient2.id, type: 'feno', value: 48, unit: 'ppb', dateCollected: '2024-08-10', notes: 'Elevated', createdAt: now() },
    { id: createId(), patientId: patient2.id, type: 'fev1', value: 62, unit: '%', dateCollected: '2024-08-15', notes: 'Moderately-severely reduced', createdAt: now() },
    { id: createId(), patientId: patient2.id, type: 'ige', value: 18, unit: 'IU/mL', dateCollected: '2024-08-10', notes: 'Low - rules out Xolair', createdAt: now() },
  ];
  const bio3: Biomarker[] = [
    { id: createId(), patientId: patient3.id, type: 'ige', value: 156, unit: 'IU/mL', dateCollected: '2024-07-01', notes: 'Elevated total IgE', createdAt: now() },
    { id: createId(), patientId: patient3.id, type: 'tsh', value: 2.1, unit: 'mIU/L', dateCollected: '2024-07-01', notes: 'Normal', createdAt: now() },
    { id: createId(), patientId: patient3.id, type: 'ana', value: 0, unit: 'titer', dateCollected: '2024-07-01', notes: 'Negative', createdAt: now() },
  ];
  const bio4: Biomarker[] = [
    { id: createId(), patientId: patient4.id, type: 'easi', value: 28, unit: 'score', dateCollected: '2024-10-15', notes: 'Severe (>=16 threshold)', createdAt: now() },
    { id: createId(), patientId: patient4.id, type: 'iga', value: 4, unit: 'score', dateCollected: '2024-10-15', notes: 'Severe (IGA 4)', createdAt: now() },
    { id: createId(), patientId: patient4.id, type: 'dlqi', value: 22, unit: 'score', dateCollected: '2024-10-15', notes: 'Extremely severe impact on QoL', createdAt: now() },
    { id: createId(), patientId: patient4.id, type: 'bsa', value: 45, unit: '%', dateCollected: '2024-10-15', notes: '45% body surface area affected', createdAt: now() },
    { id: createId(), patientId: patient4.id, type: 'ige', value: 2450, unit: 'IU/mL', dateCollected: '2024-09-01', notes: 'Very elevated', createdAt: now() },
    { id: createId(), patientId: patient4.id, type: 'eosinophils', value: 380, unit: 'cells/uL', dateCollected: '2024-09-01', notes: 'Elevated', createdAt: now() },
  ];
  const bio5: Biomarker[] = [
    { id: createId(), patientId: patient5.id, type: 'eosinophils', value: 120, unit: 'cells/uL', dateCollected: '2024-10-10', notes: 'Below 150 - rules out anti-IL5', createdAt: now() },
    { id: createId(), patientId: patient5.id, type: 'ige', value: 22, unit: 'IU/mL', dateCollected: '2024-10-10', notes: 'Below 30 - rules out Xolair', createdAt: now() },
    { id: createId(), patientId: patient5.id, type: 'feno', value: 18, unit: 'ppb', dateCollected: '2024-10-10', notes: 'Below 25 - rules out Dupixent', createdAt: now() },
    { id: createId(), patientId: patient5.id, type: 'fev1', value: 55, unit: '%', dateCollected: '2024-10-12', notes: 'Severely reduced', createdAt: now() },
    { id: createId(), patientId: patient5.id, type: 'act', value: 12, unit: 'score', dateCollected: '2024-10-12', notes: 'Very poorly controlled', createdAt: now() },
  ];
  [...bio1, ...bio2, ...bio3, ...bio4, ...bio5].forEach(b => biomarkers.set(b.id, b));

  // Submissions
  const submission1 = createRecord({
    patientId: patient1.id, createdById: coordinator.id,
    drugId: 'xolair', drugName: 'Xolair', indicationId: 'allergic-asthma', indication: 'Allergic Asthma',
    payerId: 'uhc', payerName: 'UnitedHealthcare (UHC)', icd10Code: 'J45.50', icd10Desc: 'Severe persistent asthma, uncomplicated',
    stage: 'draft', priority: 'normal',
    notes: 'Patient meets all criteria. IgE 342 IU/mL (within 30-1500). Positive allergen tests for dust mite, cat, cockroach. ICS+LABA for 6 months. FEV1 68%, ACT 11.',
  });
  const submission2 = createRecord({
    patientId: patient2.id, createdById: coordinator.id,
    drugId: 'nucala', drugName: 'Nucala', indicationId: 'eosinophilic-asthma', indication: 'Eosinophilic Asthma',
    payerId: 'bcbs', payerName: 'Blue Cross Blue Shield (BCBS)', icd10Code: 'J45.50', icd10Desc: 'Severe persistent asthma, uncomplicated',
    stage: 'expert_review', priority: 'normal',
    aiVerdict: 'ready', aiNotes: 'All criteria met. Eosinophils 520 (>=150), ICS+LABA for 4 months, specialist confirmed. Ready to submit.',
    gapCheckResult: JSON.stringify({ verdict: 'READY', criticalCount: 0, warningCount: 1, passCount: 5 }),
    notes: 'OCS-dependent with 3 exacerbations/year. Eosinophils consistently elevated. Pre-OCS baseline 680. Specialist (Dr. Chen) confirmed as prescriber.',
  });
  const submission3 = createRecord({
    patientId: patient5.id, createdById: coordinator.id,
    drugId: 'tezspire', drugName: 'Tezspire', indicationId: 'severe-asthma', indication: 'Severe Asthma (All Phenotypes)',
    payerId: 'co-medicaid', payerName: 'Colorado Medicaid', icd10Code: 'J45.50', icd10Desc: 'Severe persistent asthma, uncomplicated',
    stage: 'submitted', priority: 'urgent',
    aiVerdict: 'ready', aiNotes: 'Tezspire is the ONLY biologic option. All phenotype-specific biologics ruled out by biomarker profile.',
    gapCheckResult: JSON.stringify({ verdict: 'READY', criticalCount: 0, warningCount: 2, passCount: 4 }),
    submittedDate: '2024-11-01T00:00:00.000Z', externalId: 'CO-MCD-PA-2024-88291',
    notes: 'URGENT: 5 exacerbations/year, 2 hospitalizations. Tezspire is the ONLY FDA-approved biologic - all phenotype-specific options ruled out.',
  });
  submissions.set(submission1.id, submission1);
  submissions.set(submission2.id, submission2);
  submissions.set(submission3.id, submission3);

  // Timeline Events
  const timelineData: { sid: string; event: string; desc: string; meta?: string; uid?: string }[] = [
    { sid: submission1.id, event: 'created', desc: 'Submission created for Xolair to UnitedHealthcare', meta: JSON.stringify({ verdict: 'READY', criticalCount: 0 }), uid: coordinator.id },
    { sid: submission1.id, event: 'ai_analysis', desc: 'AI gap check completed - verdict: READY', meta: JSON.stringify({ verdict: 'READY', criticalCount: 0 }) },
    { sid: submission2.id, event: 'created', desc: 'Submission created for Nucala to BCBS', uid: coordinator.id },
    { sid: submission2.id, event: 'stage_changed', desc: 'Stage changed from "draft" to "patient_setup"', meta: JSON.stringify({ previousStage: 'draft', newStage: 'patient_setup' }), uid: coordinator.id },
    { sid: submission2.id, event: 'ai_analysis', desc: 'AI gap check completed - verdict: READY', meta: JSON.stringify({ verdict: 'READY', criticalCount: 0 }) },
    { sid: submission2.id, event: 'document_uploaded', desc: 'Document uploaded: CBC with Differential (09/10/2024)', meta: JSON.stringify({ type: 'lab_result', category: 'required' }), uid: coordinator.id },
    { sid: submission2.id, event: 'document_uploaded', desc: 'Document uploaded: Progress Note (10/01/2024)', meta: JSON.stringify({ type: 'progress_note', category: 'required' }), uid: coordinator.id },
    { sid: submission2.id, event: 'stage_changed', desc: 'Stage changed from "patient_setup" to "expert_review"', meta: JSON.stringify({ previousStage: 'patient_setup', newStage: 'expert_review' }), uid: coordinator.id },
    { sid: submission3.id, event: 'created', desc: 'Submission created for Tezspire to Colorado Medicaid', uid: coordinator.id },
    { sid: submission3.id, event: 'stage_changed', desc: 'Stage changed from "draft" to "patient_setup"', meta: JSON.stringify({ previousStage: 'draft', newStage: 'patient_setup' }), uid: coordinator.id },
    { sid: submission3.id, event: 'stage_changed', desc: 'Stage changed from "patient_setup" to "expert_review"', meta: JSON.stringify({ previousStage: 'patient_setup', newStage: 'expert_review' }), uid: coordinator.id },
    { sid: submission3.id, event: 'ai_analysis', desc: 'AI analysis: Tezspire is ONLY option - all other biologics ruled out', meta: JSON.stringify({ verdict: 'READY' }), uid: coordinator.id },
    { sid: submission3.id, event: 'stage_changed', desc: 'Stage changed from "expert_review" to "submitted"', meta: JSON.stringify({ previousStage: 'expert_review', newStage: 'submitted' }), uid: coordinator.id },
    { sid: submission3.id, event: 'submitted', desc: 'Submitted to CO Medicaid Atrezzo Portal. External ID: CO-MCD-PA-2024-88291', meta: JSON.stringify({ externalId: 'CO-MCD-PA-2024-88291' }), uid: coordinator.id },
  ];
  timelineData.forEach(t => {
    const ev: TimelineEvent = { id: createId(), submissionId: t.sid, event: t.event, description: t.desc, metadata: t.meta, userId: t.uid, createdAt: now() };
    timelineEvents.set(ev.id, ev);
  });

  // Documents
  const docData: { sid: string; type: string; name: string; cat: string; status: string; notes?: string }[] = [
    { sid: submission1.id, type: 'lab_result', name: 'Serum IgE Level (09/15/2024)', cat: 'required', status: 'pending', notes: 'IgE: 342 IU/mL' },
    { sid: submission1.id, type: 'lab_result', name: 'Allergen Skin Test Results', cat: 'required', status: 'pending', notes: 'Positive: dust mite, cat, cockroach' },
    { sid: submission1.id, type: 'pharmacy_record', name: 'ICS+LABA Pharmacy Fill Records', cat: 'required', status: 'pending', notes: '6 months of fluticasone/salmeterol 500/50' },
    { sid: submission2.id, type: 'lab_result', name: 'CBC with Differential (08/10/2024)', cat: 'required', status: 'reviewed', notes: 'Eosinophils: 520 cells/uL' },
    { sid: submission2.id, type: 'lab_result', name: 'FeNO Level (08/10/2024)', cat: 'optional', status: 'reviewed', notes: 'FeNO: 48 ppb' },
    { sid: submission2.id, type: 'progress_note', name: 'Allergy Clinic Progress Note (10/01/2024)', cat: 'required', status: 'reviewed', notes: 'Dr. Chen' },
    { sid: submission2.id, type: 'progress_note', name: 'Allergy Clinic Progress Note (08/15/2024)', cat: 'required', status: 'reviewed', notes: 'Dr. Chen' },
    { sid: submission2.id, type: 'progress_note', name: 'Allergy Clinic Progress Note (06/01/2024)', cat: 'required', status: 'pending', notes: 'Dr. Chen' },
    { sid: submission2.id, type: 'pharmacy_record', name: 'ICS+LABA+LAMA Pharmacy Records', cat: 'required', status: 'pending', notes: '4 months documented' },
    { sid: submission2.id, type: 'pft', name: 'PFT/Spirometry (08/15/2024)', cat: 'required', status: 'pending', notes: 'FEV1 62% predicted' },
    { sid: submission2.id, type: 'specialist_letter', name: 'Specialist Prescriber Letter', cat: 'optional', status: 'pending', notes: 'Dr. Chen, Board Certified A&I' },
    { sid: submission3.id, type: 'lab_result', name: 'Comprehensive Biomarker Panel (10/10/2024)', cat: 'required', status: 'reviewed', notes: 'eos 120, IgE 22, FeNO 18 - all below thresholds' },
    { sid: submission3.id, type: 'progress_note', name: 'Pulmonology Progress Note (10/12/2024)', cat: 'required', status: 'reviewed', notes: 'Dr. Chen - ACT 12, FEV1 55%' },
    { sid: submission3.id, type: 'pharmacy_record', name: 'ICS+LABA+LAMA Pharmacy Records (12 months)', cat: 'required', status: 'reviewed', notes: 'Documented high-dose triple therapy' },
    { sid: submission3.id, type: 'er_record', name: 'ER Visit Records (2 visits in 2024)', cat: 'optional', status: 'reviewed', notes: '2 ER visits for asthma exacerbation' },
    { sid: submission3.id, type: 'hospitalization_record', name: 'Hospitalization Record (March 2024)', cat: 'optional', status: 'pending', notes: 'Admitted for severe asthma exacerbation' },
    { sid: submission3.id, type: 'prior_auth_form', name: 'CO Medicaid PA Form (completed)', cat: 'required', status: 'approved', notes: 'Submitted via Atrezzo portal' },
  ];
  docData.forEach(d => {
    const doc: Document = { id: createId(), submissionId: d.sid, type: d.type, name: d.name, category: d.cat, status: d.status, notes: d.notes, uploadedAt: now() };
    documents.set(doc.id, doc);
  });

  // Audit Logs
  const auditData: { uid?: string; sid?: string; action: string; entity: string; eid?: string; details?: string }[] = [
    { uid: admin.id, action: 'created', entity: 'user', eid: coordinator.id, details: JSON.stringify({ email: 'coordinator@maya.com' }) },
    { uid: admin.id, action: 'created', entity: 'user', eid: provider.id, details: JSON.stringify({ email: 'dr.chen@maya.com' }) },
    { uid: coordinator.id, sid: submission1.id, action: 'created', entity: 'submission', eid: submission1.id },
    { uid: coordinator.id, sid: submission2.id, action: 'created', entity: 'submission', eid: submission2.id },
    { uid: coordinator.id, sid: submission2.id, action: 'stage_changed', entity: 'submission', eid: submission2.id, details: JSON.stringify({ to: 'expert_review' }) },
    { uid: coordinator.id, sid: submission3.id, action: 'created', entity: 'submission', eid: submission3.id },
    { uid: coordinator.id, sid: submission3.id, action: 'stage_changed', entity: 'submission', eid: submission3.id, details: JSON.stringify({ to: 'submitted' }) },
    { uid: coordinator.id, sid: submission3.id, action: 'submitted', entity: 'submission', eid: submission3.id, details: JSON.stringify({ externalId: 'CO-MCD-PA-2024-88291' }) },
  ];
  auditData.forEach(a => {
    const log: AuditLog = { id: createId(), userId: a.uid, submissionId: a.sid, action: a.action, entity: a.entity, entityId: a.eid, details: a.details, createdAt: now() };
    auditLogs.set(log.id, log);
  });
}

// Initialize seed data on first import
seedData();

// ── Database Access Object ──

export const db = {
  // ── Users ──
  user: {
    findUnique: async (opts: { where: { id?: string; email?: string } }) => {
      for (const u of users.values()) {
        if (opts.where.id && u.id === opts.where.id) return u;
        if (opts.where.email && u.email === opts.where.email) return u;
      }
      return null;
    },
    findMany: async (opts?: { where?: { isActive?: boolean } }) => {
      return Array.from(users.values()).filter(u =>
        !opts?.where?.isActive || u.isActive === opts.where.isActive
      );
    },
    count: async (opts?: { where?: { isActive?: boolean } }) => {
      return Array.from(users.values()).filter(u =>
        !opts?.where?.isActive || u.isActive === opts.where.isActive
      ).length;
    },
    create: async (opts: { data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const id = createId();
      const user: User = { ...opts.data, id, createdAt: now(), updatedAt: now() };
      users.set(id, user);
      return user;
    },
    update: async (opts: { where: { id: string }; data: Partial<User> }) => {
      const user = users.get(opts.where.id);
      if (!user) throw new Error('User not found');
      const updated = { ...user, ...opts.data, updatedAt: now() };
      users.set(opts.where.id, updated);
      return updated;
    },
  },

  // ── Patients ──
  patient: {
    findUnique: async (opts: { where: { id: string; isActive?: boolean } }) => {
      const p = patients.get(opts.where.id);
      if (!p) return null;
      if (opts.where.isActive !== undefined && p.isActive !== opts.where.isActive) return null;
      return p;
    },
    findMany: async (opts?: {
      where?: {
        isActive?: boolean;
        OR?: Array<Record<string, { contains: string }>>;
      };
      orderBy?: Record<string, 'asc' | 'desc'>;
      skip?: number;
      take?: number;
      include?: Record<string, unknown>;
    }) => {
      let result = Array.from(patients.values());

      // Filter
      if (opts?.where) {
        if (opts.where.isActive !== undefined) {
          result = result.filter(p => p.isActive === opts.where!.isActive);
        }
        if (opts.where.OR) {
          result = result.filter(p =>
            opts.where!.OR!.some(condition => {
              const [field, op] = Object.entries(condition)[0];
              const val = (op as { contains: string }).contains;
              return String((p as unknown as Record<string, unknown>)[field] || '').toLowerCase().includes(val.toLowerCase());
            })
          );
        }
      }

      // Sort
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = String((a as unknown as Record<string, unknown>)[field] || '');
          const bVal = String((b as unknown as Record<string, unknown>)[field] || '');
          return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }

      // Paginate
      const skip = opts?.skip || 0;
      const take = opts?.take || result.length;
      result = result.slice(skip, skip + take);

      // Include _count
      if (opts?.include?._count) {
        return result.map(p => ({
          ...p,
          _count: {
            submissions: Array.from(submissions.values()).filter(s => s.patientId === p.id).length,
            biomarkers: Array.from(biomarkers.values()).filter(b => b.patientId === p.id).length,
          },
        }));
      }

      return result;
    },
    count: async (opts?: {
      where?: {
        isActive?: boolean;
        OR?: Array<Record<string, { contains: string }>>;
      };
    }) => {
      let result = Array.from(patients.values());
      if (opts?.where) {
        if (opts.where.isActive !== undefined) {
          result = result.filter(p => p.isActive === opts.where!.isActive);
        }
        if (opts.where.OR) {
          result = result.filter(p =>
            opts.where!.OR!.some(condition => {
              const [field, op] = Object.entries(condition)[0];
              const val = (op as { contains: string }).contains;
              return String((p as unknown as Record<string, unknown>)[field] || '').toLowerCase().includes(val.toLowerCase());
            })
          );
        }
      }
      return result.length;
    },
    create: async (opts: { data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const id = createId();
      const patient: Patient = {
        ...opts.data,
        id,
        dateOfBirth: typeof opts.data.dateOfBirth === 'string' ? opts.data.dateOfBirth : new Date(opts.data.dateOfBirth as unknown as Date).toISOString(),
        allergies: typeof opts.data.allergies === 'object' ? JSON.stringify(opts.data.allergies) : opts.data.allergies,
        createdAt: now(),
        updatedAt: now(),
      } as Patient;
      patients.set(id, patient);
      return patient;
    },
    update: async (opts: { where: { id: string }; data: Partial<Patient> }) => {
      const patient = patients.get(opts.where.id);
      if (!patient) throw new Error('Patient not found');
      const updateData = { ...opts.data };
      if (updateData.allergies && typeof updateData.allergies === 'object') {
        updateData.allergies = JSON.stringify(updateData.allergies);
      }
      const updated = { ...patient, ...updateData, updatedAt: now() };
      patients.set(opts.where.id, updated);
      return updated;
    },
  },

  // ── Biomarkers ──
  biomarker: {
    findMany: async (opts?: {
      where?: { patientId?: string; type?: string };
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      let result = Array.from(biomarkers.values());
      if (opts?.where?.patientId) result = result.filter(b => b.patientId === opts.where!.patientId);
      if (opts?.where?.type) result = result.filter(b => b.type === opts.where!.type);
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = String((a as unknown as Record<string, unknown>)[field] || '');
          const bVal = String((b as unknown as Record<string, unknown>)[field] || '');
          return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
      return result;
    },
    create: async (opts: { data: Omit<Biomarker, 'id' | 'createdAt'> }) => {
      const id = createId();
      const biomarker: Biomarker = {
        ...opts.data,
        id,
        dateCollected: typeof opts.data.dateCollected === 'string' ? opts.data.dateCollected : new Date(opts.data.dateCollected as unknown as Date).toISOString(),
        createdAt: now(),
      };
      biomarkers.set(id, biomarker);
      return biomarker;
    },
    createMany: async (data: Omit<Biomarker, 'id' | 'createdAt'>[]) => {
      const results: Biomarker[] = [];
      for (const d of data) {
        const bio = await db.biomarker.create({ data: d });
        results.push(bio);
      }
      return { count: results.length };
    },
    deleteMany: async (opts?: { where?: { patientId?: string } }) => {
      let count = 0;
      if (opts?.where?.patientId) {
        for (const [id, b] of biomarkers.entries()) {
          if (b.patientId === opts.where.patientId) {
            biomarkers.delete(id);
            count++;
          }
        }
      }
      return { count };
    },
  },

  // ── Submissions ──
  submission: {
    findUnique: async (opts: { where: { id: string }; include?: Record<string, unknown> }) => {
      const sub = submissions.get(opts.where.id);
      if (!sub) return null;
      return enrichSubmission(sub, opts.include);
    },
    findMany: async (opts?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      skip?: number;
      take?: number;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) => {
      let result = Array.from(submissions.values());

      // Filter
      if (opts?.where) {
        result = result.filter(s => {
          for (const [key, val] of Object.entries(opts.where!)) {
            if (key === 'OR') continue;
            if (key === 'AND') continue;
            if (key === 'createdAt' && typeof val === 'object' && val !== null && 'gte' in val) {
              if (new Date(s.createdAt) < new Date((val as { gte: string }).gte)) return false;
              continue;
            }
            if (key === 'stage' && typeof val === 'object' && val !== null) {
              if ('in' in val) {
                if (!(val as { in: string[] }).in.includes(s.stage)) return false;
                continue;
              }
              if ('notIn' in val) {
                if ((val as { notIn: string[] }).notIn.includes(s.stage)) return false;
                continue;
              }
            }
            if (key === 'priority' && typeof val === 'object' && val !== null) {
              if ('notIn' in val) {
                if ((val as { notIn: string[] }).notIn.includes(s.priority)) return false;
                continue;
              }
            }
            if (key === 'daysToDecision' && typeof val === 'object' && val !== null) {
              if ('not' in val) {
                const notVal = (val as { not: Record<string, unknown> }).not;
                if (notVal && typeof notVal === 'object' && 'null' in notVal) {
                  if (s.daysToDecision === null || s.daysToDecision === undefined) return false;
                  continue;
                }
              }
              continue;
            }
            if ((s as unknown as Record<string, unknown>)[key] !== val) return false;
          }
          return true;
        });
      }

      // Sort
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[field];
          const bVal = (b as unknown as Record<string, unknown>)[field];
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          const aStr = String(aVal);
          const bStr = String(bVal);
          return dir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
      }

      // Paginate
      const skip = opts?.skip || 0;
      const take = opts?.take || result.length;
      result = result.slice(skip, skip + take);

      // Include/Select
      if (opts?.include) {
        return result.map(s => enrichSubmission(s, opts.include));
      }

      return result;
    },
    count: async (opts?: { where?: Record<string, unknown> }) => {
      let result = Array.from(submissions.values());
      if (opts?.where) {
        result = result.filter(s => {
          for (const [key, val] of Object.entries(opts.where!)) {
            if (key === 'OR') continue;
            if (key === 'AND') continue;
            if (key === 'createdAt' && typeof val === 'object' && val !== null && 'gte' in val) {
              if (new Date(s.createdAt) < new Date((val as { gte: string }).gte)) return false;
              continue;
            }
            if (key === 'stage' && typeof val === 'object' && val !== null) {
              if ('in' in val) {
                if (!(val as { in: string[] }).in.includes(s.stage)) return false;
                continue;
              }
              if ('notIn' in val) {
                if ((val as { notIn: string[] }).notIn.includes(s.stage)) return false;
                continue;
              }
            }
            if (key === 'priority' && typeof val === 'object' && val !== null) {
              if ('notIn' in val) {
                if ((val as { notIn: string[] }).notIn.includes(s.priority)) return false;
                continue;
              }
            }
            if ((s as unknown as Record<string, unknown>)[key] !== val) return false;
          }
          return true;
        });
      }
      return result.length;
    },
    groupBy: async (opts: { by: string[]; _count?: Record<string, boolean>; where?: Record<string, unknown> }) => {
      const field = opts.by[0];
      const groups: Record<string, number> = {};

      let result = Array.from(submissions.values());
      if (opts.where) {
        result = result.filter(s => {
          for (const [key, val] of Object.entries(opts.where!)) {
            if (key === 'OR') continue;
            if (key === 'AND') continue;
            if (key === 'stage' && typeof val === 'object' && val !== null) {
              if ('in' in val) {
                if (!(val as { in: string[] }).in.includes(s.stage)) return false;
                continue;
              }
              if ('notIn' in val) {
                if ((val as { notIn: string[] }).notIn.includes(s.stage)) return false;
                continue;
              }
            }
            if ((s as unknown as Record<string, unknown>)[key] !== val) return false;
          }
          return true;
        });
      }

      for (const s of result) {
        const key = (s as unknown as Record<string, unknown>)[field] as string;
        groups[key] = (groups[key] || 0) + 1;
      }

      return Object.entries(groups).map(([key, count]) => ({
        [field]: key,
        _count: { [field]: count },
      }));
    },
    create: async (opts: { data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const id = createId();
      const submission: Submission = {
        ...opts.data,
        id,
        gapCheckResult: typeof opts.data.gapCheckResult === 'object' ? JSON.stringify(opts.data.gapCheckResult) : opts.data.gapCheckResult,
        docCheckResult: typeof opts.data.docCheckResult === 'object' ? JSON.stringify(opts.data.docCheckResult) : opts.data.docCheckResult,
        icd10Validation: typeof opts.data.icd10Validation === 'object' ? JSON.stringify(opts.data.icd10Validation) : opts.data.icd10Validation,
        appealResult: typeof opts.data.appealResult === 'object' ? JSON.stringify(opts.data.appealResult) : opts.data.appealResult,
        createdAt: now(),
        updatedAt: now(),
      } as Submission;
      submissions.set(id, submission);
      return submission;
    },
    update: async (opts: { where: { id: string }; data: Partial<Submission> }) => {
      const sub = submissions.get(opts.where.id);
      if (!sub) throw new Error('Submission not found');
      const updated = { ...sub, ...opts.data, updatedAt: now() };
      submissions.set(opts.where.id, updated);
      return updated;
    },
    delete: async (opts: { where: { id: string } }) => {
      const sub = submissions.get(opts.where.id);
      if (!sub) throw new Error('Submission not found');
      submissions.delete(opts.where.id);
      return sub;
    },
  },

  // ── Documents ──
  document: {
    findUnique: async (opts: { where: { id: string } }) => {
      return documents.get(opts.where.id) || null;
    },
    findMany: async (opts?: {
      where?: { submissionId?: string };
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      let result = Array.from(documents.values());
      if (opts?.where?.submissionId) result = result.filter(d => d.submissionId === opts.where!.submissionId);
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = String((a as unknown as Record<string, unknown>)[field] || '');
          const bVal = String((b as unknown as Record<string, unknown>)[field] || '');
          return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
      return result;
    },
    count: async () => documents.size,
    groupBy: async (opts: { by: string[]; _count?: Record<string, boolean> }) => {
      const field = opts.by[0];
      const groups: Record<string, number> = {};
      for (const d of documents.values()) {
        const key = (d as unknown as Record<string, unknown>)[field] as string;
        groups[key] = (groups[key] || 0) + 1;
      }
      return Object.entries(groups).map(([key, count]) => ({
        [field]: key,
        _count: { [field]: count },
      }));
    },
    create: async (opts: { data: Omit<Document, 'id' | 'uploadedAt'> }) => {
      const id = createId();
      const doc: Document = { ...opts.data, id, uploadedAt: now() };
      documents.set(id, doc);
      return doc;
    },
    delete: async (opts: { where: { id: string } }) => {
      const doc = documents.get(opts.where.id);
      if (!doc) throw new Error('Document not found');
      documents.delete(opts.where.id);
      return doc;
    },
    deleteMany: async (opts: { where: { submissionId: string } }) => {
      let count = 0;
      for (const [id, d] of documents.entries()) {
        if (d.submissionId === opts.where.submissionId) {
          documents.delete(id);
          count++;
        }
      }
      return { count };
    },
  },

  // ── Audit Logs ──
  auditLog: {
    findMany: async (opts?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      skip?: number;
      take?: number;
      include?: Record<string, unknown>;
    }) => {
      let result = Array.from(auditLogs.values());

      if (opts?.where) {
        result = result.filter(log => {
          for (const [key, val] of Object.entries(opts.where!)) {
            if (val !== undefined && (log as unknown as Record<string, unknown>)[key] !== val) return false;
          }
          return true;
        });
      }

      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = String((a as unknown as Record<string, unknown>)[field] || '');
          const bVal = String((b as unknown as Record<string, unknown>)[field] || '');
          return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }

      const skip = opts?.skip || 0;
      const take = opts?.take || result.length;
      result = result.slice(skip, skip + take);

      // Include user and submission relations
      if (opts?.include) {
        return result.map(log => {
          const enriched = { ...log };
          if (opts.include?.user) {
            const user = log.userId ? users.get(log.userId) : undefined;
            (enriched as unknown as Record<string, unknown>).user = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : undefined;
          }
          if (opts.include?.submission) {
            const sub = log.submissionId ? submissions.get(log.submissionId) : undefined;
            (enriched as unknown as Record<string, unknown>).submission = sub ? { id: sub.id, drugName: sub.drugName, stage: sub.stage } : undefined;
          }
          return enriched;
        });
      }

      return result;
    },
    count: async (opts?: { where?: Record<string, unknown> }) => {
      let result = Array.from(auditLogs.values());
      if (opts?.where) {
        result = result.filter(log => {
          for (const [key, val] of Object.entries(opts.where!)) {
            if (val !== undefined && (log as unknown as Record<string, unknown>)[key] !== val) return false;
          }
          return true;
        });
      }
      return result.length;
    },
    create: async (opts: { data: Omit<AuditLog, 'id' | 'createdAt'> }) => {
      const id = createId();
      const log: AuditLog = { ...opts.data, id, createdAt: now() };
      auditLogs.set(id, log);
      return log;
    },
    deleteMany: async (opts: { where: { submissionId: string } }) => {
      let count = 0;
      for (const [id, log] of auditLogs.entries()) {
        if (log.submissionId === opts.where.submissionId) {
          auditLogs.delete(id);
          count++;
        }
      }
      return { count };
    },
  },

  // ── Timeline Events ──
  timelineEvent: {
    findMany: async (opts?: {
      where?: { submissionId?: string };
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => {
      let result = Array.from(timelineEvents.values());
      if (opts?.where?.submissionId) result = result.filter(e => e.submissionId === opts.where!.submissionId);
      if (opts?.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        result.sort((a, b) => {
          const aVal = String((a as unknown as Record<string, unknown>)[field] || '');
          const bVal = String((b as unknown as Record<string, unknown>)[field] || '');
          return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
      return result;
    },
    create: async (opts: { data: Omit<TimelineEvent, 'id' | 'createdAt'> }) => {
      const id = createId();
      const event: TimelineEvent = { ...opts.data, id, createdAt: now() };
      timelineEvents.set(id, event);
      return event;
    },
    deleteMany: async (opts: { where: { submissionId: string } }) => {
      let count = 0;
      for (const [id, ev] of timelineEvents.entries()) {
        if (ev.submissionId === opts.where.submissionId) {
          timelineEvents.delete(id);
          count++;
        }
      }
      return { count };
    },
  },

  // ── Transaction Support (simplified — runs sequentially) ──
  $transaction: async (ops: Promise<unknown>[]) => {
    const results: unknown[] = [];
    for (const op of ops) {
      results.push(await op);
    }
    return results;
  },
};

// ── Helper: Enrich a submission with relations ──

function enrichSubmission(sub: Submission, include?: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...sub };

  if (include?.patient) {
    const patient = patients.get(sub.patientId);
    if (patient) {
      if (include.patient === true) {
        result.patient = patient;
      } else if (typeof include.patient === 'object') {
        const enrichedPatient: Record<string, unknown> = {
          id: patient.id, firstName: patient.firstName, lastName: patient.lastName, mrn: patient.mrn,
          dateOfBirth: patient.dateOfBirth,
        };
        if ((include.patient as Record<string, unknown>)?.biomarkers) {
          enrichedPatient.biomarkers = Array.from(biomarkers.values())
            .filter(b => b.patientId === sub.patientId)
            .sort((a, b) => b.dateCollected.localeCompare(a.dateCollected));
        }
        result.patient = enrichedPatient;
      }
    }
  }

  if (include?.createdBy) {
    if (sub.createdById) {
      const user = users.get(sub.createdById);
      if (user) {
        result.createdBy = { id: user.id, name: user.name, role: user.role };
      }
    }
  }

  if (include?.documents) {
    result.documents = Array.from(documents.values())
      .filter(d => d.submissionId === sub.id)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  if (include?.timeline) {
    result.timeline = Array.from(timelineEvents.values())
      .filter(e => e.submissionId === sub.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (include?.auditLogs) {
    result.auditLogs = Array.from(auditLogs.values())
      .filter(l => l.submissionId === sub.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, (include.auditLogs as { take?: number })?.take || 50);
  }

  if (include?._count) {
    result._count = {
      documents: Array.from(documents.values()).filter(d => d.submissionId === sub.id).length,
      timeline: Array.from(timelineEvents.values()).filter(e => e.submissionId === sub.id).length,
    };
  }

  return result;
}

// Re-export types
export type { Patient as PatientType, Submission as SubmissionType, Biomarker as BiomarkerType, Document as DocumentType, AuditLog as AuditLogType, TimelineEvent as TimelineEventType };
