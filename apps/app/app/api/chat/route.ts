import {
  convertToModelMessages,
  createOpenAI,
  streamText,
  type UIMessage,
} from "@repo/ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log("🤖 Chat request received.");

  console.log("🤖 Generating response...");
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });

  console.log("🤖 Streaming response...");
  return result.toUIMessageStreamResponse();
};
