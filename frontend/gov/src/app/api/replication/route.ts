import { NextRequest, NextResponse } from "next/server";
import { generateJSON, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface ReplicationRequest {
  sourcePilotId: string;
  targetDepartment: string;
  targetLocation: string;
  targetProblem: string;
}

interface ReplicationResponse {
  overallTransferability: number;
  radarScores: {
    problemSimilarity: number;
    techCompatibility: number;
    infrastructureFit: number;
    dataGisFit: number;
    terrainSoilFit: number;
  };
  reusableAsIs: { title: string; description: string; provenMetric: string }[];
  mustRevalidateLocally: { title: string; reason: string; testingProtocol: string }[];
  failureAlert: {
    pilotId: string;
    department: string;
    technology: string;
    cause: string;
    directive: string;
  };
  prescriptiveRecommendation: {
    action: string;
    duration: string;
    budget: string;
    daysSaved: number;
    fundsPreserved: string;
  };
}

const REGISTRY_CONTEXT = `
FINALIZED PASSPORT REGISTRY:
1. PMC-WTR-2025-01 — Pune Municipal Corporation — Sub-Surface Acoustic Leak Detection on 120km water grid.
   AcoustiLeak Sensors Pvt Ltd. 24% NRW reduction, 1.14m localization precision vs 8m manual, MTTR 48h → 3.8h.
   Terrain: black cotton soil, 3.5 Bar pressure. Unit rate ₹28,000/km. Edge-AI noise filter, CERT-In cloud custody, GIS pipeline.
2. GAD-DRN-2024-03 — Tribal Development & Rural Water Division, Gadchiroli — Cloud drone inspection. FAILED due to
   4G dependency in 0-bar canopy areas. Directive: edge-storage/offline buffering for rural IoT.
`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReplicationRequest;

    if (!body.sourcePilotId || !body.targetProblem) {
      return NextResponse.json(
        { error: "sourcePilotId and targetProblem are required" },
        { status: 400 }
      );
    }

    const prompt = `Analyze replicating a finalized government pilot Evidence Passport to a new department/location (the MSInS Replication Workbench).

SOURCE PILOT: ${body.sourcePilotId}
TARGET DEPARTMENT: ${body.targetDepartment || "Not specified"}
TARGET LOCATION: ${body.targetLocation || "Not specified"}
TARGET PROBLEM: ${body.targetProblem}

${REGISTRY_CONTEXT}

TASK: Score the 5-dimension context match, split what can be reused as-is vs what must be locally revalidated, surface any relevant failure memory, and prescribe a follow-up pilot shape.

Return JSON with exactly these fields:
{
  "overallTransferability": number (0-100),
  "radarScores": { "problemSimilarity": number(0-100), "techCompatibility": number(0-100), "infrastructureFit": number(0-100), "dataGisFit": number(0-100), "terrainSoilFit": number(0-100) },
  "reusableAsIs": [ { "title": string, "description": string, "provenMetric": string } ] (3-4 items: algorithms, certificates, benchmarks, pipelines that transfer directly),
  "mustRevalidateLocally": [ { "title": string, "reason": string (terrain/pressure/infrastructure difference), "testingProtocol": string (concrete local test) } ] (1-3 items),
  "failureAlert": { "pilotId": string (a relevant historical failed pilot from the registry or "N/A"), "department": string, "technology": string, "cause": string, "directive": string (mandatory safeguard) },
  "prescriptiveRecommendation": { "action": string (e.g. "ADAPTED 25-DAY FAST-TRACK PILOT"), "duration": string, "budget": string (₹ figure with savings note), "daysSaved": number, "fundsPreserved": string (₹ figure) }
}`;

    const result = await generateJSON<ReplicationResponse>(prompt);
    return NextResponse.json({ source: "gemini", result });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal server error during replication analysis" },
      { status: 500 }
    );
  }
}
