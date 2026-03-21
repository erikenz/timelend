import { Injectable } from "@nestjs/common";
import { database } from "@repo/database";
import type { CreateCommitmentDto } from "./dto/create-commitment.dto";
import type { UpdateCommitmentDto } from "./dto/update-commitment.dto";

@Injectable()
export class CommitmentService {
	create(createCommitmentDto: CreateCommitmentDto) {
		database.commitment.create(createCommitmentDto);
		return "This action adds a new commitment";
	}

	findAll() {
		return `This action returns all commitment`;
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
