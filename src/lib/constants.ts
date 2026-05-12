// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — Data Constants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DRUGS = [
  { id: 'xolair', name: 'Xolair', generic: 'omalizumab', jcode: 'J0590' },
  { id: 'dupixent', name: 'Dupixent', generic: 'dupilumab', jcode: 'J1745' },
  { id: 'nucala', name: 'Nucala', generic: 'mepolizumab', jcode: 'J2184' },
  { id: 'fasenra', name: 'Fasenra', generic: 'benralizumab', jcode: 'J0690' },
  { id: 'tezspire', name: 'Tezspire', generic: 'tezepelumab', jcode: 'J2795' },
  { id: 'cinqair', name: 'Cinqair', generic: 'reslizumab', jcode: 'J2770' },
  { id: 'exdensur', name: 'Exdensur', generic: 'depemokimab', jcode: 'NEW' },
];

export const PAYERS = [
  { id: 'uhc', name: 'UnitedHealthcare' },
  { id: 'bcbs', name: 'Blue Cross Blue Shield' },
  { id: 'cigna', name: 'Cigna' },
  { id: 'aetna', name: 'Aetna' },
  { id: 'medicare', name: 'Medicare' },
  { id: 'co-medicaid', name: 'Colorado Medicaid' },
];

export const DRUG_INDICATIONS: Record<string, { id: string; name: string }[]> = {
  xolair: [
    { id: 'allergic-asthma', name: 'Allergic Asthma' },
    { id: 'csu', name: 'Chronic Spontaneous Urticaria' },
    { id: 'crswnp', name: 'CRSwNP (Nasal Polyps)' },
    { id: 'food-allergy', name: 'IgE-Mediated Food Allergy' },
  ],
  dupixent: [
    { id: 'eosinophilic-asthma', name: 'Eosinophilic Asthma' },
    { id: 'atopic-dermatitis', name: 'Atopic Dermatitis' },
    { id: 'crswnp', name: 'CRSwNP (Nasal Polyps)' },
  ],
  nucala: [{ id: 'eosinophilic-asthma', name: 'Eosinophilic Asthma' }],
  fasenra: [{ id: 'eosinophilic-asthma', name: 'Eosinophilic Asthma' }],
  tezspire: [
    { id: 'severe-asthma', name: 'Severe Asthma (All Phenotypes)' },
    { id: 'crswnp-tezspire', name: 'CRSwNP (Tezspire)' },
  ],
  cinqair: [{ id: 'eosinophilic-asthma-cinqair', name: 'Eosinophilic Asthma' }],
  exdensur: [{ id: 'eosinophilic-asthma-exdensur', name: 'Eosinophilic Asthma' }],
};

export const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  patient_setup: 'Patient Setup',
  expert_review: 'Expert Review',
  submitted: 'Submitted',
  approved: 'Approved',
  denied: 'Denied',
  closed: 'Closed',
};

export const STAGE_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  patient_setup: 'bg-blue-100 text-blue-700',
  expert_review: 'bg-amber-100 text-amber-700',
  submitted: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  denied: 'bg-red-100 text-red-700',
  closed: 'bg-slate-100 text-slate-500',
};

export const STAGE_DOT_COLORS: Record<string, string> = {
  draft: 'bg-slate-400',
  patient_setup: 'bg-blue-500',
  expert_review: 'bg-amber-500',
  submitted: 'bg-purple-500',
  approved: 'bg-emerald-500',
  denied: 'bg-red-500',
  closed: 'bg-slate-400',
};

export const STAGE_ORDER = ['draft', 'patient_setup', 'expert_review', 'submitted', 'approved', 'denied', 'closed'];

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-slate-100 text-slate-600',
  low: 'bg-slate-50 text-slate-400',
};

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'patients', label: 'Patients', icon: 'Users' },
  { id: 'submissions', label: 'Auth & Assist', icon: 'FileCheck' },
  { id: 'ai-tools', label: 'AI Intelligence', icon: 'Brain' },
  { id: 'audit', label: 'Audit Trail', icon: 'ScrollText' },
] as const;

export type NavItemId = typeof NAV_ITEMS[number]['id'];

export const BIOMARKER_TYPES = [
  { id: 'ige', label: 'IgE', unit: 'IU/mL', normalRange: '30–1500' },
  { id: 'eosinophils', label: 'Eosinophils', unit: 'cells/uL', normalRange: '0–500' },
  { id: 'feno', label: 'FeNO', unit: 'ppb', normalRange: '<25' },
  { id: 'fev1', label: 'FEV1', unit: '%', normalRange: '>80' },
  { id: 'act', label: 'ACT Score', unit: '', normalRange: '20–25' },
  { id: 'easi', label: 'EASI Score', unit: '', normalRange: '0–72' },
] as const;
