import { Injectable } from "@nestjs/common";
import { database, type PrismaClient } from "@repo/database";
import type { CreateCommitmentDto } from "./dto/create-commitment.dto";
import type { UpdateCommitmentDto } from "./dto/update-commitment.dto";

@Injectable()
export class CommitmentService {
  private readonly prisma: PrismaClient = database as unknown as PrismaClient;

  async create(createCommitmentDto: CreateCommitmentDto) {
    const created = await this.prisma.commitment.create({
      data: createCommitmentDto,
    });
    return created;
  }

  findAll() {
    return "This action returns all commitment";
  }

  findOne(id: number) {
    return `This action returns a #${id} commitment`;
  }

  update(id: number, updateCommitmentDto: UpdateCommitmentDto) {
    return `This action updates a #${id} commitment`;
  }

  remove(id: number) {
    return `This action removes a #${id} commitment`;
  }
}
