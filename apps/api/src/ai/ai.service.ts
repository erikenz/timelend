import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import type {
  ProofPayload,
  ProofVerdict,
} from "../commitments/commitment.types";
import {
  getGeminiApiKey,
  getGeminiModel,
  getGeminiTimeoutMs,
} from "../config/env";

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiCandidatePart[];
  };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MAX_OUTPUT_TOKENS = 32;
const VERDICT_PATTERN = /\b(PASS|FAIL)\b/i;
const STRICT_VERDICT_INSTRUCTIONS = [
  "You are the TimeLend proof verifier.",
  "Read the task description and submitted proof.",
  "Return PASS only when the proof clearly and directly shows the task was completed.",
  "Return FAIL when the proof is missing, weak, contradictory, or unrelated.",
  'Your response must be exactly one uppercase word: "PASS" or "FAIL".',
  "Do not add explanations.",
  "Do not add punctuation.",
  "Do not add markdown.",
];

const buildPrompt = (
  taskDescription: string,
  proofText: string | null,
  retryAttempt: boolean
) => {
  const sections = [
    ...STRICT_VERDICT_INSTRUCTIONS,
    "",
    `Task description: ${taskDescription}`,
    proofText ? `Proof note: ${proofText}` : "Proof note: none provided",
  ];

  if (retryAttempt) {
    sections.unshift(
      'Your previous reply was invalid. Reply with exactly "PASS" or "FAIL".'
    );
  }

  return sections.join("\n");
};

const extractVerdict = (payload: GeminiResponse): ProofVerdict | null => {
  const candidateText = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!candidateText) {
    return null;
  }

  const match = VERDICT_PATTERN.exec(candidateText.toUpperCase());

  return match?.[1] === "PASS" || match?.[1] === "FAIL" ? match[1] : null;
};

@Injectable()
export class AiService {
  isConfigured() {
    return Boolean(getGeminiApiKey());
  }

  private async requestVerdict(
    apiKey: string,
    taskDescription: string,
    proof: ProofPayload,
    retryAttempt: boolean
  ) {
    const response = await fetch(
      `${GEMINI_API_BASE_URL}/${getGeminiModel()}:generateContent?key=${apiKey}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildPrompt(taskDescription, proof.text, retryAttempt),
                },
                ...(proof.attachment
                  ? [
                      {
                        inlineData: {
                          data: proof.attachment.base64Data,
                          mimeType: proof.attachment.mimeType,
                        },
                      },
                    ]
                  : []),
              ],
              role: "user",
            },
          ],
          generationConfig: {
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            temperature: 0,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(getGeminiTimeoutMs()),
      }
    ).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Gemini request failed";

      throw new BadGatewayException(`Gemini request failed: ${message}`);
    });

    const payload = (await response
      .json()
      .catch(() => null)) as GeminiResponse | null;

    if (!response.ok) {
      throw new BadGatewayException(
        payload?.error?.message
          ? `Gemini request failed: ${payload.error.message}`
          : "Gemini request failed"
      );
    }

    return payload;
  }

  async evaluateProof(
    taskDescription: string,
    proof: ProofPayload
  ): Promise<ProofVerdict> {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Missing Gemini API key configuration"
      );
    }

    const initialPayload = await this.requestVerdict(
      apiKey,
      taskDescription,
      proof,
      false
    );
    const initialVerdict = initialPayload
      ? extractVerdict(initialPayload)
      : null;

    if (initialVerdict) {
      return initialVerdict;
    }

    const retryPayload = await this.requestVerdict(
      apiKey,
      taskDescription,
      proof,
      true
    );
    const retryVerdict = retryPayload ? extractVerdict(retryPayload) : null;

    if (!retryVerdict) {
      throw new BadGatewayException("Gemini returned an invalid verdict");
    }

    return retryVerdict;
  }
}
