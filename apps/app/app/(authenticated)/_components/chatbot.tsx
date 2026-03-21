"use client";

import { Message } from "@repo/ai/components/message";
import { Thread } from "@repo/ai/components/thread";
import { useChat } from "@repo/ai/lib/react";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { handleError } from "@repo/design-system/lib/error";
import { SendIcon } from "lucide-react";

export const Chatbot = () => {
  const { messages, input, handleInputChange, isLoading, handleSubmit } =
    useChat({
      onError: handleError,
      api: "/api/chat",
    });
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
          onChange={handleInputChange}
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
