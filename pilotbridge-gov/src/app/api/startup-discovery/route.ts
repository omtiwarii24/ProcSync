import { NextRequest, NextResponse } from "next/server";
import { generateJSON, GeminiError } from "@/lib/gemini";
import { maharashtraStartupRegistry } from "@/data/startupRegistry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DiscoveryRequest {
  problemStatement: string;
  department?: string;
  sector?: string;
  location?: string;
  targetOutcome?: string;
}

interface DiscoveredStartup {
  name: string;
  website: string;
  source: string;
  sector: string;
  relevance: number;
  reason: string;
  dpiitLikely: boolean;
}

interface QueryPlan {
  queries: string[];
}

interface ScrapeResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * Scrapes DuckDuckGo's HTML endpoint for search results (no API key needed).
 * Returns [] on any failure so the registry fallback still works.
 */
async function searchWeb(query: string, maxResults = 8): Promise<ScrapeResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "b=&kl=in-en",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const results: ScrapeResult[] = [];
    const linkRegex = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    const links: { url: string; title: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null && links.length < maxResults * 2) {
      const uddg = m[1].match(/uddg=([^&]+)/);
      const realUrl = uddg ? decodeURIComponent(uddg[1]) : m[1];
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (realUrl && title) links.push({ url: realUrl, title });
    }

    const snippets: string[] = [];
    while ((m = snippetRegex.exec(html)) !== null && snippets.length < maxResults * 2) {
      snippets.push(m[1].replace(/<[^>]+>/g, "").trim());
    }

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || "",
        source: new URL(links[i].url).hostname.replace("www.", ""),
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DiscoveryRequest;

    if (!body.problemStatement || body.problemStatement.trim().length < 10) {
      return NextResponse.json(
        { error: "problemStatement is required (min 10 characters)" },
        { status: 400 }
      );
    }

    // Step 1: AI generates targeted search queries
    const queryPlan = await generateJSON<QueryPlan>(`
A government department is publishing an innovation procurement challenge and wants to discover relevant Indian startups through their online presence.

CHALLENGE:
- Problem: ${body.problemStatement}
- Department: ${body.department || "Not specified"}
- Sector: ${body.sector || "Not specified"}
- Location: ${body.location || "Maharashtra, India"}
- Target Outcome: ${body.targetOutcome || "Not specified"}

TASK: Generate 4 precise web search queries (each under 60 characters) that would surface Indian startups working on this exact problem. Include terms like "startup", "India", the core technology domain, and the problem area.

Return JSON: { "queries": string[4] }
`);

    // Step 2: Scrape the web for each query (in parallel)
    const scrapePromises = queryPlan.queries.slice(0, 4).map((q) => searchWeb(q));
    const scrapeBatches = await Promise.all(scrapePromises);
    const allResults = scrapeBatches.flat();

    // Step 3: AI filters & ranks scraped findings + the state registry together
    const registryContext = maharashtraStartupRegistry
      .map((s) => `${s.name} (${s.dpiitId}, ${s.city}) :: ${s.sector} :: ${s.website} :: ${s.focusTags.join(", ")}`)
      .join("\n");

    const webFindings = allResults
      .map((r) => `[${r.source}] ${r.title} :: ${r.snippet} :: ${r.url}`)
      .join("\n")
      .slice(0, 10000);

    const ranked = await generateJSON<{ startups: DiscoveredStartup[] }>(`
The government challenge is: ${body.problemStatement} (Sector: ${body.sector || "unspecified"}, Location: ${body.location || "Maharashtra"})

SOURCE A — MAHARASHTRA STATE STARTUP REGISTRY (verified DPIIT-recognized ventures):
${registryContext}

SOURCE B — LIVE WEB SCAN FINDINGS (scraped from public sources; may include unverified entities):
${webFindings || "(web scan unavailable this run)"}

TASK: Identify the best-matching startups for this challenge from BOTH sources combined. Registry entries are pre-verified (mark dpiitLikely=true); web findings must be assessed for whether they are genuine Indian startups. Discard directories, news portals, and generic pages. Score each entry's relevance to the challenge 0-100.

Return JSON: { "startups": [ { "name": string, "website": string, "source": string ("State Registry" or the domain where found), "sector": string, "relevance": number, "reason": string (1 sentence why they fit), "dpiitLikely": boolean } ] }
Return 5-8 of the best matches, sorted by relevance descending.`);

    return NextResponse.json({
      source: "registry+web+gemini",
      result: {
        startups: ranked.startups || [],
        queriesRun: queryPlan.queries,
        pagesScanned: allResults.length,
        registrySize: maharashtraStartupRegistry.length,
      },
    });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error during startup discovery" },
      { status: 500 }
    );
  }
}
