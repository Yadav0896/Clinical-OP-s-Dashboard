import { Indication, IndicationId } from './types';

export const indications: Indication[] = [
  { id: 'allergic-asthma', name: 'Allergic Asthma', description: 'Moderate to severe persistent allergic asthma with IgE-mediated response' },
  { id: 'csu', name: 'Chronic Spontaneous Urticaria (CSU)', description: 'Chronic spontaneous urticaria refractory to H1-antihistamines' },
  { id: 'crswnp', name: 'CRSwNP', description: 'Chronic rhinosinusitis with nasal polyps' },
  { id: 'food-allergy', name: 'Food Allergy (IgE-mediated)', description: 'IgE-mediated food allergy' },
  { id: 'eosinophilic-asthma', name: 'Eosinophilic Asthma', description: 'Severe eosinophilic asthma with elevated eosinophil count' },
  { id: 'atopic-dermatitis', name: 'Atopic Dermatitis', description: 'Moderate to severe atopic dermatitis' },
  { id: 'severe-asthma', name: 'Severe Asthma', description: 'Severe asthma without specific phenotype requirement' },
  { id: 'crswnp-tezspire', name: 'CRSwNP (Tezspire)', description: 'CRSwNP indication specific to Tezspire' },
  { id: 'eosinophilic-asthma-cinqair', name: 'Eosinophilic Asthma (Cinqair)', description: 'Eosinophilic asthma indication for Cinqair IV' },
  { id: 'eosinophilic-asthma-exdensur', name: 'Eosinophilic Asthma (Exdensur)', description: 'Eosinophilic asthma indication for Exdensur' },
];

export function getIndicationById(id: string): Indication | undefined {
  return indications.find((i) => i.id === id);
}

export function getIndicationLabel(id: string): string {
  return indications.find((i) => i.id === id)?.name ?? id;
}

export function getIndicationsForDrug(drugId: string): Indication[] {
  const drugIndications: Record<string, IndicationId[]> = {
    xolair: ['allergic-asthma', 'csu', 'crswnp', 'food-allergy'],
    dupixent: ['eosinophilic-asthma', 'atopic-dermatitis', 'crswnp'],
    nucala: ['eosinophilic-asthma'],
    fasenra: ['eosinophilic-asthma'],
    tezspire: ['severe-asthma', 'crswnp-tezspire'],
    cinqair: ['eosinophilic-asthma-cinqair'],
    exdensur: ['eosinophilic-asthma-exdensur'],
  };
  const ids = drugIndications[drugId] ?? [];
  return ids.map((id) => indications.find((i) => i.id === id)!).filter(Boolean);
}
