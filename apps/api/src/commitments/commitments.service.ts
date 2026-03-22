import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { isAddress } from "ethers";

// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { AiService } from "../ai/ai.service";
// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { ContractService } from "../blockchain/contract.service";
import { getMaxProofFileBytes } from "../config/env";
import {
  type CommitmentStatus,
  commitmentStatuses,
  type ProofAttachment,
  type StoredCommitment,
  type StoredCommitmentRecord,
} from "./commitment.types";
// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { CommitmentStoreService } from "./commitment-store.service";
import type { SubmitProofDto } from "./dto/submit-proof.dto";
import type { SyncCommitmentDto } from "./dto/sync-commitment.dto";

const MAX_PROOF_LENGTH = 3000;
const MAX_PROOF_FILE_BYTES = getMaxProofFileBytes();
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const toPublicCommitment = ({
  proofFileBase64: _proofFileBase64,
  ...commitment
}: StoredCommitmentRecord): StoredCommitment => commitment;

@Injectable()
export class CommitmentsService {
  private readonly submitProofRateLimit = new Map<string, number[]>();

  constructor(
    private readonly aiService: AiService,
    private readonly commitmentStoreService: CommitmentStoreService,
    private readonly contractService: ContractService
  ) {}

  async getCommitmentById(commitmentId: number) {
    const commitment =
      await this.commitmentStoreService.getByCommitmentId(commitmentId);

    if (!commitment) {
      throw new NotFoundException("commitment not found");
    }

    return commitment;
  }

  async getProofFile(commitmentId: number) {
    const commitment =
      await this.commitmentStoreService.getRecordByCommitmentId(commitmentId);

    if (!(commitment?.proofFileBase64 && commitment.proofFileMimeType)) {
      throw new NotFoundException("proof file not found");
    }

    return {
      base64Data: commitment.proofFileBase64,
      fileName: commitment.proofFileName ?? `commitment-${commitmentId}-proof`,
      mimeType: commitment.proofFileMimeType,
    };
  }

  getStatsForWallet(walletAddress: string) {
    this.assertWalletAddress(walletAddress);

    return this.commitmentStoreService.summarizeByOwnerAddress(walletAddress);
  }

  listCommitmentsForWallet(walletAddress: string) {
    this.assertWalletAddress(walletAddress);

    return this.commitmentStoreService.listByOwnerAddress(walletAddress);
  }

  async submitProof(
    commitmentId: number,
    submitProofDto: SubmitProofDto,
    ipAddress: string,
    proofFile: ProofAttachment | null
  ) {
    this.assertWalletAddress(submitProofDto.walletAddress);
    this.enforceSubmitProofRateLimit(ipAddress);

    const proofText = submitProofDto.proof?.trim() ?? "";

    if (proofText.length > MAX_PROOF_LENGTH) {
      throw new BadRequestException("proof text is too large");
    }

    if (!(proofText || proofFile)) {
      throw new BadRequestException(
        "submit either proof text or a supported proof file"
      );
    }

    if (proofFile && proofFile.sizeBytes > MAX_PROOF_FILE_BYTES) {
      throw new BadRequestException("proof file is too large");
    }

    const storedCommitment = await this.getOrSyncCommitmentRecord(commitmentId);

    if (
      storedCommitment.ownerAddress.toLowerCase() !==
      submitProofDto.walletAddress.toLowerCase()
    ) {
      throw new BadRequestException("wallet does not match commitment owner");
    }

    if (storedCommitment.status !== commitmentStatuses.active) {
      throw new BadRequestException("commitment is already resolved");
    }

    const deadlineTimestamp = Date.parse(storedCommitment.deadlineAt);
    const passedDeadline = Number.isFinite(deadlineTimestamp)
      ? Date.now() > deadlineTimestamp
      : false;
    const proofPayload = {
      attachment: proofFile,
      text: proofText || null,
    } as const;
    const verdict = passedDeadline
      ? "FAIL"
      : await this.aiService.evaluateProof(
          storedCommitment.taskDescription,
          proofPayload
        );
    const passed = verdict === "PASS";
    const resolution = await this.contractService.resolveCommitment(
      commitmentId,
      passed
    );
    const updatedAt = new Date().toISOString();
    const updatedCommitment = await this.commitmentStoreService.upsert({
      ...storedCommitment,
      aiResult: verdict,
      proof: proofText || null,
      proofFileBase64: proofFile?.base64Data ?? null,
      proofFileMimeType: proofFile?.mimeType ?? null,
      proofFileName: proofFile?.fileName ?? null,
      proofFileSizeBytes: proofFile?.sizeBytes ?? null,
      proofSubmittedAt: updatedAt,
      resolutionTxHash: resolution.hash,
      resolvedAt: updatedAt,
      status: passed ? commitmentStatuses.passed : commitmentStatuses.failed,
    });

    return {
      commitment: toPublicCommitment(updatedCommitment),
      mode: this.contractService.getMode(),
      status: verdict,
      txHash: resolution.hash,
    };
  }

