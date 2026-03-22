import { createGoogleGenerativeAI, streamText } from "@repo/ai";
import { NextResponse } from "next/server";
import { env } from "@/env";

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

const VERIFICATION_PROMPT = `You are an AI task auditor for TimeLend, a personal commitment protocol where users stake money on completing tasks.

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

After your analysis, provide your final verdict in this exact JSON format:
{
  "qualityScore": <0-100>,
  "passed": <true if score >= 50, false otherwise>
}`;

export const POST = async (req: Request) => {
  try {
    const { commitmentId, proofContent, taskDescription } = await req.json();

    if (!(commitmentId && proofContent && taskDescription)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: VERIFICATION_PROMPT,
      prompt: `Task Description: ${taskDescription}\n\nSubmitted Proof:\n${proofContent}`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
};
