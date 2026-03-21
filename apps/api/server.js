const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { isAddress } = require("ethers");

const { evaluateProof } = require("./services/ai");
const {
  getCommitment,
  getNextCommitmentId,
  isExistingCommitment,
  markFailed,
  mode,
  verifySuccess,
} = require("./services/contract");

dotenv.config();

const ACTIVE_STATUS = 0;
const SUCCESS_STATUS = 1;
const FAILED_STATUS = 2;
const DEFAULT_COMMITMENT_LIMIT = 3;
const MAX_COMMITMENT_LIMIT = 20;
const AI_TIMEOUT_MS = 5000;
const MAX_PROOF_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

if (!process.env.RPC_URL) {
  throw new Error("Missing RPC_URL in environment");
}

if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("Missing CONTRACT_ADDRESS in environment");
}

const app = express();
const port = Number(process.env.PORT || 3001);
const submitProofRateLimit = new Map();

const getNowInSeconds = () => BigInt(Math.floor(Date.now() / 1000));

const getClientIp = (request) => request.ip || "unknown";

const serializeCommitment = (commitment, commitmentId) => ({
  commitmentId: commitmentId.toString(),
  user: commitment.user,
  status: Number(commitment.status),
  deadline: commitment.deadline.toString(),
  taskURI: commitment.taskURI,
});

const logStructured = ({ commitmentId, user, result, txHash, ip }) => {
  console.log({
    commitmentId,
    user,
    result,
    txHash,
    ip,
  });
};

const parseLimit = (rawLimit) => {
  if (rawLimit === undefined) {
    return DEFAULT_COMMITMENT_LIMIT;
  }

  const parsedLimit = Number(rawLimit);

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error("invalid limit");
  }

  return Math.min(parsedLimit, MAX_COMMITMENT_LIMIT);
};

const enforceSubmitProofRateLimit = (ip) => {
  const now = Date.now();
  const recentRequests =
    submitProofRateLimit.get(ip)?.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    ) ?? [];

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  recentRequests.push(now);
  submitProofRateLimit.set(ip, recentRequests);
  return true;
};

setInterval(() => {
  const now = Date.now();

  for (const [ip, timestamps] of submitProofRateLimit.entries()) {
    const recentRequests = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    if (recentRequests.length === 0) {
      submitProofRateLimit.delete(ip);
      continue;
    }

    submitProofRateLimit.set(ip, recentRequests);
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);

const evaluateProofWithTimeout = async (payload, commitmentId) =>
  Promise.race([
    evaluateProof(payload),
    new Promise((resolve) => {
      setTimeout(() => {
        console.warn("AI timeout fallback", commitmentId);
        resolve("FAIL");
      }, AI_TIMEOUT_MS);
    }),
  ]);

const getRecentCommitments = async (limit) => {
  const nextCommitmentId = await getNextCommitmentId();
  const commitments = [];

  for (
    let offset = 1n;
    offset <= BigInt(limit) && nextCommitmentId - offset >= 0n;
    offset += 1n
  ) {
    const commitmentId = nextCommitmentId - offset;
    const commitment = await getCommitment(commitmentId);

    if (!isExistingCommitment(commitment)) {
      continue;
    }

    commitments.push({
      commitmentId,
      commitment,
    });
  }

  return commitments;
};

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, mode });
});

app.get("/commitment/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (id === undefined || Number.isNaN(Number(id))) {
      return response.status(400).json({ error: "invalid commitment id" });
    }

    const commitmentId = BigInt(id);
    const commitment = await getCommitment(commitmentId);

    if (!isExistingCommitment(commitment)) {
      return response.status(404).json({ error: "commitment not found" });
    }

    return response.json(serializeCommitment(commitment, commitmentId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    console.error("[get-commitment] Error:", message);
    return response.status(500).json({ error: message });
  }
});

app.get("/commitments/:user", async (request, response) => {
  try {
    const { user } = request.params;

    if (!isAddress(user)) {
      return response.status(400).json({ error: "invalid user address" });
    }

    const limit = parseLimit(request.query.limit);
    const recentCommitments = await getRecentCommitments(limit);
    const commitments = recentCommitments
      .filter(
        ({ commitment }) =>
          commitment.user.toLowerCase() === user.toLowerCase(),
      )
      .map(({ commitmentId, commitment }) =>
        serializeCommitment(commitment, commitmentId),
      );

    return response.json(commitments);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    const statusCode = message === "invalid limit" ? 400 : 500;

    console.error("[get-commitments-by-user] Error:", message);
    return response.status(statusCode).json({ error: message });
  }
});