  async syncCommitment(syncCommitmentDto: SyncCommitmentDto) {
    const storedCommitment = await this.syncCommitmentRecord(syncCommitmentDto);

    return toPublicCommitment(storedCommitment);
  }

  private buildStoredCommitment(
    commitmentId: number,
    onchainCommitment: Awaited<ReturnType<ContractService["getCommitment"]>>,
    contractTxHash: string | null
  ): StoredCommitmentRecord {
    return {
      aiResult: null,
      commitmentId,
      contractTxHash,
      createdAt: new Date(
        Number(onchainCommitment.createdAt) * 1000
      ).toISOString(),
      deadlineAt: new Date(
        Number(onchainCommitment.deadline) * 1000
      ).toISOString(),
      ownerAddress: onchainCommitment.user,
      penaltyReceiver: onchainCommitment.penaltyReceiver,
      proof: null,
      proofFileBase64: null,
      proofFileMimeType: null,
      proofFileName: null,
      proofFileSizeBytes: null,
      proofSubmittedAt: null,
      resolutionTxHash: null,
      resolvedAt: null,
      stakeWei: onchainCommitment.stake.toString(),
      status: this.mapContractStatus(onchainCommitment.status),
      taskDescription: onchainCommitment.taskDescription,
    };
  }

  private enforceSubmitProofRateLimit(ipAddress: string) {
    const now = Date.now();
    const recentRequests =
      this.submitProofRateLimit
        .get(ipAddress)
        ?.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS) ?? [];

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException("rate limit exceeded", 429);
    }

    recentRequests.push(now);
    this.submitProofRateLimit.set(ipAddress, recentRequests);
  }

  private async getOrSyncCommitmentRecord(commitmentId: number) {
    const storedCommitment =
      await this.commitmentStoreService.getRecordByCommitmentId(commitmentId);

    if (storedCommitment) {
      return storedCommitment;
    }

    return this.syncCommitmentRecord({
      commitmentId,
    });
  }

  private mapContractStatus(status: number): CommitmentStatus {
    if (status === 1) {
      return commitmentStatuses.passed;
    }

    if (status === 2) {
      return commitmentStatuses.failed;
    }

    return commitmentStatuses.active;
  }

  private async syncCommitmentRecord(syncCommitmentDto: SyncCommitmentDto) {
    const onchainCommitment = await this.contractService.getCommitment(
      syncCommitmentDto.commitmentId
    );
    const existingCommitment =
      await this.commitmentStoreService.getRecordByCommitmentId(
        syncCommitmentDto.commitmentId
      );

    if (!this.contractService.isExistingCommitment(onchainCommitment)) {
      throw new NotFoundException("commitment not found on chain");
    }

    if (
      syncCommitmentDto.walletAddress &&
      onchainCommitment.user.toLowerCase() !==
        syncCommitmentDto.walletAddress.toLowerCase()
    ) {
      throw new BadRequestException("wallet does not match commitment owner");
    }

    const syncedCommitment = this.buildStoredCommitment(
      syncCommitmentDto.commitmentId,
      onchainCommitment,
      syncCommitmentDto.txHash ?? existingCommitment?.contractTxHash ?? null
    );

    return this.commitmentStoreService.upsert(
      existingCommitment
        ? {
            ...syncedCommitment,
            aiResult: existingCommitment.aiResult,
            proof: existingCommitment.proof,
            proofFileBase64: existingCommitment.proofFileBase64,
            proofFileMimeType: existingCommitment.proofFileMimeType,
            proofFileName: existingCommitment.proofFileName,
            proofFileSizeBytes: existingCommitment.proofFileSizeBytes,
            proofSubmittedAt: existingCommitment.proofSubmittedAt,
            resolutionTxHash: existingCommitment.resolutionTxHash,
            resolvedAt: existingCommitment.resolvedAt,
          }
        : syncedCommitment
    );
  }

  private assertWalletAddress(walletAddress: string) {
    if (!isAddress(walletAddress)) {
      throw new BadRequestException("invalid wallet address");
    }
  }
}
