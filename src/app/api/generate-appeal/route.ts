import { NextRequest, NextResponse } from 'next/server';
import { getAppealStrategies } from '@/lib/kb/appeals';
import { drugs } from '@/lib/kb/drugs';
import { payers } from '@/lib/kb/payers';
import { indications } from '@/lib/kb/indications';
import { chatCompletion } from '@/lib/ai';
import { deepResearch, buildPayerSearchQueries, buildResearchedPrompt } from '@/lib/deep-research';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drugId, indicationId, payerId, denialReason, patientData } = body;
    if (!drugId || !indicationId || !payerId || !denialReason) {
      return NextResponse.json({ error: 'Missing required fields: drugId, indicationId, payerId, denialReason' }, { status: 400 });
    }

    const drug = drugs.find(d => d.id === drugId);
    const payer = payers.find(p => p.id === payerId);
    const indication = indications.find(i => i.id === indicationId);
    const strategies = getAppealStrategies(drugId, indicationId, payerId);

    // ── KB Match ──
    const match = strategies.find(s =>
      s.denialReason.toLowerCase().includes(denialReason.toLowerCase()) ||
      denialReason.toLowerCase().includes(s.denialReason.toLowerCase())
    );
    const kbAppeal = match || strategies[0];

    // ── Patient Context ──
    const patientName = patientData?.patientName || '[Patient Name]';
    const mrn = patientData?.mrn || '[MRN]';
    const dob = patientData?.dob || '[DOB]';
    const prescriber = patientData?.prescriber || '[Prescriber Name]';
    const relevantValues: string[] = [];
    if (patientData?.ige) relevantValues.push(`IgE: ${patientData.ige} IU/mL`);
    if (patientData?.eosinophils) relevantValues.push(`Eosinophils: ${patientData.eosinophils} cells/uL`);
    if (patientData?.feno) relevantValues.push(`FeNO: ${patientData.feno} ppb`);
    if (patientData?.fev1) relevantValues.push(`FEV1: ${patientData.fev1}% predicted`);
    if (patientData?.act) relevantValues.push(`ACT Score: ${patientData.act}`);
    if (patientData?.weight) relevantValues.push(`Weight: ${patientData.weight} kg`);
    if (patientData?.stepTherapyMonths) relevantValues.push(`Step therapy: ${patientData.stepTherapyMonths} months ICS+LABA`);
    if (patientData?.exacerbations) relevantValues.push(`Exacerbations: ${patientData.exacerbations}/year`);
    if (patientData?.onOCS) relevantValues.push(`Currently on oral corticosteroids`);
    if (patientData?.hasSpecialist) relevantValues.push(`Specialist prescriber confirmed`);

    const kbContext = strategies.length > 0
      ? `Available KB appeal strategies:\n${strategies.map(s => `  - Denial: "${s.denialReason}"\n    Strategy: ${s.strategy}\n    Citations: ${s.citations.join(', ')}`).join('\n\n')}`
      : 'No specific KB appeal strategies found.';
    const patientContextStr = relevantValues.length > 0
      ? relevantValues.map(v => '  - ' + v).join('\n')
      : '  No specific data provided';

    // ── KB Fallback Letter ──
    const kbLetter = kbAppeal ? `[Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}]

RE: PRIOR AUTHORIZATION APPEAL
Patient: ${patientName}
MRN: ${mrn}
DOB: ${dob}
Drug: ${drug?.name || drugId} (${drug?.generic || ''})${drug?.jcode ? ` - ${drug.jcode}` : ''}
Payer: ${payer?.name || payerId}
Indication: ${indication?.name || indicationId}

To: ${payer?.name || 'Insurance Medical Director'}
From: ${prescriber}

Dear Medical Director,

I am writing to appeal the denial of prior authorization for ${drug?.name || drugId} for the above patient. The denial was based on: "${denialReason}". I respectfully request reconsideration based on the following clinical evidence and rationale.

${kbAppeal.strategy}

Relevant Patient Data:
${patientContextStr}

Supporting References:
${kbAppeal.citations.map(c => '  - ' + c).join('\n')}

I believe this patient meets all clinical criteria for ${drug?.name || drugId} therapy and respectfully request that this appeal be reviewed and approved.

Sincerely,
${prescriber}` : 'No KB appeal strategy found for this combination.';

    // ── Deep Research + LLM Enhancement ──
    let aiAnalysis: string | null = null;
    let aiLetter: string | null = null;
    let aiCitations: string[] | null = null;
    let sources: { url: string; name: string; snippet: string }[] = [];
    let researchTimeMs = 0;

    try {
      // Step 1: Web search for latest appeal strategies and evidence
      const searchQueries = [
        ...buildPayerSearchQueries(
          drug?.name || drugId,
          drug?.generic || '',
          indication?.name || indicationId,
          payer?.name || payerId,
          'appeal'
        ),
        `${drug?.generic || drugId} ${indication?.name || indicationId} clinical trial results efficacy data`,
        `${drug?.name || drugId} FDA prescribing information ${new Date().getFullYear()}`,
      ];

      const research = await deepResearch(searchQueries);
      sources = research.sources;
      researchTimeMs = research.searchTimeMs;

      // Step 2: Build researched prompt
      const { system, user } = buildResearchedPrompt(
        'a Prior Authorization Appeal Specialist',
        research.context,
        kbContext,
        { name: drug?.name || drugId, generic: drug?.generic || '', mechanism: drug?.mechanism || '', route: drug?.route || '', jcode: drug?.jcode || '' },
        payer?.name || payerId,
        indication?.name || indicationId,
        `Write a professional, evidence-based appeal letter for the following denial:

Patient: ${patientName}
MRN: ${mrn}
DOB: ${dob}
Prescriber: ${prescriber}
Drug: ${drug?.name} (${drug?.generic})
Payer: ${payer?.name}
Denial Reason: "${denialReason}"

Patient Clinical Data:
${patientContextStr}

${kbAppeal ? `KB Suggested Strategy:\n${kbAppeal.strategy}\n\nKB Citations: ${kbAppeal.citations.join(', ')}` : ''}

Write the appeal letter with:
1. Professional medical appeal format (date, RE line, salutation, body, closing)
2. Address the specific denial reason with clinical evidence from research
3. Include patient biomarkers and clinical data to support medical necessity
4. Cite peer-reviewed literature, FDA labels, and clinical guidelines from your research
5. Persuasive clinical reasoning a medical director would find compelling
6. Request for peer-to-peer review if appropriate
7. Verifiable source citations

Respond in JSON format:
{
  "appeal": {
    "strategy": "Summary of the appeal strategy",
    "keyArguments": ["Main clinical arguments with evidence"],
    "strengthOfCase": "strong" | "moderate" | "weak"
  },
  "letter": "Full formatted appeal letter text (ready to send)",
  "citations": ["Full citations with authors, journal, year"],
  "clinicalEvidence": "Summary of supporting clinical evidence",
  "nextSteps": ["Recommended next steps if this appeal is also denied"],
  "sources": ["URLs of sources used for verification"]
}`
      );

      // Step 3: LLM analysis with research context (using OpenAI)
      const result = await chatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
      });

      if (result) {
        aiAnalysis = result.content;

        try {
          const parsed = JSON.parse(result.content);
          aiLetter = parsed.letter || kbLetter;
          aiCitations = parsed.citations || kbAppeal?.citations || [];
        } catch {
          aiLetter = result.content.length > 100 ? result.content : kbLetter;
          aiCitations = kbAppeal?.citations || [];
        }
      }
    } catch (llmError) {
      console.error('Deep research/LLM failed, using KB-only result:', llmError);
    }

    return NextResponse.json({
      appeal: kbAppeal || { denialReason, strategy: 'Custom appeal based on denial reason', citations: [], letterTemplate: 'custom' },
      letter: aiLetter || kbLetter,
      citations: aiCitations || kbAppeal?.citations || [],
      aiAnalysis,
      kbResult: {
        strategy: kbAppeal?.strategy,
        citations: kbAppeal?.citations,
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
