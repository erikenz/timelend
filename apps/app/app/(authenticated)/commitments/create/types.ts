import { z } from "zod";

/**
 * Shared types for the Create Commitment flow.
 *
 * Exported so both the page and the presentational components can import a
 * single source of truth for validation and the form data type.
 */

/** Simple hex Ethereum address regexp used in the form schema */
export const HEX_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Zod schema for the commitment creation form.
 *
 * - `verifier` and `penaltyReceiver` may be empty in the UI; the page
 *   code will fallback to the connected account when necessary.
 */
export const commitmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 day"),
  verifier: z
    .string()
    .regex(HEX_ADDRESS_RE, "Invalid Ethereum address")
    .or(z.literal("")),
  penaltyReceiver: z
    .string()
    .regex(HEX_ADDRESS_RE, "Invalid Ethereum address")
    .or(z.literal("")),
  stakeAmount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount"),
});

/** Inferred TypeScript type for the form values */
export type CommitmentFormData = z.infer<typeof commitmentSchema>;
