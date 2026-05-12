import { DocumentRule, DocRecommendation } from './types';

export const documentRules: DocumentRule[] = [
  // Xolair - Allergic Asthma
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'uhc', documents: [
    { name: 'Serum IgE level with date', required: true, rationale: 'Must be 30-1500 IU/mL for UHC Xolair approval' },
    { name: 'Allergen skin test or specific IgE results', required: true, rationale: 'Must show positive perennial aeroallergen reactivity' },
    { name: 'ICS+LABA pharmacy fill records', required: true, rationale: 'UHC requires documented 3-month trial of high-dose ICS+LABA' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document persistent asthma symptoms despite controller therapy' },
    { name: 'Body weight', required: true, rationale: 'Required for Xolair weight/IgE-based dosing table (30-150 kg)' },
    { name: 'PFT/Spirometry (FEV1)', required: false, rationale: 'FEV1 <80% strengthens severity documentation' },
    { name: 'ACT scores from last 3 visits', required: false, rationale: 'ACT <19 = uncontrolled, supports biologic need' },
    { name: 'ER/hospitalization records', required: false, rationale: 'Documents severity beyond spirometry' },
  ]},
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'bcbs', documents: [
    { name: 'Serum IgE level with date', required: true, rationale: 'Must be 30-1500 IU/mL' },
    { name: 'Allergen skin test or specific IgE', required: true, rationale: 'Must show positive aeroallergen reactivity' },
    { name: 'PFT/Spirometry with FEV1', required: true, rationale: 'BCBS specifically requires FEV1 documentation (<80% predicted)' },
    { name: 'ICS+LABA trial documentation (>=3 months)', required: true, rationale: 'BCBS requires medium-to-high dose ICS+LABA for 3+ months' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document persistent symptoms' },
    { name: 'ACT scores', required: false, rationale: 'Supports uncontrolled asthma documentation' },
    { name: 'ER/hospitalization records', required: false, rationale: 'Severity documentation' },
  ]},
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'cigna', documents: [
    { name: 'Serum IgE level with date', required: true, rationale: 'Must be >=30 IU/mL' },
    { name: 'Allergen skin test or specific IgE', required: true, rationale: 'Positive perennial allergen test required' },
    { name: 'ICS+LABA trial documentation', required: true, rationale: 'High-dose ICS+LABA required' },
    { name: 'LAMA/LTRA trial documentation', required: true, rationale: 'Cigna may require LAMA (tiotropium) or LTRA (montelukast) trial' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document persistent symptoms' },
    { name: 'Body weight', required: true, rationale: 'Cigna requires weight 30-150 kg for dosing' },
    { name: 'Pharmacy adherence records', required: false, rationale: 'May be requested' },
    { name: 'PFT/Spirometry', required: false, rationale: 'Supports severity documentation' },
  ]},
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'aetna', documents: [
    { name: 'Serum IgE level with date', required: true, rationale: 'Must be 30-1500 IU/mL' },
    { name: 'Allergen skin test or specific IgE', required: true, rationale: 'Positive allergen test required' },
    { name: 'Pharmacy fill records showing ICS+LABA adherence', required: true, rationale: 'Aetna requires documented >=80% adherence for >=3 months' },
    { name: 'ACT scores from last 3 visits', required: true, rationale: 'Aetna wants ACT score documentation' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document symptoms despite therapy' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Aetna requires allergist/immunologist or pulmonologist' },
    { name: 'Exacerbation history', required: false, rationale: 'Supports medical necessity' },
  ]},
  { drugId: 'xolair', indicationId: 'allergic-asthma', payerId: 'co-medicaid', documents: [
    { name: 'Serum IgE level with date', required: true, rationale: 'Must be >=30 IU/mL per Appendix Y' },
    { name: 'Allergen skin test or specific IgE', required: true, rationale: 'Positive allergen test per Appendix Y' },
    { name: 'ICS+LABA trial documentation', required: true, rationale: 'Per Appendix Y step therapy requirements' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document persistent symptoms' },
    { name: 'PFT/Spirometry', required: false, rationale: 'Supports severity' },
    { name: 'Body weight', required: false, rationale: 'For dosing' },
  ]},

  // Xolair - CSU
  { drugId: 'xolair', indicationId: 'csu', payerId: 'uhc', documents: [
    { name: 'H1 antihistamine trial history with doses', required: true, rationale: 'Must document standard dose then up-titrated to 2-4x' },
    { name: 'Progress notes (>6 weeks duration)', required: true, rationale: 'Document chronic urticaria >6 weeks with no identifiable trigger' },
    { name: 'H2 antagonist or LTRA trial', required: true, rationale: 'UHC requires H2/LTRA trial after H1 up-titration' },
    { name: 'UAS7 scores', required: false, rationale: 'Urticaria Activity Score over 7 days - supports severity' },
    { name: 'Lesion photographs', required: false, rationale: 'Visual documentation of hives' },
    { name: 'CBC/CMP/ESR/TSH/ANA', required: false, rationale: 'Rule out underlying cause' },
    { name: 'DLQI questionnaire', required: false, rationale: 'Dermatology Life Quality Index - documents impact' },
    { name: 'ER visits for urticaria/angioedema', required: false, rationale: 'Documents severity and H1 antihistamine failure' },
  ]},
  { drugId: 'xolair', indicationId: 'csu', payerId: 'bcbs', documents: [
    { name: 'H1 antihistamine history (standard + up-titrated)', required: true, rationale: 'BCBS requires >=4 weeks standard, >=2 weeks up-titrated' },
    { name: 'H2/LTRA trial documentation', required: true, rationale: 'BCBS requires >=2 weeks of H2 or LTRA' },
    { name: 'Progress notes', required: true, rationale: 'Document symptom duration and persistence' },
    { name: 'Pharmacy records for antihistamine fills', required: true, rationale: 'Proves duration of step therapy' },
    { name: 'UAS7 scores', required: false, rationale: 'Severity documentation' },
    { name: 'Photographs', required: false, rationale: 'Visual evidence' },
  ]},

  // Dupixent - Eosinophilic Asthma
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'uhc', documents: [
    { name: 'Blood eosinophil count with date', required: true, rationale: 'Must be >=150 cells/uL OR FeNO >=25 ppb OR OCS-dependent' },
    { name: 'ICS+LABA trial documentation (>=3 months)', required: true, rationale: 'UHC requires high-dose ICS+LABA for >=3 months' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document eosinophilic phenotype or OCS dependence' },
    { name: 'PFT/Spirometry', required: true, rationale: 'Document severity' },
    { name: 'Complete medication history', required: true, rationale: 'Document ICS dose, LABA, LAMA, LTRA, OCS use' },
    { name: 'Exacerbation history', required: false, rationale: 'Document >=2 exacerbations/year or OCS bursts' },
    { name: 'Specialist prescriber letter', required: false, rationale: 'Allergist/immunologist/pulmonologist documentation' },
  ]},
  { drugId: 'dupixent', indicationId: 'eosinophilic-asthma', payerId: 'aetna', documents: [
    { name: 'Blood eosinophil count with date', required: true, rationale: 'Must be >=150 or FeNO >=25 or OCS-dependent' },
    { name: 'ICS+LABA trial documentation', required: true, rationale: '>=3 months high-dose with documented adherence' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Aetna requires allergist/immunologist/pulmonologist' },
    { name: 'Exacerbation history (>=2/year or OCS-dependent)', required: true, rationale: 'Must show >=2 exacerbations/year or OCS dependence' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document phenotype and severity' },
    { name: 'Pharmacy fill records', required: true, rationale: 'Document ICS+LABA adherence' },
    { name: 'FeNO level', required: false, rationale: 'Alternative biomarker when eosinophils borderline' },
  ]},

  // Dupixent - Atopic Dermatitis
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'uhc', documents: [
    { name: 'EASI score or IGA score', required: true, rationale: 'Documents atopic dermatitis severity' },
    { name: 'Topical corticosteroid trial (>=4 weeks)', required: true, rationale: 'Medium-to-high potency TCS for >=4 weeks required' },
    { name: 'Topical calcineurin inhibitor or PDE4 inhibitor trial', required: true, rationale: 'Required after TCS trial' },
    { name: 'Complete topical medication history', required: true, rationale: 'List each agent: drug name, potency class, body area, duration, response' },
    { name: 'Dermatology/allergist notes', required: true, rationale: 'Specialist documentation of inadequacy' },
    { name: 'Photographs of affected areas', required: false, rationale: 'Visual severity documentation' },
    { name: 'DLQI questionnaire', required: false, rationale: 'Quality of life impact' },
    { name: 'Systemic therapy trials (methotrexate, cyclosporine, JAK inhibitors)', required: false, rationale: 'Document prior systemic therapy failures if applicable' },
    { name: 'BSA (Body Surface Area) affected', required: false, rationale: 'Documents extent of disease' },
  ]},
  { drugId: 'dupixent', indicationId: 'atopic-dermatitis', payerId: 'cigna', documents: [
    { name: 'EASI score (>=16)', required: true, rationale: 'Cigna requires EASI >=16 or IGA >=3' },
    { name: 'Topical corticosteroid trial', required: true, rationale: 'Required step therapy' },
    { name: 'Topical calcineurin inhibitor trial', required: true, rationale: 'Required after TCS' },
    { name: 'Photographs', required: true, rationale: 'Cigna often requests photographic evidence' },
    { name: 'Complete topical medication history', required: true, rationale: 'Document each agent tried' },
    { name: 'DLQI', required: false, rationale: 'Quality of life impact' },
    { name: 'BSA', required: false, rationale: 'Extent of disease' },
  ]},

  // Nucala - Eosinophilic Asthma
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'uhc', documents: [
    { name: 'Blood eosinophil count with date (>=150 current OR >=300 historical)', required: true, rationale: 'UHC requires >=150 current or >=300 within 12 months' },
    { name: 'ICS+LABA trial documentation (>=3 months)', required: true, rationale: 'High-dose ICS+LABA for >=3 months' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Must be prescribed by specialist' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document eosinophilic phenotype' },
    { name: 'PFT/Spirometry', required: true, rationale: 'Document severity' },
    { name: 'Exacerbation history', required: true, rationale: 'Compile: ER, hospitalizations, OCS bursts, unscheduled visits' },
    { name: 'OCS prescription history', required: false, rationale: 'Documents OCS dependence if applicable' },
    { name: 'Prior biologic trial results', required: false, rationale: 'If switching from Xolair/Dupixent' },
    { name: 'Pharmacy fill records', required: false, rationale: 'Document ICS+LABA adherence' },
  ]},
  { drugId: 'nucala', indicationId: 'eosinophilic-asthma', payerId: 'co-medicaid', documents: [
    { name: 'Blood eosinophil count with date (>=150)', required: true, rationale: 'Per Appendix Y' },
    { name: 'ICS+LABA trial documentation', required: true, rationale: 'Per Appendix Y' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document eosinophilic phenotype' },
    { name: 'PFT/Spirometry', required: false, rationale: 'Supports severity' },
    { name: 'Exacerbation history', required: false, rationale: 'Supports necessity' },
  ]},

  // Fasenra - Eosinophilic Asthma
  { drugId: 'fasenra', indicationId: 'eosinophilic-asthma', payerId: 'uhc', documents: [
    { name: 'Blood eosinophil count with date (>=150)', required: true, rationale: 'Fasenra requires >=150 eosinophils' },
    { name: 'ICS+LABA trial documentation (>=3 months)', required: true, rationale: 'High-dose ICS+LABA for >=3 months' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Must be prescribed by specialist' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document eosinophilic phenotype' },
    { name: 'PFT/Spirometry', required: false, rationale: 'Severity documentation' },
    { name: 'Exacerbation history', required: false, rationale: 'Supports necessity' },
    { name: 'Prior Nucala trial (if switching)', required: false, rationale: 'Document Nucala failure/intolerance for Q8W dosing rationale' },
  ]},

  // Tezspire - Severe Asthma
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'uhc', documents: [
    { name: 'Complete medication history (ICS+LABA)', required: true, rationale: 'High-dose ICS+LABA >=3 months required' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document severe asthma despite controller therapy' },
    { name: 'Exacerbation history (>=2/year)', required: true, rationale: 'UHC requires >=2 exacerbations per year' },
    { name: 'Biomarker levels (eosinophils, IgE, FeNO)', required: false, rationale: 'NO biomarker requirement for Tezspire, but documenting strengthens case' },
    { name: 'Prior biologic trial documentation', required: false, rationale: 'If payer requires prior biologic trial' },
    { name: 'PFT/Spirometry', required: false, rationale: 'Severity documentation' },
    { name: 'ACT scores', required: false, rationale: 'Document uncontrolled status' },
    { name: 'ER/hospitalization records', required: false, rationale: 'Document exacerbation severity' },
  ]},
  { drugId: 'tezspire', indicationId: 'severe-asthma', payerId: 'cigna', documents: [
    { name: 'Complete medication history (ICS+LABA)', required: true, rationale: 'High-dose ICS+LABA required' },
    { name: 'Last 3 progress notes', required: true, rationale: 'Document severe asthma' },
    { name: 'Exacerbation history', required: true, rationale: '>=2 exacerbations per year' },
    { name: 'All biomarker levels', required: false, rationale: 'Document eos<150, IgE<30, FeNO<25 to show no phenotype-specific biologic qualifies' },
    { name: 'Negative allergen testing results', required: false, rationale: 'Rules out Xolair if IgE<30 + negative skin test' },
    { name: 'Prior biologic trial/failure documentation', required: false, rationale: 'If applicable' },
  ]},

  // Tezspire - CRSwNP
  { drugId: 'tezspire', indicationId: 'crswnp-tezspire', payerId: 'aetna', documents: [
    { name: 'Intranasal corticosteroid documentation (ongoing use)', required: true, rationale: 'Aetna requires confirmation of continued intranasal corticosteroid use for reauth' },
    { name: 'Oral steroid course documentation', required: true, rationale: 'Required before biologic approval' },
    { name: 'Prior surgery documentation (if applicable)', required: true, rationale: 'Surgery preferred or documented unsuitability' },
    { name: 'Endoscopy/CT results', required: true, rationale: 'Polyp confirmation' },
    { name: 'Clinical response at each visit', required: true, rationale: 'Aetna reauth requires documented response at EVERY visit (Peter Kane case)' },
    { name: 'SNOT-22 scores', required: false, rationale: 'Documents symptom improvement' },
    { name: 'Last 3 progress notes', required: false, rationale: 'Treatment timeline' },
  ]},

  // Cinqair - Eosinophilic Asthma (unique: eos >= 400)
  { drugId: 'cinqair', indicationId: 'eosinophilic-asthma-cinqair', payerId: 'uhc', documents: [
    { name: 'Blood eosinophil count with date (>=400)', required: true, rationale: 'Cinqair uniquely requires >=400 eosinophils (higher than Nucala/Fasenra 150 threshold)' },
    { name: 'Body weight', required: true, rationale: 'Cinqair uses weight-based dosing (3 mg/kg)' },
    { name: 'ICS+LABA trial documentation', required: true, rationale: 'High-dose ICS+LABA required' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Must be prescribed by specialist' },
    { name: 'Documentation of IV route necessity', required: true, rationale: 'Cinqair is IV only - document why SC alternatives not suitable' },
    { name: 'Prior SC biologic trial results (if applicable)', required: false, rationale: 'If Nucala and Fasenra failed, document each failure' },
    { name: 'Infusion center availability', required: false, rationale: 'Confirm in-network infusion facility available' },
    { name: 'Last 3 progress notes', required: false, rationale: 'Document eosinophilic phenotype' },
  ]},

  // Exdensur - Eosinophilic Asthma (step-DOWN)
  { drugId: 'exdensur', indicationId: 'eosinophilic-asthma-exdensur', payerId: 'uhc', documents: [
    { name: 'Current anti-IL-5 therapy documentation (Nucala/Fasenra)', required: true, rationale: 'Exdensur is step-DOWN: patient must already be controlled on anti-IL-5' },
    { name: 'Evidence of disease control on current therapy', required: true, rationale: 'Document reduced exacerbations, improved PFTs, reduced OCS on Nucala/Fasenra' },
    { name: 'Historical eosinophil count >=300 (before anti-IL-5 start)', required: true, rationale: 'Current eos may be normal due to therapy - need pre-treatment count' },
    { name: 'Rationale for switch to Q6M dosing', required: true, rationale: 'Document adherence improvement, fewer injections, patient preference' },
    { name: 'Specialist prescriber documentation', required: true, rationale: 'Required for new drug approval' },
    { name: 'SWIFT trial reference', required: false, rationale: 'Khurana et al. NEJM 2023 - supports maintenance therapy' },
    { name: 'Last 3 progress notes on current therapy', required: false, rationale: 'Document stable control' },
  ]},
];

export function getDocuments(drugId: string, indicationId: string, payerId: string): DocRecommendation[] {
  // Try exact match first
  let rule = documentRules.find(r => r.drugId === drugId && r.indicationId === indicationId && r.payerId === payerId);
  // Fallback: try same drug+indication with any payer
  if (!rule) rule = documentRules.find(r => r.drugId === drugId && r.indicationId === indicationId);
  // Fallback: try same drug with any indication
  if (!rule) rule = documentRules.find(r => r.drugId === drugId);
  return rule ? rule.documents : [];
}
