import { z } from "zod";

export const verificationSchema = z.object({
  proofContent: z.string().min(1, "At least one field is required"),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ].includes(file.type),
      "Only PDF, DOC, DOCX, and TXT files are allowed"
    )
    .optional(),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;

export interface VerificationState {
  auditResult: import("@repo/ai").AuditResult | null;
  error: string | null;
  status: "idle" | "submitting" | "verifying" | "success" | "failed" | "error";
}
