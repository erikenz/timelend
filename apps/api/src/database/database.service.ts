import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { Pool, type QueryResultRow } from "pg";

import { getDatabaseConfig } from "../config/env";

const CREATE_COMMITMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS commitments (
    commitment_id BIGINT PRIMARY KEY,
    owner_address TEXT NOT NULL,
    penalty_receiver TEXT NOT NULL,
    task_description TEXT NOT NULL,
    stake_wei TEXT NOT NULL,
    contract_tx_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'passed', 'failed')),
    ai_result TEXT CHECK (ai_result IN ('PASS', 'FAIL')),
    proof_text TEXT,
    proof_file_name TEXT,
    proof_file_mime_type TEXT,
    proof_file_base64 TEXT,
    proof_file_size_bytes INTEGER,
    proof_submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_tx_hash TEXT,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_OWNER_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS commitments_owner_address_idx
  ON commitments (LOWER(owner_address));
`;

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly pool = new Pool(getDatabaseConfig());

  async onModuleInit() {
    await this.query(CREATE_COMMITMENTS_TABLE_SQL);
    await this.query(CREATE_OWNER_INDEX_SQL);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async ping() {
    await this.query("SELECT 1");
  }

  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = []
  ) {
    return this.pool.query<Row>(text, [...values]);
  }
}
