"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { handleError } from "@repo/design-system/lib/error";
import { CheckCircle2, Paperclip, SendIcon, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export interface VerificationMessage {
  attachments?: File[];
  content: string;
  id: string;
  role: "user" | "assistant";
}

export interface AuditResult {
  effortAnalysis: string;
  passed: boolean;
  qualityScore: number;
  recommendations: string[];
  summary: string;
}

export interface VerificationChatProps {
  apiEndpoint?: string;
  commitmentId: string;
  initialMessage?: string;
  onVerificationComplete?: (result: AuditResult) => void;
  taskDescription: string;
}

export function VerificationChat({
  apiEndpoint = "/api/verify/chat",
  taskDescription,
  commitmentId,
  onVerificationComplete,
}: VerificationChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<VerificationMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI verification assistant. I'll help you verify that you've completed your commitment.

**Task to verify:** ${taskDescription}

You can:
- Describe what you've accomplished
- Share links to completed work
- Upload documents (PDF, DOC, TXT)
- Ask me questions about what counts as evidence

When you're ready, type "verify" or click the Verify button to get your final verification result.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileIdCounter = useRef(0);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      const validFiles = files.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          return false;
        }
        if (
          !ALLOWED_FILE_TYPES.includes(
            file.type as (typeof ALLOWED_FILE_TYPES)[number]
          )
        ) {
          toast.error(
            `${file.name}: Only PDF, DOC, DOCX, and TXT files are supported`
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        const filesWithIds = validFiles.map((file) => ({
          ...file,
          id: `file-${++fileIdCounter.current}-${Date.now()}`,
        }));
        setAttachments((prev) => [...prev, ...filesWithIds]);
        toast.success(`${validFiles.length} file(s) attached`);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) =>
      prev.filter((f) => (f as File & { id: string }).id !== id)
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() && attachments.length === 0) {
        return;
      }

      const userMessage: VerificationMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text || "See attached files",
        attachments: [...attachments],
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setAttachments([]);
      setIsLoading(true);

      const isVerifyRequest =
        text.toLowerCase().includes("verify") ||
        text.toLowerCase().includes("done") ||
        text.toLowerCase().includes("complete");

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commitmentId,
            taskDescription,
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            isVerificationRequest: isVerifyRequest,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        if (data.verdict) {
          const assistantMessage: VerificationMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.verdict,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (data.auditResult) {
            onVerificationComplete?.(data.auditResult);
          }
        } else {
          const assistantMessage: VerificationMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        handleError(err);
        const errorMessage: VerificationMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process your message. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      attachments,
      apiEndpoint,
      commitmentId,
      messages,
      onVerificationComplete,
      taskDescription,
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) {
      return;
    }
    sendMessage(input);
  };

  const handleVerify = () => {
    sendMessage("Please verify my work. I've described my completion above.");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex h-[400px] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={message.id}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((file) => (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-black/10 px-2 py-1 text-xs"
                        key={`${message.id}-${file.name}`}
                      >
                        <Paperclip className="h-3 w-3" />
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-muted px-4 py-2">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => {
            const fileId = (file as File & { id: string }).id;
            return (
              <div
                className="inline-flex items-center gap-2 rounded-lg border bg-muted px-3 py-1 text-sm"
                key={fileId}
              >
                <Paperclip className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeAttachment(fileId)}
                  type="button"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          id="chat-file-upload"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          className="flex-1"
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your progress or ask questions..."
          value={input}
        />
        <Button disabled={isLoading} size="icon" type="submit">
          <SendIcon className="h-4 w-4" />
        </Button>
        <Button
          disabled={isLoading}
          onClick={handleVerify}
          type="button"
          variant="secondary"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Verify
        </Button>
      </form>
    </div>
  );
}
