import { Test, TestingModule } from '@nestjs/testing';
import { CommitmentController } from './commitment.controller';
import { CommitmentService } from './commitment.service';

describe('CommitmentController', () => {
  let controller: CommitmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommitmentController],
      providers: [CommitmentService],
    }).compile();

    controller = module.get<CommitmentController>(CommitmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
