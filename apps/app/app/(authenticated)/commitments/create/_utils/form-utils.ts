/**
 * Form utilities for the Create Commitment flow.
 *
 * Exported helpers:
 * - extractFieldErrors: convert ZodError into a simple map of field -> messages[]
 * - validateForm: validate a CommitmentFormData value using the shared schema
 * - isHexAddress: runtime guard for 0x-prefixed 40-byte hex addresses
 * - getFallbackAddresses: resolve verifier/penaltyReceiver with fallbacks to connected account
 *
 * Location: app/(authenticated)/commitments/create/_utils/form-utils.ts
 */

import type { ZodError } from "zod";
import {
  type CommitmentFormData,
  commitmentSchema,
  HEX_ADDRESS_RE,
} from "../types";

/**
 * Convert a ZodError into a simple map of `fieldName -> string[]` messages.
 */
export function extractFieldErrors(
  err: ZodError<CommitmentFormData>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path?.length ? issue.path.join(".") : "_";
    out[key] = out[key] ?? [];
    if (issue.message) {
      out[key].push(issue.message);
    }
  }
  return out;
}

/**
 * Validate the form mirror using the shared zod schema.
 * Returns `undefined` when valid, or a map of field -> errors when invalid.
 */
export function validateForm({ value }: { value: CommitmentFormData }) {
  const result = commitmentSchema.safeParse(value);
  return result.success ? undefined : extractFieldErrors(result.error);
}

/**
 * Runtime guard for Ethereum hex addresses of the form `0x` + 40 hex chars.
 */
export function isHexAddress(v: unknown): v is `0x${string}` {
  return typeof v === "string" && HEX_ADDRESS_RE.test(v as string);
}

/**
 * Resolve verifier and penaltyReceiver addresses:
 * - If explicit verifier/penalty values are valid hex addresses, prefer them.
 * - Otherwise, fall back to the connected account address when valid.
 *
 * Returns an object with both addresses when resolvable, or null otherwise.
 */
export function getFallbackAddresses(
  connected?: unknown,
  verifier?: string,
  penalty?: string
): { verifierAddr: `0x${string}`; penaltyAddr: `0x${string}` } | null {
  let v: `0x${string}` | undefined;
  let p: `0x${string}` | undefined;

  if (verifier && isHexAddress(verifier)) {
    v = verifier;
  } else if (isHexAddress(connected)) {
    v = connected;
  }

  if (penalty && isHexAddress(penalty)) {
    p = penalty;
  } else if (isHexAddress(connected)) {
    p = connected;
  }

  if (v && p) {
    return { verifierAddr: v, penaltyAddr: p };
  }
  return null;
}
