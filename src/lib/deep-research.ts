// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — Deep Research Utility
// Performs web searches before LLM analysis for verified, cited results
// Uses: openai SDK for LLM, configurable web search (Tavily/Serper/Bing/none)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { webSearch, isSearchConfigured, type SearchResult } from './web-search';

interface DeepResearchResult {
  sources: SearchResult[];
  context: string;
  searchTimeMs: number;
}

/**
 * Perform multiple web searches in parallel and return formatted context
 */
export async function deepResearch(queries: string[]): Promise<DeepResearchResult> {
  const start = Date.now();
  let allResults: SearchResult[] = [];

  if (isSearchConfigured()) {
    try {
      // Run all searches in parallel
      const searchPromises = queries.map(async (query) => {
        try {
          const results = await webSearch(query, 5);
          return results;
        } catch (err) {
          console.error(`Search failed for "${query}":`, err);
          return [] as SearchResult[];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      allResults = searchResults.flat();

      // Deduplicate by URL
      const seen = new Set<string>();
      allResults = allResults.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });
    } catch (err) {
      console.error('Deep research failed:', err);
    }
  } else {
    console.log(
      '[deep-research] No search provider configured. ' +
      'Set SEARCH_PROVIDER (tavily/serper/bing) and the corresponding API key in .env'
    );
  }

  const searchTimeMs = Date.now() - start;

  // Format search results as context for the LLM
  const context = allResults.length > 0
    ? `## Research Findings (from web search)\n\n${allResults
        .slice(0, 10) // Top 10 most relevant
        .map(
          (r, i) =>
            `### Source ${i + 1}: ${r.name}\nURL: ${r.url}\n${r.snippet}`
        )
        .join('\n\n')}`
    : 'No web search results available. Rely on knowledge base and clinical expertise.';

  return { sources: allResults.slice(0, 10), context, searchTimeMs };
}

/**
 * Build payer-specific search queries for PA criteria
 */
export function buildPayerSearchQueries(
  drugName: string,
  genericName: string,
  indication: string,
  payerName: string,
  feature: 'icd10' | 'documents' | 'gap-check' | 'appeal'
): string[] {
  const baseQueries: Record<string, string[]> = {
    icd10: [
      `${drugName} ${genericName} ${indication} prior authorization ICD-10 code requirements ${new Date().getFullYear()}`,
      `${payerName} ${drugName} prior authorization coverage criteria diagnosis codes`,
      `${genericName} FDA approved indications ICD-10 coding guidelines`,
    ],
    documents: [
      `${drugName} ${indication} prior authorization required documents checklist ${payerName}`,
      `${payerName} biologic prior authorization documentation requirements ${new Date().getFullYear()}`,
      `${genericName} prior authorization supporting clinical documents best practices`,
    ],
    'gap-check': [
      `${drugName} ${indication} prior authorization clinical criteria ${payerName} ${new Date().getFullYear()}`,
      `${payerName} biologic PA approval criteria biomarker thresholds step therapy`,
      `${genericName} ${indication} clinical guidelines GINA AAAAI approval requirements`,
    ],
    appeal: [
      `${drugName} prior authorization denial appeal success strategies ${payerName}`,
      `${genericName} PA denial appeal letter clinical evidence citations`,
      `${indication} biologic prior authorization appeal best practices guidelines ${new Date().getFullYear()}`,
    ],
  };

  return baseQueries[feature] || baseQueries['gap-check'];
}

/**
 * Build a comprehensive LLM prompt with research context
 */
export function buildResearchedPrompt(
  systemRole: string,
  researchContext: string,
  kbContext: string,
  drugInfo: { name: string; generic: string; mechanism: string; route: string; jcode: string },
  payerName: string,
  indication: string,
  userRequest: string
): { system: string; user: string } {
  const system = `You are ${systemRole} for the Maya PA Platform. You specialize in Allergy & Immunology biologic medications.

## CRITICAL INSTRUCTION
You MUST base your analysis on the research findings provided below. When you reference clinical data, payer policies, or guidelines, cite the specific source. If research findings conflict with general knowledge, prioritize the research findings as they are more current.

${researchContext}

## Internal Knowledge Base
${kbContext}

## Drug Information
- Brand: ${drugInfo.name}
- Generic: ${drugInfo.generic}
- Mechanism: ${drugInfo.mechanism}
- Route: ${drugInfo.route}
- J-Code: ${drugInfo.jcode}

## Payer: ${payerName}
## Indication: ${indication}

IMPORTANT: 
- Always cite specific sources from the research findings
- If research provides newer information than KB, use the research data
- Include specific clinical thresholds, criteria, and requirements
- Be precise about payer-specific differences
- Note any recent policy changes mentioned in research`;

  return { system, user: userRequest };
}
