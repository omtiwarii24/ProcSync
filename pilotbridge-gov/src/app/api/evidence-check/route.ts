import { NextRequest, NextResponse } from "next/server";
import { generateJSON, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface EvidenceMatchRequest {
  problemStatement: string;
  department?: string;
  location?: string;
  baselineMetric?: string;
}

interface EvidenceMatchResponse {
  matchFound: boolean;
  confidence: number;
  matchedPilotId: string;
  matchedDepartment: string;
  matchedTitle: string;
  matchedSummary: string;
  provenOutcome: string;
  potentialSavingsInr: string;
  recommendation: string;
  reasoning: string;
}

// Registry context: finalized Evidence Passports available in the Maharashtra registry
const REGISTRY_CONTEXT = `
AVAILABLE FINALIZED EVIDENCE PASSPORTS (Maharashtra Registry):
1. PMC-WTR-2025-01 — Pune Municipal Corporation — Sub-Surface Acoustic Leak Detection (120km Water Grid Benchmark).
   Startup: AcoustiLeak Sensors Pvt Ltd (DPIIT DIPP99421). Outcome: 24% NRW reduction across hard basalt geology,
   verified by COEP academic audit over a 90-day sandbox trial. Unit rate ₹28,000/km. TRL 7.
2. GAD-DRN-2024-03 — Tribal Development & Rural Water Division, Gadchiroli — Continuous Cloud Video Streaming Drone Inspection.
   Outcome: FAILED — mandated continuous 4G live streaming; dense tree canopy and 0-bar GSM coverage caused
   connection dropouts and telemetry loss. Directive: mandate edge-storage/offline buffering for rural IoT pilots.
`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvidenceMatchRequest;

    if (!body.problemStatement || body.problemStatement.trim().length < 10) {
      return NextResponse.json(
        { error: "problemStatement is required (min 10 characters)" },
        { status: 400 }
      );
    }

    const prompt = `A government department is about to publish a new innovation procurement challenge. Check it against the registry of finalized Evidence Passports to prevent duplicate pilot spend (the "Zero-Duplication Engine").

NEW CHALLENGE:
- Problem Statement: ${body.problemStatement}
- Department: ${body.department || "Not specified"}
- Location: ${body.location || "Not specified"}
- Baseline Metric: ${body.baselineMetric || "Not specified"}

${REGISTRY_CONTEXT}

TASK: Determine whether an existing passport matches this new challenge closely enough that the department should reuse its evidence instead of re-piloting from scratch. Consider problem similarity, technology applicability, and terrain/infrastructure context.

Return JSON with exactly these fields:
{
  "matchFound": boolean,
  "confidence": number (0-100 context match score),
  "matchedPilotId": string (registry ID of closest match, "" if none),
  "matchedDepartment": string,
  "matchedTitle": string,
  "matchedSummary": string (1-2 sentence plain-language summary of what the matched pilot proved),
  "provenOutcome": string (the audited outcome delta, e.g. "24% NRW reduction"),
  "potentialSavingsInr": string (estimated savings if evidence is reused, e.g. "₹11,00,000"),
  "recommendation": string (one of "REUSE_EVIDENCE", "ADAPTED_FAST_TRACK", "NEW_PILOT_REQUIRED"),
  "reasoning": string (2-3 sentences explaining the match or the rejection)
}`;

    const result = await generateJSON<EvidenceMatchResponse>(prompt);
    return NextResponse.json({ source: "gemini", result });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error during evidence check" },
      { status: 500 }
    );
  }
}