app.get("/stats", async (request, response) => {
  try {
    console.warn("Stats are based on recent commitments only");

    const limit = parseLimit(request.query.limit);
    const recentCommitments = await getRecentCommitments(limit);

    const stats = recentCommitments.reduce(
      (accumulator, { commitment }) => {
        accumulator.totalCommitments += 1;

        if (commitment.status === ACTIVE_STATUS) {
          accumulator.active += 1;
        } else if (commitment.status === SUCCESS_STATUS) {
          accumulator.completed += 1;
        } else if (commitment.status === FAILED_STATUS) {
          accumulator.failed += 1;
        }

        return accumulator;
      },
      {
        totalCommitments: 0,
        active: 0,
        completed: 0,
        failed: 0,
      },
    );

    return response.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    const statusCode = message === "invalid limit" ? 400 : 500;

    console.error("[get-stats] Error:", message);
    return response.status(statusCode).json({ error: message });
  }
});

app.post("/submit-proof", async (request, response) => {
  try {
    console.log("[submit-proof] Incoming request:", request.body);

    const ip = getClientIp(request);

    if (!enforceSubmitProofRateLimit(ip)) {
      return response
        .status(429)
        .json({ error: "rate limit exceeded" });
    }

    const { commitmentId, user, proof } = request.body ?? {};

    if (
      commitmentId === undefined ||
      commitmentId === null ||
      Number.isNaN(Number(commitmentId))
    ) {
      return response.status(400).json({ error: "commitmentId is required" });
    }

    if (typeof proof !== "string" || proof.trim().length === 0) {
      return response.status(400).json({ error: "proof is required" });
    }

    if (proof.length > MAX_PROOF_LENGTH) {
      return response.status(400).json({ error: "proof too large" });
    }

    if (typeof user !== "string" || !isAddress(user)) {
      return response.status(400).json({ error: "user must be a valid address" });
    }

    const parsedCommitmentId = BigInt(commitmentId);
    const onchainCommitment = await getCommitment(parsedCommitmentId);

    if (!isExistingCommitment(onchainCommitment)) {
      return response.status(404).json({ error: "commitment not found" });
    }

    if (onchainCommitment.user.toLowerCase() !== user.toLowerCase()) {
      return response
        .status(400)
        .json({ error: "user does not match commitment owner" });
    }

    if (onchainCommitment.status !== ACTIVE_STATUS) {
      return response.status(400).json({ error: "commitment not active" });
    }

    if (getNowInSeconds() >= onchainCommitment.deadline) {
      return response.status(400).json({ error: "deadline passed" });
    }

    if (
      onchainCommitment.proofURI &&
      onchainCommitment.proofURI.trim().length > 0
    ) {
      return response.status(400).json({ error: "proof already submitted" });
    }

    const result = await evaluateProofWithTimeout(
      {
        description: onchainCommitment.taskURI,
        proof: proof.trim(),
      },
      parsedCommitmentId.toString(),
    );

    if (mode === "mock") {
      logStructured({
        commitmentId: parsedCommitmentId.toString(),
        user,
        result,
        txHash: null,
        ip,
      });

      return response.json({
        status: result,
        mode,
      });
    }

    console.warn("Race condition possible", parsedCommitmentId.toString());

    if (result === "PASS") {
      try {
        const tx = await verifySuccess(parsedCommitmentId);

        logStructured({
          commitmentId: parsedCommitmentId.toString(),
          user,
          result,
          txHash: tx.hash,
          ip,
        });

        return response.json({
          status: "PASS",
          txHash: tx.hash,
          mode,
        });
      } catch (contractError) {
        const message =
          contractError instanceof Error
            ? contractError.message
            : "verifySuccess transaction failed";

        return response.status(502).json({ error: message });
      }
    }

    try {
      const tx = await markFailed(parsedCommitmentId);

      logStructured({
        commitmentId: parsedCommitmentId.toString(),
        user,
        result,
        txHash: tx.hash,
        ip,
      });

      return response.json({
        status: "FAIL",
        txHash: tx.hash,
        mode,
      });
    } catch (contractError) {
      const message =
        contractError instanceof Error
          ? contractError.message
          : "markFailed transaction failed";

      return response.status(502).json({ error: message });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    console.error("[submit-proof] Error:", message);

    return response.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Proof verifier listening on http://localhost:${port} (${mode})`);
});
