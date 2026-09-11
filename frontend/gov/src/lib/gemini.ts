// Shared Gemini API client for ProcSync AI features (server-side only)
// Uses GEMINI_API_KEY from .env — never exposed to the browser

export interface GeminiPart {
  text: string;
}

export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: GeminiPart[];
    };
  }[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class GeminiError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY is not configured. Add it to the .env file.",
      500
    );
  }
  return key;
}

/**
 * Calls the Gemini generateContent endpoint with a text prompt.
 * Returns the raw text response.
 */
export async function generateText(
  prompt: string,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const apiKey = getApiKey();
  const model = DEFAULT_MODEL;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
  };

  // Retry on transient errors: 429 (rate limit) and 503 (overloaded).
  const MAX_ATTEMPTS = 3;
  const RETRYABLE_STATUSES = new Set([429, 503]);
  let response: GeminiResponse | null = null;
  let lastError: GeminiError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      response = (await res.json()) as GeminiResponse;
      if (!res.ok) {
        lastError = new GeminiError(
          response.error?.message || `Gemini API returned ${res.status}`,
          res.status
        );
        if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS) {
          // Exponential backoff: 1.5s, 3s
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        throw lastError;
      }
      break;
    } catch (err) {
      if (err instanceof GeminiError) {
        if (RETRYABLE_STATUSES.has(err.status) && attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        throw err;
      }
      throw new GeminiError(
        `Failed to reach Gemini API: ${err instanceof Error ? err.message : String(err)}`,
        502
      );
    }
  }

  if (!response) {
    throw lastError ?? new GeminiError("Gemini request failed", 502);
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiError("Gemini returned an empty response", 502);
  }
  return text;
}

/**
 * Calls Gemini and parses a JSON object from its response.
 * Instructs the model to return strict JSON; strips markdown fences.
 */
export async function generateJSON<T>(
  prompt: string,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<T> {
  const systemInstruction =
    "You are a precise data-extraction assistant for the Maharashtra State Innovation Society (MSInS) ProcSync platform. " +
    "Respond ONLY with a valid JSON object. No markdown fences, no commentary, no trailing commas.";

  const fullPrompt = `${systemInstruction}\n\n${prompt}`;
  const raw = await generateText(fullPrompt, {
    temperature: options.temperature ?? 0.1,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  });

  // Strip markdown code fences if the model added them despite instructions
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to salvage the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // fall through
      }
    }
    // Attempt to repair truncated JSON: cut at the last complete array item / object and close brackets
    const lastComplete = cleaned.lastIndexOf("},");
    if (lastComplete > 0) {
      const salvaged = cleaned.substring(0, lastComplete + 1) + "]}";
      try {
        return JSON.parse(salvaged) as T;
      } catch {
        // fall through
      }
    }
    throw new GeminiError("Gemini returned malformed JSON", 502);
  }
}
