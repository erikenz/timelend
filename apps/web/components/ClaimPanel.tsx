"use client";

import { useState } from "react";

import styles from "../app/page.module.css";
import { ClaimButton } from "./ClaimButton";

type ClaimPanelProps = {
  initialCommitmentId?: number;
};

export function ClaimPanel({ initialCommitmentId }: ClaimPanelProps) {
  const [commitmentId, setCommitmentId] = useState(
    initialCommitmentId?.toString() ?? "",
  );

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="claimCommitmentId">
          Commitment ID
        </label>
        <input
          className={styles.input}
          id="claimCommitmentId"
          inputMode="numeric"
          min="0"
          onChange={(event) => setCommitmentId(event.target.value)}
          placeholder="1"
          required
          step="1"
          type="number"
          value={commitmentId}
        />
      </div>

      <ClaimButton commitmentId={commitmentId || 0} />
    </div>
  );
}
