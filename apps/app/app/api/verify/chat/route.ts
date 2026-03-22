import { createOpenAI, generateText } from "@repo/ai";
import { NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VERIFICATION_SYSTEM_PROMPT = `You are an AI verification assistant for TimeLend, a personal commitment protocol where users stake money on completing tasks.

Your role is to:
1. Help users articulate their completion of the commitment
2. Ask clarifying questions about their work
3. Request additional evidence if needed
4. Guide them toward a successful verification

Be conversational, helpful, and encouraging. Ask questions like:
- "What specific work did you complete?"
- "Can you share any links or screenshots?"
- "How does this work demonstrate completion of your commitment?"

When the user is ready for verification, ask them to explicitly say "verify" or "I'm done" so you can provide the final verdict.

Consider:
1. **Effort**: Did the user put in genuine effort?
2. **Relevance**: Does the proof relate to the task description?
3. **Depth**: Is this surface-level work or did they go deeper?
4. **Completeness**: Did they fully complete what they promised?`;

const VERDICT_PROMPT = `You are an AI task auditor for TimeLend, a personal commitment protocol where users stake money on completing tasks.

Analyze the conversation and provide a final verification verdict.

Rate the quality on a scale of 0-100:
- 0-30: Minimal effort, likely just to pass
- 31-60: Adequate effort, some substance
- 61-80: Good effort, solid completion
- 81-100: Excellent effort, exceeded expectations

IMPORTANT: Return your response in this exact JSON format with NO additional text:
{
  "qualityScore": <0-100>,
  "verdict": "<Your detailed reasoning for the score>",
  "passed": <true if score >= 50, false otherwise>
}`;

const JSON_REGEX = /\{[\s\S]*\}/;

interface ChatMessage {
  content: string;
  role: "user" | "assistant";
}

export const POST = async (req: Request) => {
  try {
    const { commitmentId, taskDescription, messages, isVerificationRequest } =
      await req.json();

    if (!(commitmentId && taskDescription)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isVerificationRequest) {
      const conversationHistory = messages
        .map((m: ChatMessage) => `${m.role}: ${m.content}`)
        .join("\n");

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: VERDICT_PROMPT,
        prompt: `Task Description: ${taskDescription}\n\nConversation History:\n${conversationHistory}\n\nProvide your final verification verdict.`,
      });

      const jsonMatch = text.match(JSON_REGEX);

      if (!jsonMatch) {
        return NextResponse.json({
          response:
            "I'm having trouble analyzing your submission. Could you provide more details about what you accomplished?",
          verdict: null,
        });
      }

      try {
        const result = JSON.parse(jsonMatch[0]);
        const score = result.qualityScore ?? 50;
        const clampedScore = Math.min(100, Math.max(0, score));
        const passed = result.passed ?? clampedScore >= 50;

        return NextResponse.json({
          verdict:
            result.verdict ||
            `Verification ${passed ? "PASSED" : "FAILED"} with score ${clampedScore}/100`,
          auditResult: {
            qualityScore: clampedScore,
            passed,
            summary: result.verdict || `Score: ${clampedScore}/100`,
          },
        });
      } catch {
        return NextResponse.json({
          response:
            "I'm having trouble analyzing your submission. Could you provide more details about what you accomplished?",
          verdict: null,
        });
      }
    }

    const conversationHistory = messages
      .map((m: ChatMessage) => `${m.role}: ${m.content}`)
      .join("\n");

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: VERIFICATION_SYSTEM_PROMPT,
      prompt: `Task Description: ${taskDescription}\n\nConversation History:\n${conversationHistory}\n\nRespond to the user's latest message, helping them articulate their completion and gather evidence.`,
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat verification error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
};
