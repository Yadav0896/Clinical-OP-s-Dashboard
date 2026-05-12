import { ICD10Rule } from './types';

export const icd10Rules: ICD10Rule[] = [
  // Xolair - Allergic Asthma
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'uhc', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent asthma' }, { code: 'J45.50', desc: 'Severe persistent asthma' }], rejectedCodes: [{ code: 'J45.20', desc: 'Mild intermittent', reason: 'Mild asthma does not meet biologic criteria' }, { code: 'J45.30', desc: 'Mild persistent', reason: 'Mild asthma does not meet biologic criteria' }, { code: 'J45.901', desc: 'Unspecified asthma', reason: 'Too vague - specificity required' }] },
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'bcbs', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent asthma' }, { code: 'J45.50', desc: 'Severe persistent asthma' }], rejectedCodes: [{ code: 'J45.20', desc: 'Mild intermittent', reason: 'Mild asthma does not meet biologic criteria' }, { code: 'J45.30', desc: 'Mild persistent', reason: 'Mild asthma does not meet biologic criteria' }, { code: 'J45.901', desc: 'Unspecified asthma', reason: 'Too vague' }] },
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'cigna', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'aetna', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'co-medicaid', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent asthma' }, { code: 'J45.50', desc: 'Severe persistent asthma' }], rejectedCodes: [{ code: 'J45.20', desc: 'Mild intermittent', reason: 'CO Medicaid: must be J45.40 or J45.50 per Appendix Y' }, { code: 'J45.30', desc: 'Mild persistent', reason: 'CO Medicaid: must be J45.40 or J45.50 per Appendix Y' }, { code: 'J45.901', desc: 'Unspecified', reason: 'CO Medicaid: must be J45.40 or J45.50 per Appendix Y' }] },

  // Xolair - CSU
  { drugId: 'xolair', indicationId: 'csu', payerId: 'uhc', validCodes: [{ code: 'L50.1', desc: 'Idiopathic urticaria (CSU)' }, { code: 'L50.8', desc: 'Other urticaria' }], rejectedCodes: [{ code: 'L50.0', desc: 'Allergic urticaria', reason: 'L50.0 is a different condition than chronic spontaneous urticaria' }] },
  { drugId: 'xolair', indicationId: 'csu', payerId: 'bcbs', validCodes: [{ code: 'L50.1', desc: 'Idiopathic urticaria' }, { code: 'L50.8', desc: 'Other urticaria' }], rejectedCodes: [{ code: 'L50.0', desc: 'Allergic urticaria', reason: 'Different condition than CSU' }] },
  { drugId: 'xolair', indicationId: 'csu', payerId: 'cigna', validCodes: [{ code: 'L50.1', desc: 'Idiopathic urticaria' }, { code: 'L50.8', desc: 'Other urticaria' }], rejectedCodes: [{ code: 'L50.0', desc: 'Allergic urticaria', reason: 'Different condition' }] },
  { drugId: 'xolair', indicationId: 'csu', payerId: 'co-medicaid', validCodes: [{ code: 'L50.1', desc: 'Idiopathic urticaria' }, { code: 'L50.8', desc: 'Other urticaria' }], rejectedCodes: [{ code: 'L50.0', desc: 'Allergic urticaria', reason: 'L50.0 is not CSU - use L50.1' }] },

  // Xolair - CRSwNP
  { drugId: 'xolair', indicationId: 'crswnp', payerId: 'uhc', validCodes: [{ code: 'J33.9', desc: 'Nasal polyp' }, { code: 'J32.9', desc: 'Chronic sinusitis' }], rejectedCodes: [{ code: 'J31.0', desc: 'Rhinitis', reason: 'Not polyp-related' }, { code: 'J34.89', desc: 'Other nasal disorder', reason: 'Not specific to polyps' }] },
  { drugId: 'xolair', indicationId: 'crswnp', payerId: 'bcbs', validCodes: [{ code: 'J33.9', desc: 'Nasal polyp' }, { code: 'J32.9', desc: 'Chronic sinusitis' }], rejectedCodes: [{ code: 'J31.0', desc: 'Rhinitis', reason: 'Wrong indication' }] },
  { drugId: 'xolair', indicationId: 'crswnp', payerId: 'co-medicaid', validCodes: [{ code: 'J33.9', desc: 'Nasal polyp' }, { code: 'J32.9', desc: 'Chronic sinusitis' }], rejectedCodes: [{ code: 'J31.0', desc: 'Rhinitis', reason: 'Wrong code for polyp indication' }] },

  // Dupixent - Eosinophilic Asthma
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'uhc', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent asthma' }, { code: 'J45.50', desc: 'Severe persistent asthma' }, { code: 'D72.1', desc: 'Eosinophilia (secondary)' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified asthma', reason: 'Too vague' }] },
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'bcbs', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'cigna', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'aetna', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'co-medicaid', validCodes: [{ code: 'J45.40', desc: 'Moderate persistent' }, { code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia (required secondary)' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }, { code: 'J45.40', desc: 'Moderate persistent (without D72.1)', reason: 'Missing D72.1 secondary code' }] },

  // Dupixent - Atopic Dermatitis
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'uhc', validCodes: [{ code: 'L20.9', desc: 'Atopic dermatitis, unspecified' }], rejectedCodes: [{ code: 'L30.9', desc: 'Other dermatitis', reason: 'Too vague - not specific to atopic dermatitis' }] },
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'bcbs', validCodes: [{ code: 'L20.9', desc: 'Atopic dermatitis' }, { code: 'L20.81', desc: 'Atopic dermatitis, other specified' }], rejectedCodes: [{ code: 'L30.9', desc: 'Other dermatitis', reason: 'Too vague for Dupixent' }] },
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'cigna', validCodes: [{ code: 'L20.9', desc: 'Atopic dermatitis' }], rejectedCodes: [{ code: 'L30.9', desc: 'Other dermatitis', reason: 'Insufficient specificity' }] },
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'co-medicaid', validCodes: [{ code: 'L20.9', desc: 'Atopic dermatitis' }, { code: 'L20.81', desc: 'Atopic dermatitis, other specified' }], rejectedCodes: [{ code: 'L30.9', desc: 'Other dermatitis', reason: 'L30.9 is too vague - use L20.x codes' }] },

  // Nucala - Eosinophilic Asthma
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'uhc', validCodes: [{ code: 'J45.50', desc: 'Severe persistent asthma' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'bcbs', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'aetna', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'co-medicaid', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },

  // Fasenra - Eosinophilic Asthma
  { drugId: 'fasenra', indicationId: 'eosinophilic-asthma', payerId: 'uhc', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'fasenra', indicationId: 'eosinophilic-asthma', payerId: 'bcbs', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'fasenra', indicationId: 'eosinophilic-asthma', payerId: 'co-medicaid', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },

  // Tezspire - Severe Asthma
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'uhc', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'J45.40', desc: 'Moderate persistent (with severe exacerbations)' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'bcbs', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'J45.40', desc: 'Moderate persistent' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'cigna', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'J45.40', desc: 'Moderate persistent' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'co-medicaid', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },

  // Tezspire - CRSwNP
  { drugId: 'tezspire', indicationId: 'crswnp-tezspire', payerId: 'uhc', validCodes: [{ code: 'J33.9', desc: 'Nasal polyp' }, { code: 'J32.9', desc: 'Chronic sinusitis' }], rejectedCodes: [{ code: 'J31.0', desc: 'Rhinitis', reason: 'Wrong code' }] },
  { drugId: 'tezspire', indicationId: 'crswnp-tezspire', payerId: 'aetna', validCodes: [{ code: 'J33.9', desc: 'Nasal polyp' }, { code: 'J32.9', desc: 'Chronic sinusitis' }], rejectedCodes: [{ code: 'J31.0', desc: 'Rhinitis', reason: 'Wrong code for polyp indication' }] },

  // Cinqair - Eosinophilic Asthma (unique: eos >= 400)
  { drugId: 'cinqair', indicationId: 'eosinophilic-asthma-cinqair', payerId: 'uhc', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'cinqair', indicationId: 'eosinophilic-asthma-cinqair', payerId: 'bcbs', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'cinqair', indicationId: 'eosinophilic-asthma-cinqair', payerId: 'cigna', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },

  // Exdensur - Eosinophilic Asthma
  { drugId: 'exdensur', indicationId: 'eosinophilic-asthma-exdensur', payerId: 'uhc', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
  { drugId: 'exdensur', indicationId: 'eosinophilic-asthma-exdensur', payerId: 'bcbs', validCodes: [{ code: 'J45.50', desc: 'Severe persistent' }, { code: 'D72.1', desc: 'Eosinophilia' }], rejectedCodes: [{ code: 'J45.901', desc: 'Unspecified', reason: 'Too vague' }] },
];

export function validateICD10(drugId: string, indicationId: string, payerId: string, code: string): { valid: boolean; message: string; validCodes: { code: string; desc: string }[]; rejectionReason?: string } {
  const rule = icd10Rules.find(r => r.drugId === drugId && r.indicationId === indicationId && r.payerId === payerId);
  if (!rule) {
    return { valid: false, message: 'No rule found for this combination. Verify drug, payer, and indication are correct.', validCodes: [] };
  }
  const isValid = rule.validCodes.some(c => c.code === code);
  if (isValid) {
    return { valid: true, message: `Valid ICD-10 code: ${code} - ${rule.validCodes.find(c => c.code === code)?.desc}`, validCodes: rule.validCodes };
  }
  const rejection = rule.rejectedCodes.find(c => c.code === code);
  return { valid: false, message: rejection ? `Invalid: ${rejection.reason}` : `Code ${code} not found in payer's approved list`, validCodes: rule.validCodes, rejectionReason: rejection?.reason };
}
