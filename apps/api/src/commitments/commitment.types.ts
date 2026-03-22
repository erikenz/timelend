export const commitmentStatuses = {
  active: "active",
  failed: "failed",
  passed: "passed",
} as const;

export type CommitmentStatus =
  (typeof commitmentStatuses)[keyof typeof commitmentStatuses];

export type ProofVerdict = "FAIL" | "PASS";

export interface ProofAttachment {
  base64Data: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ProofPayload {
  attachment: ProofAttachment | null;
  text: string | null;
}

export interface StoredCommitment {
  aiResult: ProofVerdict | null;
  commitmentId: number;
  contractTxHash: string | null;
  createdAt: string;
  deadlineAt: string;
  ownerAddress: string;
  penaltyReceiver: string;
  proof: string | null;
  proofFileMimeType: string | null;
  proofFileName: string | null;
  proofFileSizeBytes: number | null;
  proofSubmittedAt: string | null;
  resolutionTxHash: string | null;
  resolvedAt: string | null;
  stakeWei: string;
  status: CommitmentStatus;
  taskDescription: string;
}

export interface StoredCommitmentRecord extends StoredCommitment {
  proofFileBase64: string | null;
}

export interface StoredCommitmentStats {
  active: number;
  failed: number;
  passed: number;
  totalCommitments: number;
}
