"use client";

import { DefaultChatTransport, useChat } from "@repo/ai";
import { Message } from "@repo/ai/components/message";
import { Thread } from "@repo/ai/components/thread";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { handleError } from "@repo/design-system/lib/error";
import { SendIcon } from "lucide-react";
import { useState } from "react";

export const Chatbot = () => {
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: handleError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }

    sendMessage({ text: input });
    setInput("");
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-64px-16px)] flex-col divide-y overflow-hidden">
      <Thread>
        {messages.map((message) => (
          <Message data={message} key={message.id} />
        ))}
      </Thread>
      <form
        aria-disabled={isLoading}
        className="flex shrink-0 items-center gap-2 px-8 py-4"
        onSubmit={handleSubmit}
      >
        <Input
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question!"
          value={input}
        />
        <Button disabled={isLoading} size="icon" type="submit">
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
