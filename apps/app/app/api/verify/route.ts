import { auditTask } from "@repo/ai/server-audit";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { commitmentId, proofContent, taskDescription } = await req.json();

    if (!(commitmentId && proofContent && taskDescription)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await auditTask({
      commitmentId,
      proofContent,
      taskDescription,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
};
