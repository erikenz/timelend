import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AUDIT_PROMPT = `You are an AI task auditor for TimeLend, a personal commitment protocol where users stake money on completing tasks.

Your job is to analyze the submitted proof and rate the quality of the work done.

Consider:
1. **Effort**: Did the user put in genuine effort?
2. **Relevance**: Does the proof relate to the task description?
3. **Depth**: Is this surface-level work or did they go deeper?
4. **Completeness**: Did they fully complete what they promised?

Rate the quality on a scale of 0-100:
- 0-30: Minimal effort, likely just to pass
- 31-60: Adequate effort, some substance
- 61-80: Good effort, solid completion
- 81-100: Excellent effort, exceeded expectations

Provide a JSON response with this exact structure:
{
  "qualityScore": <0-100>,
  "effortAnalysis": "<detailed analysis of effort invested>",
  "summary": "<brief summary of your assessment>",
  "passed": <true if score >= 50, false otherwise>,
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

const JSON_REGEX = /\{[\s\S]*\}/;

export interface AuditInput {
  commitmentId: string;
  proofContent: string;
  taskDescription: string;
}

export interface AuditResult {
  effortAnalysis: string;
  passed: boolean;
  qualityScore: number;
  recommendations: string[];
  summary: string;
}

export async function auditTask(input: AuditInput): Promise<AuditResult> {
  const { taskDescription, proofContent } = input;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: AUDIT_PROMPT,
    prompt: `Task Description: ${taskDescription}\n\nSubmitted Proof:\n${proofContent}`,
  });

  const jsonMatch = text.match(JSON_REGEX);

  if (!jsonMatch) {
    return {
      qualityScore: 50,
      effortAnalysis: "Unable to parse AI response",
      summary: "Defaulting to passing score",
      passed: true,
      recommendations: ["Please provide clearer proof next time"],
    };
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as {
      qualityScore?: number;
      effortAnalysis?: string;
      summary?: string;
      passed?: boolean;
      recommendations?: string[];
    };
    const score = result.qualityScore ?? 50;
    const clampedScore = Math.min(100, Math.max(0, score));
    const passed = result.passed ?? clampedScore >= 50;

    return {
      qualityScore: clampedScore,
      effortAnalysis: result.effortAnalysis ?? "No analysis provided",
      summary: result.summary ?? "Assessment complete",
      passed,
      recommendations: result.recommendations ?? [],
    };
  } catch {
    return {
      qualityScore: 50,
      effortAnalysis: "Failed to parse AI response",
      summary: "Defaulting to passing score",
      passed: true,
      recommendations: ["Please provide clearer proof next time"],
    };
  }
}

export function generateAuditSummary(result: AuditResult): string {
  const { qualityScore, summary, recommendations } = result;

  let emoji = "❌";
  if (qualityScore >= 80) {
    emoji = "🌟";
  } else if (qualityScore >= 60) {
    emoji = "✅";
  } else if (qualityScore >= 40) {
    emoji = "⚠️";
  }

  let report = `${emoji} Quality Score: ${qualityScore}/100\n\n`;
  report += `**Summary:** ${summary}\n\n`;

  if (recommendations.length > 0) {
    report += "**Recommendations:**\n";
    for (const rec of recommendations) {
      report += `- ${rec}\n`;
    }
  }

  return report;
}
