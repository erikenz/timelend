const DEFAULT_API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const getProofFileUrl = (commitmentId: number) =>
  `${API_BASE_URL}/commitments/${commitmentId}/proof-file`;

export interface ApiCommitment {
  aiResult: "FAIL" | "PASS" | null;
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
  status: "active" | "failed" | "passed";
  taskDescription: string;
}

export interface ApiCommitmentStats {
  active: number;
  failed: number;
  passed: number;
  totalCommitments: number;
}

interface SyncCommitmentPayload {
  commitmentId: number;
  txHash: string;
  walletAddress: string;
}

interface SubmitProofPayload {
  commitmentId: number;
  proof?: string;
  proofFile?: File | null;
  walletAddress: string;
}

interface SubmitProofResponse {
  commitment: ApiCommitment;
  mode: "real" | "readonly";
  status: "FAIL" | "PASS";
  txHash: string;
}

const readErrorMessage = (payload: unknown, fallbackMessage: string) => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    Array.isArray(payload.message) &&
    typeof payload.message[0] === "string"
  ) {
    return payload.message[0];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallbackMessage;
};

const parseResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, fallbackMessage));
  }

  return payload as T;
};

export const getCommitmentStats = async (walletAddress: string) => {
  const response = await fetch(`${API_BASE_URL}/users/${walletAddress}/stats`, {
    cache: "no-store",
  });

  return parseResponse<ApiCommitmentStats>(
    response,
    "Failed to load commitment stats"
  );
};

export const listCommitments = async (walletAddress: string) => {
  const response = await fetch(
    `${API_BASE_URL}/users/${walletAddress}/commitments`,
    {
      cache: "no-store",
    }
  );

  return parseResponse<ApiCommitment[]>(response, "Failed to load commitments");
};

export const submitProof = async ({
  commitmentId,
  proof,
  proofFile,
  walletAddress,
}: SubmitProofPayload) => {
  const formData = new FormData();

  formData.set("walletAddress", walletAddress);

  if (proof?.trim()) {
    formData.set("proof", proof.trim());
  }

  if (proofFile) {
    formData.set("proofFile", proofFile);
  }

  const response = await fetch(
    `${API_BASE_URL}/commitments/${commitmentId}/proof`,
    {
      body: formData,
      method: "POST",
    }
  );

  return parseResponse<SubmitProofResponse>(response, "Failed to submit proof");
};

export const syncCommitment = async ({
  commitmentId,
  txHash,
  walletAddress,
}: SyncCommitmentPayload) => {
  const response = await fetch(`${API_BASE_URL}/commitments/sync`, {
    body: JSON.stringify({
      commitmentId,
      txHash,
      walletAddress,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseResponse<ApiCommitment>(response, "Failed to sync commitment");
};
