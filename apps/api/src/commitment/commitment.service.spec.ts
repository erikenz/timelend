import { Test, TestingModule } from '@nestjs/testing';
import { CommitmentService } from './commitment.service';

describe('CommitmentService', () => {
  let service: CommitmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommitmentService],
    }).compile();

    service = module.get<CommitmentService>(CommitmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
