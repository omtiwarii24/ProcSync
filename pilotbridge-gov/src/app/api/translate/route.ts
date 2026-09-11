import { NextRequest, NextResponse } from "next/server";
import { generateJSON, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface TranslateRequest {
  strings: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateRequest;
    const strings = (body.strings || [])
      .filter((s) => typeof s === "string" && s.trim().length > 0 && s.length <= 500)
      .slice(0, 40);

    if (!strings.length) {
      return NextResponse.json({ translations: [] });
    }

    const numbered = strings.map((s, i) => `${i}: ${s.trim()}`).join("\n");

    const result = await generateJSON<{ translations: string[] }>(`
Translate each numbered English UI string to Hindi (Devanagari script) for an Indian government procurement portal.

RULES:
- Keep the same numbering order and return exactly ${strings.length} items.
- Preserve technical IDs, codes, proper nouns, and product names (ProcSync, MSInS, DPIIT, COEP, GFR, TRL, SCADA, NRW, KPI, SHA-256, RBAC, PMC, NMC, SBI, APMC etc.), numbers, currency (₹), and units EXACTLY as-is.
- Translate common UI terms naturally: "Sign in" → "साइन इन", "Dashboard" → "डैशबोर्ड", "Search" → "खोजें", "Submit" → "जमा करें", "Challenges" → "चुनौतियाँ".
- If a string is already Hindi or contains no translatable words, return it unchanged.

STRINGS:
${numbered}

Return JSON: { "translations": [ "..." ] } with exactly ${strings.length} items in the same order.
`);

    if (
      !Array.isArray(result.translations) ||
      result.translations.length !== strings.length
    ) {
      return NextResponse.json(
        { error: "Translation count mismatch" },
        { status: 502 }
      );
    }

    return NextResponse.json({ translations: result.translations });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
