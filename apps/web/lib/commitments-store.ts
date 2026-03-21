import {
  type Commitment,
  type CreateCommitmentInput,
  computeCommitmentStatus,
} from "./commitments";

type CommitmentsStoreGlobal = typeof globalThis & {
  __timelendCommitmentsStore?: Commitment[];
};

const getStore = (): Commitment[] => {
  const globalState = globalThis as CommitmentsStoreGlobal;
  if (!globalState.__timelendCommitmentsStore) {
    globalState.__timelendCommitmentsStore = [];
  }

  return globalState.__timelendCommitmentsStore;
};

export const listCommitments = (): Commitment[] => {
  const commitments = getStore();

  return commitments.map((commitment) => ({
    ...commitment,
    status: computeCommitmentStatus(commitment.deadline, commitment.status),
  }));
};

export const createCommitment = (input: CreateCommitmentInput): Commitment => {
  const commitments = getStore();
  const now = new Date().toISOString();

  const commitment: Commitment = {
    id: crypto.randomUUID(),
    createdAt: now,
    status: "pending",
    ...input,
  };

  commitments.unshift(commitment);

  return commitment;
};
