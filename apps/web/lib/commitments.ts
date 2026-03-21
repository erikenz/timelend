export type CommitmentStatus = "pending" | "completed" | "overdue";

export interface Commitment {
  amount: number;
  createdAt: string;
  deadline: string;
  description: string;
  id: string;
  status: CommitmentStatus;
}

export interface CreateCommitmentInput {
  amount: number;
  deadline: string;
  description: string;
}

export interface CommitmentFieldErrors {
  amount?: string;
  deadline?: string;
  description?: string;
}

const minimumDescriptionLength = 10;

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

const getTodayIsoDate = (): string =>
  new Date().toISOString().split("T")[0] ?? "";

export const validateCommitmentInput = (
  input: CreateCommitmentInput
): CommitmentFieldErrors => {
  const fieldErrors: CommitmentFieldErrors = {};
  const normalizedDescription = input.description.trim();

  if (normalizedDescription.length < minimumDescriptionLength) {
    fieldErrors.description =
      "La descripción debe tener al menos 10 caracteres.";
  }

  if (!dateOnlyRegex.test(input.deadline)) {
    fieldErrors.deadline = "La fecha debe tener formato YYYY-MM-DD.";
  } else if (input.deadline < getTodayIsoDate()) {
    fieldErrors.deadline = "La fecha límite debe ser hoy o futura.";
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    fieldErrors.amount = "El monto debe ser mayor a 0.";
  }

  return fieldErrors;
};

export const computeCommitmentStatus = (
  deadlineIsoDate: string,
  currentStatus: CommitmentStatus
): CommitmentStatus => {
  if (currentStatus === "completed") {
    return currentStatus;
  }

  return deadlineIsoDate < getTodayIsoDate() ? "overdue" : "pending";
};
