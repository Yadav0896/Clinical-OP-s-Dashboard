import { NextRequest, NextResponse } from 'next/server';
import { validateICD10 as kbValidateICD10, icd10Rules } from '@/lib/kb/icd10';
import { drugs } from '@/lib/kb/drugs';
import { payers } from '@/lib/kb/payers';
import { indications } from '@/lib/kb/indications';
import { chatCompletion } from '@/lib/ai';
import { deepResearch, buildPayerSearchQueries, buildResearchedPrompt } from '@/lib/deep-research';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drugId, indicationId, payerId, code } = body;
    if (!drugId || !indicationId || !payerId || !code) {
      return NextResponse.json({ error: 'Missing required fields: drugId, indicationId, payerId, code' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const drug = drugs.find(d => d.id === drugId);
    const payer = payers.find(p => p.id === payerId);
    const indication = indications.find(i => i.id === indicationId);

    // ── KB Fallback Result (instant, no latency) ──
    const kbResult = kbValidateICD10(drugId, indicationId, payerId, cleanCode);
    const rule = icd10Rules.find(r => r.drugId === drugId && r.indicationId === indicationId && r.payerId === payerId);

    const kbContext = rule
      ? `Valid codes for ${drug?.name}/${indication?.name}/${payer?.name}:\n${rule.validCodes.map(c => `  - ${c.code}: ${c.desc}`).join('\n')}\n\nRejected codes:\n${rule.rejectedCodes.map(c => `  - ${c.code}: ${c.desc} (${c.reason})`).join('\n')}`
      : `No specific KB rules found for this combination.`;

    // ── Deep Research + LLM Enhancement ──
    let aiAnalysis: string | null = null;
    let aiValid: boolean | null = null;
    let aiMessage: string | null = null;
    let sources: { url: string; name: string; snippet: string }[] = [];
    let researchTimeMs = 0;

    try {
      // Step 1: Web search for latest payer criteria
      const searchQueries = buildPayerSearchQueries(
        drug?.name || drugId,
        drug?.generic || '',
        indication?.name || indicationId,
        payer?.name || payerId,
        'icd10'
      );

      const research = await deepResearch(searchQueries);
      sources = research.sources;
      researchTimeMs = research.searchTimeMs;

      // Step 2: Build researched prompt
      const { system, user } = buildResearchedPrompt(
        'a Prior Authorization ICD-10 coding specialist',
        research.context,
        kbContext,
        { name: drug?.name || drugId, generic: drug?.generic || '', mechanism: drug?.mechanism || '', route: drug?.route || '', jcode: drug?.jcode || '' },
        payer?.name || payerId,
        indication?.name || indicationId,
        `Validate ICD-10 code ${cleanCode} for ${drug?.name} (${indication?.name}) with ${payer?.name}.

Consider:
1. Is ${cleanCode} specific enough for this payer's requirements?
2. Does ${cleanCode} match the clinical indication for ${drug?.name}?
3. Are there payer-specific ICD-10 rules that apply?
4. Could a more specific code be used?
5. What does the latest coding guidance say about this combination?

Respond in JSON format:
{
  "valid": true/false,
  "message": "Brief explanation (1-2 sentences)",
  "rejectionReason": "If invalid, specific reason why",
  "alternativeCodes": ["list of better codes if applicable"],
  "clinicalContext": "Brief clinical explanation",
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
          aiValid = parsed.valid;
          aiMessage = parsed.message;
        } catch {
          aiMessage = result.content.substring(0, 500);
        }
      }
    } catch (llmError) {
      console.error('Deep research/LLM failed, using KB-only result:', llmError);
    }

    // ── Merge Results ──
    const isValid = aiValid !== null ? aiValid : kbResult.valid;
    const message = aiMessage || kbResult.message;

    return NextResponse.json({
      valid: isValid,
      message,
      validCodes: kbResult.validCodes,
      rejectionReason: kbResult.rejectionReason,
      aiAnalysis,
      kbResult: {
        valid: kbResult.valid,
        message: kbResult.message,
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
