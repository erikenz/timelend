import { NextResponse } from "next/server";
import {
  type CreateCommitmentInput,
  validateCommitmentInput,
} from "../../../lib/commitments";
import {
  createCommitment,
  listCommitments,
} from "../../../lib/commitments-store";

export function GET() {
  const commitments = listCommitments();
  return NextResponse.json(commitments);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<CreateCommitmentInput>;

  const input: CreateCommitmentInput = {
    amount: Number(payload.amount),
    deadline: String(payload.deadline ?? ""),
    description: String(payload.description ?? ""),
  };

  const fieldErrors = validateCommitmentInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const createdCommitment = createCommitment({
    ...input,
    description: input.description.trim(),
  });

  return NextResponse.json(createdCommitment, { status: 201 });
}
