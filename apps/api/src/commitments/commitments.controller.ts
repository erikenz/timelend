import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";

import { getMaxProofFileBytes } from "../config/env";
import type { ProofAttachment } from "./commitment.types";
// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { CommitmentsService } from "./commitments.service";
import type { SubmitProofDto } from "./dto/submit-proof.dto";
import type { SyncCommitmentDto } from "./dto/sync-commitment.dto";

interface UploadedProofFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

interface SyncCommitmentBody {
  commitmentId?: number | string;
  txHash?: string;
  walletAddress?: string;
}

interface SubmitProofBody {
  proof?: string;
  walletAddress?: string;
}

const MAX_PROOF_FILE_BYTES = getMaxProofFileBytes();

const SUPPORTED_PROOF_MIME_TYPES = new Set([
  "application/json",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");

const toProofAttachment = (
  uploadedFile: UploadedProofFile | undefined
): ProofAttachment | null => {
  if (!uploadedFile) {
    return null;
  }

  if (!SUPPORTED_PROOF_MIME_TYPES.has(uploadedFile.mimetype)) {
    throw new BadRequestException(
      "unsupported proof file type. Use PNG, JPG, WEBP, PDF, TXT, MD, CSV, or JSON"
    );
  }

  return {
    base64Data: uploadedFile.buffer.toString("base64"),
    fileName: uploadedFile.originalname,
    mimeType: uploadedFile.mimetype,
    sizeBytes: uploadedFile.size,
  };
};

const toSyncCommitmentDto = (
  body: SyncCommitmentBody | undefined
): SyncCommitmentDto => {
  const commitmentId = Number(body?.commitmentId);

  if (!Number.isInteger(commitmentId) || commitmentId < 0) {
    throw new BadRequestException("invalid commitmentId");
  }

  return {
    commitmentId,
    txHash: typeof body?.txHash === "string" ? body.txHash : undefined,
    walletAddress:
      typeof body?.walletAddress === "string" ? body.walletAddress : undefined,
  };
};

const toSubmitProofDto = (
  body: SubmitProofBody | undefined
): SubmitProofDto => {
  const walletAddress =
    typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";

  if (!walletAddress) {
    throw new BadRequestException("wallet address is required");
  }

  return {
    proof: typeof body?.proof === "string" ? body.proof : undefined,
    walletAddress,
  };
};

@Controller()
export class CommitmentsController {
  constructor(private readonly commitmentsService: CommitmentsService) {}

  @Post("commitments/sync")
  syncCommitment(@Body() body: SyncCommitmentBody) {
    return this.commitmentsService.syncCommitment(toSyncCommitmentDto(body));
  }

  @Get("commitments/id/:commitmentId")
  getCommitment(@Param("commitmentId", ParseIntPipe) commitmentId: number) {
    return this.commitmentsService.getCommitmentById(commitmentId);
  }

  @Get("commitments/:commitmentId/proof-file")
  async downloadProofFile(
    @Param("commitmentId", ParseIntPipe) commitmentId: number,
    @Res() response: Response
  ) {
    const proofFile = await this.commitmentsService.getProofFile(commitmentId);

    response.setHeader("Content-Type", proofFile.mimeType);
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFileName(proofFile.fileName)}"`
    );

    return response.send(Buffer.from(proofFile.base64Data, "base64"));
  }

  @Post("commitments/:commitmentId/proof")
  @UseInterceptors(
    FileInterceptor("proofFile", {
      limits: {
        fileSize: MAX_PROOF_FILE_BYTES,
      },
    })
  )
  submitProof(
    @Param("commitmentId", ParseIntPipe) commitmentId: number,
    @Body() body: SubmitProofBody,
    @Req() request: Request,
    @UploadedFile() uploadedFile?: UploadedProofFile
  ) {
    return this.commitmentsService.submitProof(
      commitmentId,
      toSubmitProofDto(body),
      request.ip ?? "unknown",
      toProofAttachment(uploadedFile)
    );
  }

  @Get("users/:walletAddress/commitments")
  listCommitments(@Param("walletAddress") walletAddress: string) {
    return this.commitmentsService.listCommitmentsForWallet(walletAddress);
  }

  @Get("users/:walletAddress/stats")
  getStats(@Param("walletAddress") walletAddress: string) {
    return this.commitmentsService.getStatsForWallet(walletAddress);
  }
}
