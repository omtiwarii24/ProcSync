import { NextRequest, NextResponse } from "next/server";
import { generateJSON, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface EvidenceExtractionRequest {
  milestoneId: string;
  fileType: "acoustic" | "gps" | "scada" | "calibration";
  fileName: string;
  fileSummary: string;
  departmentBaseline?: string;
}

interface ExtractedMetric {
  metric: string;
  baseline: string;
  observed: string;
  delta: string;
  deltaDirection: "improvement" | "regression" | "neutral";
  confidence: number;
  verificationMethod: string;
}

interface EvidenceExtractionResponse {
  metrics: ExtractedMetric[];
  overallConfidence: number;
  anomalyScreening: string;
  evaluatorNote: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvidenceExtractionRequest;

    if (!body.fileSummary || body.fileSummary.trim().length < 10) {
      return NextResponse.json(
        { error: "fileSummary is required — describe the telemetry contents (min 10 characters)" },
        { status: 400 }
      );
    }

    const prompt = `You are the AI Evidence Extraction engine for a startup pilot milestone submission on the ProcSync platform. A DPIIT-recognized startup has uploaded field telemetry. Extract verifiable outcome metrics.

SUBMISSION:
- Milestone: ${body.milestoneId}
- Artifact Type: ${body.fileType}
- File Name: ${body.fileName || "not specified"}
- Telemetry Summary (provided by uploader): ${body.fileSummary}
- Department Baseline (to compare against): ${body.departmentBaseline || "Standard municipal water-grid baselines (localization error ~8m manual excavation, NRW ~35%, MTTR ~48h)"}

TASK: Compute before/after outcome deltas with realistic statistical confidence scores, run a hypothetical integrity/anomaly screen on the described data, and draft a note for the independent academic evaluator (COEP).

Return JSON with exactly these fields:
{
  "metrics": [ { "metric": string, "baseline": string, "observed": string, "delta": string (e.g. "+78% Precision" or "-48.3% Relative Loss"), "deltaDirection": "improvement"|"regression"|"neutral", "confidence": number (90-99.9 realistic statistical confidence), "verificationMethod": string (how this was/can be verified) } ] (3-5 metrics),
  "overallConfidence": number (weighted statistical confidence, 90-99.9),
  "anomalyScreening": string (2-3 sentences on spectral cross-correlation, clock drift sync, tamper screening findings),
  "evaluatorNote": string (2-3 sentences addressed to the COEP academic validator recommending what to spot-check)
}`;

    const result = await generateJSON<EvidenceExtractionResponse>(prompt);
    return NextResponse.json({ source: "gemini", result });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error during evidence extraction" },
      { status: 500 }
    );
  }
}
