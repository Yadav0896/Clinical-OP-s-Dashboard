import { NextRequest, NextResponse } from 'next/server';
import { getDocuments as kbGetDocuments, documentRules } from '@/lib/kb/documents';
import { drugs } from '@/lib/kb/drugs';
import { payers } from '@/lib/kb/payers';
import { indications } from '@/lib/kb/indications';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai';
import { deepResearch, buildPayerSearchQueries, buildResearchedPrompt } from '@/lib/deep-research';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drugId, indicationId, payerId, submissionId } = body;
    if (!drugId || !indicationId || !payerId) {
      return NextResponse.json({ error: 'Missing required fields: drugId, indicationId, payerId' }, { status: 400 });
    }

    const drug = drugs.find(d => d.id === drugId);
    const payer = payers.find(p => p.id === payerId);
    const indication = indications.find(i => i.id === indicationId);

    // ── KB Fallback Result ──
    const docs = kbGetDocuments(drugId, indicationId, payerId);
    const required = docs.filter(d => d.required);
    const optional = docs.filter(d => !d.required);
    const rule = documentRules.find(r => r.drugId === drugId && r.indicationId === indicationId && r.payerId === payerId);

    const kbContext = rule
      ? `Current KB document requirements:\n${rule.documents.map(d => `[${d.required ? 'REQUIRED' : 'OPTIONAL'}] ${d.name} - ${d.rationale}`).join('\n')}`
      : 'No existing KB rules for this combination.';

    // ── Load patient biomarkers if submissionId provided ──
    let patientBiomarkers: string = 'No patient data available';
    if (submissionId) {
      try {
        const submission = await db.submission.findUnique({
          where: { id: submissionId },
          include: {
            patient: { biomarkers: true },
          },
        });
        if (submission?.patient) {
          const p = submission.patient as Record<string, unknown>;
          const bioList = p.biomarkers as Array<{ type: string; value: number; unit?: string; dateCollected: string; notes?: string }>;
          const biomarkerLines = bioList.map(b => `${b.type}: ${b.value} ${b.unit || ''} (${new Date(b.dateCollected).toLocaleDateString()})${b.notes ? ` - ${b.notes}` : ''}`);
          patientBiomarkers = `Patient: ${p.firstName} ${p.lastName} (DOB: ${new Date(p.dateOfBirth as string).toLocaleDateString()}, MRN: ${p.mrn || 'N/A'})
Payer: ${p.payerName || 'N/A'}
Allergies: ${p.allergies || 'None documented'}
Diagnosis Notes: ${p.diagnosisNotes || 'None'}
Recent Biomarkers:
${biomarkerLines.length > 0 ? biomarkerLines.join('\n') : 'No biomarker data available'}`;
        }
      } catch (dbError) {
        console.error('Failed to load submission data:', dbError);
      }
    }

    // ── Deep Research + LLM Enhancement ──
    let aiAnalysis: string | null = null;
    let sources: { url: string; name: string; snippet: string }[] = [];
    let researchTimeMs = 0;

    try {
      // Step 1: Web search for latest document requirements
      const searchQueries = buildPayerSearchQueries(
        drug?.name || drugId,
        drug?.generic || '',
        indication?.name || indicationId,
        payer?.name || payerId,
        'documents'
      );

      const research = await deepResearch(searchQueries);
      sources = research.sources;
      researchTimeMs = research.searchTimeMs;

      // Step 2: Build researched prompt
      const { system, user } = buildResearchedPrompt(
        'a Prior Authorization Document Specialist',
        research.context,
        kbContext,
        { name: drug?.name || drugId, generic: drug?.generic || '', mechanism: drug?.mechanism || '', route: drug?.route || '', jcode: drug?.jcode || '' },
        payer?.name || payerId,
        indication?.name || indicationId,
        `Generate a comprehensive document checklist for ${drug?.name} PA submission to ${payer?.name} for ${indication?.name}.

${patientBiomarkers !== 'No patient data available' ? `\nPatient Data:\n${patientBiomarkers}` : ''}

Consider:
1. Payer-specific document requirements (latest ${new Date().getFullYear()} criteria)
2. Required vs optional documents with rationale
3. Step therapy documentation (pharmacy fill records, prescription history)
4. Biomarker lab results needed (IgE, eosinophils, FeNO, PFTs)
5. Specialist prescriber documentation requirements
6. Clinical severity evidence (exacerbation history, ER visits, hospitalizations)
7. Common missing documents that cause denials for this payer

Respond in JSON format:
{
  "documents": [
    {
      "name": "Document name",
      "required": true/false,
      "rationale": "Why this document is needed (cite sources)",
      "priority": "high/medium/low",
      "payerSpecific": true/false
    }
  ],
  "summary": "Summary of key requirements",
  "tips": ["Actionable tips for strengthening this submission"],
  "warnings": ["Payer-specific warnings and common denial reasons"],
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
      }
    } catch (llmError) {
      console.error('Deep research/LLM failed, using KB-only result:', llmError);
    }

    return NextResponse.json({
      documents: docs,
      required,
      optional,
      totalDocs: docs.length,
      requiredCount: required.length,
      aiAnalysis,
      kbResult: {
        documents: docs,
        requiredCount: required.length,
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
