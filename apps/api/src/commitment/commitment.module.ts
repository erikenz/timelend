import { Module } from "@nestjs/common";
import { CommitmentController } from "./commitment.controller";
import { CommitmentService } from "./commitment.service";

@Module({
  controllers: [CommitmentController],
  providers: [CommitmentService],
})
export class CommitmentModule {}
