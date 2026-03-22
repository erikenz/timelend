import { Module } from "@nestjs/common";

import { AiService } from "../ai/ai.service";
import { ContractService } from "../blockchain/contract.service";
import { CommitmentStoreService } from "./commitment-store.service";
import { CommitmentsController } from "./commitments.controller";
import { CommitmentsService } from "./commitments.service";

@Module({
  controllers: [CommitmentsController],
  providers: [
    AiService,
    CommitmentStoreService,
    CommitmentsService,
    ContractService,
  ],
  exports: [CommitmentsService, ContractService],
})
export class CommitmentsModule {}
