"use client";

import type { AuditResult } from "@repo/ai";
import { VerificationChat } from "@repo/ai";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSubmitProof, useVerifySuccess } from "@/lib/use-contract";

interface VerificationCardProps {
  commitmentId: string;
  onChainId: bigint;
  onVerificationComplete?: (passed: boolean) => void;
  taskDescription: string;
}

type VerificationPhase = "chat" | "submitting_proof" | "verifying";

export function VerificationCard({
  commitmentId,
  taskDescription,
  onChainId,
  onVerificationComplete,
}: VerificationCardProps) {
  const [phase, setPhase] = useState<VerificationPhase>("chat");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const submitProof = useSubmitProof();
  const verifySuccess = useVerifySuccess();

  const handleVerificationComplete = useCallback(
    (result: AuditResult) => {
      setAuditResult(result);
      onVerificationComplete?.(result.passed);

      if (result.passed) {
        toast.success(`Verification passed! Score: ${result.qualityScore}/100`);
        setPhase("submitting_proof");
      } else {
        toast.error(
          `Verification failed. Score: ${result.qualityScore}/100. You can continue chatting to provide more evidence.`
        );
      }
    },
    [onVerificationComplete]
  );

  const handleSubmitProof = useCallback(() => {
    const proofUri = `ipfs://proof/${commitmentId}/${Date.now()}`;
    submitProof.submitProof(onChainId, proofUri);
    setPhase("verifying");
    toast.success("Proof submitted to blockchain!");
  }, [commitmentId, onChainId, submitProof]);

  const handleVerifySuccess = useCallback(() => {
    verifySuccess.verifySuccess(onChainId);
    toast.info("Waiting for verification confirmation...");
  }, [onChainId, verifySuccess]);

  const handleReset = useCallback(() => {
    setPhase("chat");
    setAuditResult(null);
  }, []);

  if (phase === "submitting_proof" && auditResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Result</CardTitle>
          <CardDescription>Your submission has been verified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-700 text-lg dark:text-green-300">
                Verification PASSED!
              </span>
            </div>
            <div className="mt-4">
              <span className="font-bold text-3xl">
                {auditResult.qualityScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Submit proof to the blockchain to complete verification and unlock
              your stake.
            </p>
            <div className="flex gap-2">
              <Button
                disabled={
                  submitProof.isPending ||
                  submitProof.isConfirming ||
                  submitProof.isConfirmed
                }
                onClick={handleSubmitProof}
              >
                {submitProof.isPending || submitProof.isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Proof to Blockchain"
                )}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Continue Chatting
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "verifying") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Chain Verification</CardTitle>
          <CardDescription>Waiting for blockchain confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Waiting for transaction confirmation...</span>
          </div>

          {submitProof.hash && (
            <p className="text-muted-foreground text-sm">
              Tx: {submitProof.hash.slice(0, 10)}...
            </p>
          )}

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Once confirmed, verify success to claim your stake.
            </p>
            <Button
              disabled={
                !submitProof.isConfirmed ||
                verifySuccess.isPending ||
                verifySuccess.isConfirming
              }
              onClick={handleVerifySuccess}
            >
              {verifySuccess.isPending || verifySuccess.isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Success"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Verification Assistant</CardTitle>
        <CardDescription>
          Chat with our AI to verify your commitment completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerificationChat
          commitmentId={commitmentId}
          onVerificationComplete={handleVerificationComplete}
          taskDescription={taskDescription}
        />
      </CardContent>
    </Card>
  );
}
