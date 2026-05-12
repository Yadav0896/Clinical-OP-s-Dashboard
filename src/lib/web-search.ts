// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — Web Search Utility
// Configurable search provider: Tavily, Serper, Apify, Bing, or fallback (no-op)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SearchResult {
  url: string;
  name: string;
  snippet: string;
}

type SearchProvider = 'tavily' | 'serper' | 'apify' | 'bing' | 'none';

function getProvider(): SearchProvider {
  const env = (process.env.SEARCH_PROVIDER || 'none').toLowerCase() as SearchProvider;
  if (['tavily', 'serper', 'apify', 'bing', 'none'].includes(env)) return env;
  return 'none';
}

/**
 * Search the web using the configured provider.
 * Falls back to empty results gracefully if no provider is configured.
 */
export async function webSearch(
  query: string,
  numResults: number = 5
): Promise<SearchResult[]> {
  const provider = getProvider();

  try {
    switch (provider) {
      case 'tavily':
        return await tavilySearch(query, numResults);
      case 'serper':
        return await serperSearch(query, numResults);
      case 'apify':
        return await apifySearch(query, numResults);
      case 'bing':
        return await bingSearch(query, numResults);
      case 'none':
      default:
        return [];
    }
  } catch (err) {
    console.error(`Web search (${provider}) failed for "${query}":`, err);
    return [];
  }
}

// ── Tavily (https://tavily.com) — AI search API ──
async function tavilySearch(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('TAVILY_API_KEY not set, skipping search');
    return [];
  }

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      max_results: numResults,
      include_answer: false,
      api_key: apiKey,
    }),
  });

  if (!res.ok) throw new Error(`Tavily API error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map(
    (r: { url: string; title: string; content: string }) => ({
      url: r.url,
      name: r.title,
      snippet: r.content,
    })
  );
}

// ── Apify (https://apify.com) — Google Search Results Scraper ──
async function apifySearch(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    console.warn('APIFY_API_KEY not set, skipping search');
    return [];
  }

  // Use Apify's Google Search Results Scraper actor
  // Actor ID: apify/google-search-scraper
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [query],
        maxResults: numResults,
      }),
    }
  );

  if (!res.ok) throw new Error(`Apify API error: ${res.status}`);
  const data = await res.json();

  // Apify returns results grouped by query
  const results = data?.output?.[query] || [];
  return results
    .slice(0, numResults)
    .map(
      (r: { url?: string; title?: string; description?: string; link?: string; snippet?: string }) => ({
        url: r.url || r.link || '',
        name: r.title || '',
        snippet: r.description || r.snippet || '',
      })
    );
}

// ── Serper (https://serper.dev) — Google Search API ──
async function serperSearch(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn('SERPER_API_KEY not set, skipping search');
    return [];
  }

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
    }),
  });

  if (!res.ok) throw new Error(`Serper API error: ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map(
    (r: { link: string; title: string; snippet: string }) => ({
      url: r.link,
      name: r.title,
      snippet: r.snippet,
    })
  );
}

// ── Bing Web Search API (Azure) ──
async function bingSearch(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn('BING_SEARCH_API_KEY not set, skipping search');
    return [];
  }

  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${numResults}`,
    {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    }
  );

  if (!res.ok) throw new Error(`Bing API error: ${res.status}`);
  const data = await res.json();
  return (data.webPages?.value || []).map(
    (r: { url: string; name: string; snippet: string }) => ({
      url: r.url,
      name: r.name,
      snippet: r.snippet,
    })
  );
}

/**
 * Check if web search is configured and available
 */
export function isSearchConfigured(): boolean {
  const provider = getProvider();
  if (provider === 'none') return false;
  const keyMap: Record<string, string> = {
    tavily: 'TAVILY_API_KEY',
    serper: 'SERPER_API_KEY',
    apify: 'APIFY_API_KEY',
    bing: 'BING_SEARCH_API_KEY',
  };
  return !!process.env[keyMap[provider]];
}
