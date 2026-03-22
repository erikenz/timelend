import { Injectable } from "@nestjs/common";

// biome-ignore lint/style/useImportType: NestJS constructor injection requires runtime values.
import { DatabaseService } from "../database/database.service";
import type {
  StoredCommitment,
  StoredCommitmentRecord,
  StoredCommitmentStats,
} from "./commitment.types";

interface CommitmentRow {
  ai_result: StoredCommitmentRecord["aiResult"];
  commitment_id: number | string;
  contract_tx_hash: string | null;
  created_at: Date | string;
  deadline_at: Date | string;
  owner_address: string;
  penalty_receiver: string;
  proof_file_base64: string | null;
  proof_file_mime_type: string | null;
  proof_file_name: string | null;
  proof_file_size_bytes: number | null;
  proof_submitted_at: Date | string | null;
  proof_text: string | null;
  resolution_tx_hash: string | null;
  resolved_at: Date | string | null;
  stake_wei: string;
  status: StoredCommitmentRecord["status"];
  task_description: string;
}

interface CommitmentStatsRow {
  active: number | string;
  failed: number | string;
  passed: number | string;
  total_commitments: number | string;
}

const ALL_COLUMNS = `
  ai_result,
  commitment_id,
  contract_tx_hash,
  created_at,
  deadline_at,
  owner_address,
  penalty_receiver,
  proof_file_base64,
  proof_file_mime_type,
  proof_file_name,
  proof_file_size_bytes,
  proof_submitted_at,
  proof_text,
  resolution_tx_hash,
  resolved_at,
  stake_wei,
  status,
  task_description
`;

const UPSERT_COMMITMENT_SQL = `
  INSERT INTO commitments (
    ai_result,
    commitment_id,
    contract_tx_hash,
    created_at,
    deadline_at,
    owner_address,
    penalty_receiver,
    proof_file_base64,
    proof_file_mime_type,
    proof_file_name,
    proof_file_size_bytes,
    proof_submitted_at,
    proof_text,
    resolution_tx_hash,
    resolved_at,
    stake_wei,
    status,
    task_description
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14, $15, $16, $17, $18
  )
  ON CONFLICT (commitment_id) DO UPDATE SET
    ai_result = EXCLUDED.ai_result,
    contract_tx_hash = EXCLUDED.contract_tx_hash,
    created_at = EXCLUDED.created_at,
    deadline_at = EXCLUDED.deadline_at,
    owner_address = EXCLUDED.owner_address,
    penalty_receiver = EXCLUDED.penalty_receiver,
    proof_file_base64 = EXCLUDED.proof_file_base64,
    proof_file_mime_type = EXCLUDED.proof_file_mime_type,
    proof_file_name = EXCLUDED.proof_file_name,
    proof_file_size_bytes = EXCLUDED.proof_file_size_bytes,
    proof_submitted_at = EXCLUDED.proof_submitted_at,
    proof_text = EXCLUDED.proof_text,
    resolution_tx_hash = EXCLUDED.resolution_tx_hash,
    resolved_at = EXCLUDED.resolved_at,
    stake_wei = EXCLUDED.stake_wei,
    status = EXCLUDED.status,
    task_description = EXCLUDED.task_description,
    updated_at = NOW()
  RETURNING ${ALL_COLUMNS};
`;

const SELECT_BY_COMMITMENT_ID_SQL = `
  SELECT ${ALL_COLUMNS}
  FROM commitments
  WHERE commitment_id = $1
  LIMIT 1;
`;

const SELECT_BY_OWNER_SQL = `
  SELECT ${ALL_COLUMNS}
  FROM commitments
  WHERE LOWER(owner_address) = LOWER($1)
  ORDER BY commitment_id DESC;
`;

const SELECT_STATS_BY_OWNER_SQL = `
  SELECT
    COUNT(*) FILTER (WHERE status = 'active') AS active,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed,
    COUNT(*) FILTER (WHERE status = 'passed') AS passed,
    COUNT(*) AS total_commitments
  FROM commitments
  WHERE LOWER(owner_address) = LOWER($1);
`;

const toIsoString = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsedValue = Date.parse(value);

  return Number.isFinite(parsedValue)
    ? new Date(parsedValue).toISOString()
    : value;
};

const parseNumericValue = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  return value ? Number.parseInt(value, 10) : 0;
};

const mapRowToRecord = (row: CommitmentRow): StoredCommitmentRecord => ({
  aiResult: row.ai_result,
  commitmentId: parseNumericValue(row.commitment_id),
  contractTxHash: row.contract_tx_hash,
  createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
  deadlineAt: toIsoString(row.deadline_at) ?? new Date(0).toISOString(),
  ownerAddress: row.owner_address,
  penaltyReceiver: row.penalty_receiver,
  proof: row.proof_text,
  proofFileBase64: row.proof_file_base64,
  proofFileMimeType: row.proof_file_mime_type,
  proofFileName: row.proof_file_name,
  proofFileSizeBytes: row.proof_file_size_bytes,
  proofSubmittedAt: toIsoString(row.proof_submitted_at),
  resolutionTxHash: row.resolution_tx_hash,
  resolvedAt: toIsoString(row.resolved_at),
  stakeWei: row.stake_wei,
  status: row.status,
  taskDescription: row.task_description,
});

const sanitizeRecord = ({
  proofFileBase64: _proofFileBase64,
  ...commitment
}: StoredCommitmentRecord): StoredCommitment => commitment;

@Injectable()
export class CommitmentStoreService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getByCommitmentId(commitmentId: number) {
    const record = await this.getRecordByCommitmentId(commitmentId);

    return record ? sanitizeRecord(record) : null;
  }

  async getRecordByCommitmentId(commitmentId: number) {
    const { rows } = await this.databaseService.query<CommitmentRow>(
      SELECT_BY_COMMITMENT_ID_SQL,
      [commitmentId]
    );
    const [row] = rows;

    return row ? mapRowToRecord(row) : null;
  }

  async listByOwnerAddress(ownerAddress: string) {
    const { rows } = await this.databaseService.query<CommitmentRow>(
      SELECT_BY_OWNER_SQL,
      [ownerAddress]
    );

    return rows.map((row) => sanitizeRecord(mapRowToRecord(row)));
  }

  async summarizeByOwnerAddress(ownerAddress: string) {
    const { rows } = await this.databaseService.query<CommitmentStatsRow>(
      SELECT_STATS_BY_OWNER_SQL,
      [ownerAddress]
    );
    const [row] = rows;

    return {
      active: parseNumericValue(row?.active),
      failed: parseNumericValue(row?.failed),
      passed: parseNumericValue(row?.passed),
      totalCommitments: parseNumericValue(row?.total_commitments),
    } satisfies StoredCommitmentStats;
  }

  async upsert(commitment: StoredCommitmentRecord) {
    const { rows } = await this.databaseService.query<CommitmentRow>(
      UPSERT_COMMITMENT_SQL,
      [
        commitment.aiResult,
        commitment.commitmentId,
        commitment.contractTxHash,
        commitment.createdAt,
        commitment.deadlineAt,
        commitment.ownerAddress,
        commitment.penaltyReceiver,
        commitment.proofFileBase64,
        commitment.proofFileMimeType,
        commitment.proofFileName,
        commitment.proofFileSizeBytes,
        commitment.proofSubmittedAt,
        commitment.proof,
        commitment.resolutionTxHash,
        commitment.resolvedAt,
        commitment.stakeWei,
        commitment.status,
        commitment.taskDescription,
      ]
    );

    return mapRowToRecord(rows[0]);
  }
}
