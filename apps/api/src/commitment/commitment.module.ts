import { Module } from '@nestjs/common';
import { CommitmentService } from './commitment.service';
import { CommitmentController } from './commitment.controller';

@Module({
  controllers: [CommitmentController],
  providers: [CommitmentService],
})
export class CommitmentModule {}
