-- AlterTable
ALTER TABLE "commitment" ADD COLUMN     "onChainCommitmentId" TEXT,
ADD COLUMN     "onChainPenaltyReceiver" TEXT,
ADD COLUMN     "onChainProofURI" TEXT,
ADD COLUMN     "onChainStake" DOUBLE PRECISION,
ADD COLUMN     "onChainStatus" INTEGER,
ADD COLUMN     "onChainTaskURI" TEXT,
ADD COLUMN     "onChainVerifier" TEXT;

-- CreateIndex
CREATE INDEX "commitment_onChainCommitmentId_idx" ON "commitment"("onChainCommitmentId");

-- CreateIndex
CREATE INDEX "walletAddress_address_idx" ON "walletAddress"("address");
