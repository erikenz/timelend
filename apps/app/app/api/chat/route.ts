import { convertToModelMessages, streamText, type UIMessage } from "@repo/ai";
import { models } from "@repo/ai/lib/models";

export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log("🤖 Chat request received.");

  console.log("🤖 Generating response...");
  const result = streamText({
    model: models.chat,
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });

  console.log("🤖 Streaming response...");
  return result.toUIMessageStreamResponse();
};
