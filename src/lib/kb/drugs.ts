import { Drug } from './types';

export const drugs: Drug[] = [
  { id: 'xolair', name: 'Xolair', generic: 'omalizumab', mechanism: 'Anti-IgE monoclonal antibody', jcode: 'J2357', costRange: '$15K-$40K', route: 'Subcutaneous', indications: ['allergic-asthma', 'csu', 'crswnp', 'food-allergy'] },
  { id: 'dupixent', name: 'Dupixent', generic: 'dupilumab', mechanism: 'Anti-IL-4/IL-13 receptor antibody', jcode: 'J3490/NDC', costRange: '$36K-$48K', route: 'Subcutaneous', indications: ['eosinophilic-asthma', 'atopic-dermatitis', 'crswnp'] },
  { id: 'nucala', name: 'Nucala', generic: 'mepolizumab', mechanism: 'Anti-IL-5 monoclonal antibody', jcode: 'J2182', costRange: '$32K-$42K', route: 'Subcutaneous', indications: ['eosinophilic-asthma'] },
  { id: 'fasenra', name: 'Fasenra', generic: 'benralizumab', mechanism: 'Anti-IL-5R (ADCC eosinophil depletion)', jcode: 'J0517', costRange: '$28K-$37K', route: 'Subcutaneous', indications: ['eosinophilic-asthma'] },
  { id: 'tezspire', name: 'Tezspire', generic: 'tezepelumab', mechanism: 'Anti-TSLP', jcode: 'J3490/Q5130', costRange: '$34K-$40K', route: 'Subcutaneous', indications: ['severe-asthma', 'crswnp-tezspire'] },
  { id: 'cinqair', name: 'Cinqair', generic: 'reslizumab', mechanism: 'Anti-IL-5 (IV)', jcode: 'J2786', costRange: '$28K-$35K', route: 'IV infusion', indications: ['eosinophilic-asthma-cinqair'] },
  { id: 'exdensur', name: 'Exdensur', generic: 'depemokimab', mechanism: 'Long-acting Anti-IL-5 (Q6M)', jcode: 'J3490 (pending)', costRange: '$15K-$20K', route: 'Subcutaneous Q6M', indications: ['eosinophilic-asthma-exdensur'] },
];

export const indications = [
  { id: 'allergic-asthma', name: 'Allergic Asthma', drugIds: ['xolair'] },
  { id: 'csu', name: 'Chronic Spontaneous Urticaria (CSU)', drugIds: ['xolair'] },
  { id: 'crswnp', name: 'CRSwNP (Nasal Polyps)', drugIds: ['xolair', 'dupixent'] },
  { id: 'food-allergy', name: 'IgE-Mediated Food Allergy', drugIds: ['xolair'] },
  { id: 'eosinophilic-asthma', name: 'Eosinophilic Asthma', drugIds: ['dupixent', 'nucala', 'fasenra'] },
  { id: 'atopic-dermatitis', name: 'Atopic Dermatitis', drugIds: ['dupixent'] },
  { id: 'severe-asthma', name: 'Severe Asthma (All Phenotypes)', drugIds: ['tezspire'] },
  { id: 'crswnp-tezspire', name: 'CRSwNP (Tezspire)', drugIds: ['tezspire'] },
  { id: 'eosinophilic-asthma-cinqair', name: 'Eosinophilic Asthma (Cinqair)', drugIds: ['cinqair'] },
  { id: 'eosinophilic-asthma-exdensur', name: 'Eosinophilic Asthma (Exdensur)', drugIds: ['exdensur'] },
];

export function getIndicationsForDrug(drugId: string) {
  return indications.filter(ind => ind.drugIds.includes(drugId));
}
