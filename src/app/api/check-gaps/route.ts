import { NextRequest, NextResponse } from 'next/server';
import { validateICD10 } from '@/lib/kb/icd10';
import { drugs } from '@/lib/kb/drugs';
import { payers } from '@/lib/kb/payers';
import { indications } from '@/lib/kb/indications';
import { getApplicableRules } from '@/lib/kb/gap-check';
import { chatCompletion } from '@/lib/ai';
import { deepResearch, buildPayerSearchQueries, buildResearchedPrompt } from '@/lib/deep-research';

function runKBGapChecks(drugId: string, indicationId: string, payerId: string, data: Record<string, unknown>) {
  const results: { severity: 'critical' | 'warning' | 'pass'; title: string; detail: string; action?: string }[] = [];
  const drug = drugs.find(d => d.id === drugId);
  const isAsthmaIndication = indicationId.includes('asthma');
  const isAtopicDermatitis = indicationId === 'atopic-dermatitis';
  const isCSU = indicationId === 'csu';

  // ICD-10
  const icd10Code = (data.icd10Code as string || '').toUpperCase().trim();
  if (icd10Code) {
    const icdResult = validateICD10(drugId, indicationId, payerId, icd10Code);
    results.push({
      severity: icdResult.valid ? 'pass' : 'critical',
      title: icdResult.valid ? `ICD-10: ${icd10Code} Validated` : `ICD-10: ${icd10Code} Invalid`,
      detail: icdResult.valid ? icdResult.message : `${icdResult.message}. Valid codes: ${icdResult.validCodes.map(c => `${c.code} (${c.desc})`).join(', ')}`,
      action: icdResult.valid ? undefined : 'Submit corrected ICD-10 code from payer-approved list',
    });
  } else {
    results.push({ severity: 'warning', title: 'ICD-10 Code Missing', detail: 'No ICD-10 code provided.', action: 'Select from payer-approved list' });
  }

  // Xolair IgE
  if (drugId === 'xolair' && isAsthmaIndication) {
    const ige = Number(data.ige);
    if (!isNaN(ige)) {
      if (ige >= 30 && ige <= 1500) {
        results.push({ severity: 'pass', title: `IgE: ${ige} IU/mL - Within Range`, detail: 'IgE within 30-1500 IU/mL range.' });
      } else if (ige > 1500) {
        results.push({ severity: 'critical', title: `IgE: ${ige} IU/mL - Above 1500`, detail: 'IgE exceeds upper limit.', action: 'Cite ERS/ATS 2020 guidelines supporting Xolair regardless of IgE when documented atopy present.' });
      } else {
        results.push({ severity: 'critical', title: `IgE: ${ige} IU/mL - Below 30`, detail: 'IgE below 30 minimum for Xolair.', action: 'Consider non-IgE-mediated alternatives.' });
      }
    } else {
      results.push({ severity: 'critical', title: 'IgE Level Not Provided', detail: 'IgE required for Xolair PA.', action: 'Order serum IgE test.' });
    }
  }

  // Eosinophilic drugs
  if (['dupixent', 'nucala', 'fasenra'].includes(drugId) && isAsthmaIndication) {
    const eos = Number(data.eosinophils);
    const threshold = drugId === 'cinqair' ? 400 : 150;
    if (!isNaN(eos)) {
      if (eos >= threshold) {
        results.push({ severity: 'pass', title: `Eosinophils: ${eos} cells/uL - Above ${threshold}`, detail: `Meets >=${threshold} threshold.` });
      } else {
        const onOCS = data.onOCS === true || data.onOCS === 'true';
        if (onOCS) {
          results.push({ severity: 'warning', title: `Eosinophils: ${eos} (on OCS) - Below ${threshold}`, detail: 'OCS may suppress eosinophils.', action: 'Request pre-OCS eosinophil count.' });
        } else {
          results.push({ severity: 'critical', title: `Eosinophils: ${eos} - Below ${threshold}`, detail: `Below required threshold.`, action: 'Check if on OCS. Submit FeNO >=25 ppb as alternative.' });
        }
      }
    } else {
      results.push({ severity: 'warning', title: 'Eosinophil Count Not Provided', detail: `Required for ${drug?.name}.`, action: 'Order CBC with differential.' });
    }
  }

  // Cinqair unique threshold
  if (drugId === 'cinqair') {
    const eos = Number(data.eosinophils);
    if (!isNaN(eos) && eos >= 150 && eos < 400) {
      results.push({ severity: 'warning', title: `Eosinophils: ${eos} - Qualifies for Nucala/Fasenra (150), not Cinqair (400)`, detail: 'Cinqair requires >=400.', action: 'If IV needed, document IV route necessity.' });
    }
  }

  // Tezspire: no biomarker requirement
  if (drugId === 'tezspire') {
    const eos = Number(data.eosinophils);
    const ige = Number(data.ige);
    const feno = Number(data.feno);
    if (!isNaN(eos) && eos < 150 && !isNaN(ige) && ige < 30) {
      results.push({ severity: 'pass', title: 'Low Biomarkers - Tezspire Has No Biomarker Requirement', detail: 'Tezspire is the ONLY FDA-approved biologic for this patient profile.' });
    }
  }

  // Step therapy
  if (isAsthmaIndication && drugId !== 'exdensur') {
    const stepTherapyMonths = Number(data.stepTherapyMonths);
    if (!isNaN(stepTherapyMonths)) {
      if (stepTherapyMonths >= 3) {
        results.push({ severity: 'pass', title: `ICS+LABA Trial: ${stepTherapyMonths} months - Meets requirement`, detail: 'Documented trial meets duration requirement.' });
      } else if (stepTherapyMonths > 0) {
        results.push({ severity: 'critical', title: `ICS+LABA Trial: Only ${stepTherapyMonths} months`, detail: 'Below 3 month minimum.', action: 'Wait until 3-month mark.' });
      } else {
        results.push({ severity: 'critical', title: 'No ICS+LABA Trial Documented', detail: 'Step therapy required.', action: 'Document ICS+LABA regimen with pharmacy fill records.' });
      }
    } else {
      results.push({ severity: 'warning', title: 'ICS+LABA Trial Duration Unknown', detail: 'Most payers require >=3 months.', action: 'Submit pharmacy fill records.' });
    }
  }

  // FEV1
  if (isAsthmaIndication) {
    const fev1 = Number(data.fev1);
    if (!isNaN(fev1)) {
      if (fev1 < 80) {
        results.push({ severity: 'pass', title: `FEV1: ${fev1}% - Supports severity`, detail: 'FEV1 below 80% supports severe diagnosis.' });
      } else {
        results.push({ severity: 'warning', title: `FEV1: ${fev1}% - Above 80%`, detail: 'May not support severity. GINA 2024 notes spirometry may be normal between exacerbations.', action: 'Document exacerbation count, ACT, OCS use.' });
      }
    }
  }

  // ACT Score
  if (isAsthmaIndication) {
    const act = Number(data.act);
    if (!isNaN(act)) {
      if (act < 19) {
        results.push({ severity: 'pass', title: `ACT Score: ${act} - Uncontrolled`, detail: 'ACT <19 supports biologic necessity.' });
      } else if (act >= 20) {
        results.push({ severity: 'warning', title: `ACT Score: ${act} - Controlled`, detail: 'May not support biologic PA.', action: 'Reassess during symptoms.' });
      }
    }
  }

  // Specialist (Aetna)
  if (payerId === 'aetna' && isAsthmaIndication) {
    const hasSpecialist = data.hasSpecialist === true || data.hasSpecialist === 'true';
    if (hasSpecialist) {
      results.push({ severity: 'pass', title: 'Specialist Prescriber Confirmed', detail: 'Aetna requires specialist prescriber.' });
    } else {
      results.push({ severity: 'warning', title: 'Specialist Prescriber Not Confirmed', detail: 'Aetna requires allergist/immunologist/pulmonologist.', action: 'Have specialist co-sign PA.' });
    }
  }

  // Weight (Cigna Xolair)
  if (drugId === 'xolair' && payerId === 'cigna') {
    const weight = Number(data.weight);
    if (!isNaN(weight)) {
      if (weight >= 30 && weight <= 150) {
        results.push({ severity: 'pass', title: `Weight: ${weight} kg - Within range`, detail: 'Cigna requires 30-150 kg.' });
      } else {
        results.push({ severity: 'warning', title: `Weight: ${weight} kg - Outside range`, detail: 'Cigna requires 30-150 kg.', action: 'Cite FDA dosing considerations.' });
      }
    }
  }

  // Atopic Dermatitis EASI
  if (isAtopicDermatitis && drugId === 'dupixent') {
    const easi = Number(data.easi);
    if (!isNaN(easi)) {
      if (easi >= 16) {
        results.push({ severity: 'pass', title: `EASI Score: ${easi} - Meets threshold`, detail: 'EASI >=16 meets severity requirement.' });
      } else if (easi > 0) {
        results.push({ severity: 'warning', title: `EASI Score: ${easi} - Below threshold (16)`, detail: 'May require EASI >=16.', action: 'Submit photographs and DLQI as alternative.' });
      }
    }
  }

  // Exdensur
  if (drugId === 'exdensur') {
    const onAntiIL5 = data.onAntiIL5 === true || data.onAntiIL5 === 'true';
    if (onAntiIL5) {
      results.push({ severity: 'pass', title: 'Currently on Anti-IL-5 Therapy', detail: 'Exdensur requires current anti-IL-5 control.' });
    } else {
      results.push({ severity: 'critical', title: 'Not on Current Anti-IL-5 Therapy', detail: 'Exdensur is step-DOWN therapy.', action: 'Start with Nucala or Fasenra first.' });
    }
    const historicalEos = Number(data.historicalEos);
    if (!isNaN(historicalEos) && historicalEos >= 300) {
      results.push({ severity: 'pass', title: `Historical Eosinophils: ${historicalEos} - Meets >=300`, detail: 'Pre-treatment count meets requirement.' });
    } else if (!isNaN(historicalEos) && historicalEos < 300) {
      results.push({ severity: 'critical', title: `Historical Eosinophils: ${historicalEos} - Below 300`, detail: 'Requires >=300 pre-treatment.', action: 'Request pre-treatment eosinophil count.' });
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drugId, indicationId, payerId, patientData } = body;
    if (!drugId || !indicationId || !payerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data = patientData || {};
    const drug = drugs.find(d => d.id === drugId);
    const payer = payers.find(p => p.id === payerId);
    const indication = indications.find(i => i.id === indicationId);

    // ── KB Gap Check (instant) ──
    const kbGaps = runKBGapChecks(drugId, indicationId, payerId, data);
    const applicableRules = getApplicableRules(drugId, indicationId, payerId);

    const kbContext = applicableRules.length > 0
      ? `Applicable KB rules:\n${applicableRules.map(r => `  - [${r.severity}] ${r.rule} (${r.category}): ${r.guidance}`).join('\n')}`
      : 'No specific KB rules found.';

    const patientDataStr = Object.entries(data)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n');

    // ── Deep Research + LLM Enhancement ──
    let aiAnalysis: string | null = null;
    let aiVerdict: string | null = null;
    let sources: { url: string; name: string; snippet: string }[] = [];
    let researchTimeMs = 0;

    try {
      // Step 1: Web search for latest criteria
      const searchQueries = buildPayerSearchQueries(
        drug?.name || drugId,
        drug?.generic || '',
        indication?.name || indicationId,
        payer?.name || payerId,
        'gap-check'
      );

      const research = await deepResearch(searchQueries);
      sources = research.sources;
      researchTimeMs = research.searchTimeMs;

      // Step 2: Build researched prompt
      const { system, user } = buildResearchedPrompt(
        'a Prior Authorization Gap Analysis specialist',
        research.context,
        kbContext,
        { name: drug?.name || drugId, generic: drug?.generic || '', mechanism: drug?.mechanism || '', route: drug?.route || '', jcode: drug?.jcode || '' },
        payer?.name || payerId,
        indication?.name || indicationId,
        `Perform a comprehensive gap analysis for ${drug?.name} PA submission to ${payer?.name} for ${indication?.name}.

Patient Data Provided:
${patientDataStr || 'No patient data provided'}

KB Gap Check Results (instant validation):
${kbGaps.map(g => `  [${g.severity.toUpperCase()}] ${g.title}: ${g.detail}${g.action ? ` -> ${g.action}` : ''}`).join('\n')}

Now cross-reference the KB results with your research findings. Check for:
1. Are the biomarker thresholds still current per latest guidelines?
2. Has ${payer?.name} updated their step therapy requirements?
3. Any recent policy changes that affect this submission?
4. Are there additional gaps the KB might have missed?

Respond in JSON format:
{
  "verdict": "READY" or "DO_NOT_SUBMIT",
  "message": "Summary (2-3 sentences)",
  "gaps": [
    {
      "severity": "critical" | "warning" | "pass",
      "title": "Brief title",
      "detail": "Detailed explanation with source citations",
      "action": "What to do (if gap)"
    }
  ],
  "criticalCount": number,
  "warningCount": number,
  "passCount": number,
  "recommendations": ["Actionable recommendations"],
  "sources": ["URLs of sources used"]
}`
      );

      // Step 3: LLM analysis with research context (using OpenAI)
      const result = await chatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
      });

      if (result) {
        aiAnalysis = result.content;

        try {
          const parsed = JSON.parse(result.content);
          if (parsed.verdict) aiVerdict = parsed.verdict;
        } catch {
          // Use KB verdict if LLM parsing fails
        }
      }
    } catch (llmError) {
      console.error('Deep research/LLM failed, using KB-only result:', llmError);
    }

    // ── Merge Results ──
    const criticalCount = kbGaps.filter(g => g.severity === 'critical').length;
    const warningCount = kbGaps.filter(g => g.severity === 'warning').length;
    const passCount = kbGaps.filter(g => g.severity === 'pass').length;
    const canSubmit = criticalCount === 0;
    const verdict = aiVerdict || (canSubmit ? 'READY' : 'DO_NOT_SUBMIT');

    return NextResponse.json({
      verdict,
      message: canSubmit
        ? 'All critical criteria met. Ready for submission.'
        : `DO NOT SUBMIT - ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} will cause denial.`,
      gaps: kbGaps,
      criticalCount,
      warningCount,
      passCount,
      aiAnalysis,
      kbResult: {
        verdict: canSubmit ? 'READY' : 'DO_NOT_SUBMIT',
        criticalCount,
        warningCount,
      },
      research: {
        sourcesUsed: sources.length,
        researchTimeMs,
        sources: sources.slice(0, 5).map(s => ({ name: s.name, url: s.url })),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
