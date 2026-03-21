const path = require("node:path");

const dotenv = require("dotenv");
const { Contract, JsonRpcProvider, Wallet, ZeroAddress } = require("ethers");

dotenv.config();

const {
  abi,
} = require(path.resolve(
  __dirname,
  "../../timelend-contract/artifacts/contracts/TimeLendMVP.sol/TimeLendMVP.json",
));

const mode = process.env.MODE === "mock" ? "mock" : "real";
const { PRIVATE_KEY, RPC_URL, CONTRACT_ADDRESS } = process.env;

const hasReadConfig = Boolean(RPC_URL && CONTRACT_ADDRESS);
const provider = hasReadConfig ? new JsonRpcProvider(RPC_URL) : null;
const readContract = hasReadConfig
  ? new Contract(CONTRACT_ADDRESS, abi, provider)
  : null;

const hasWriteConfig =
  mode === "real" && Boolean(PRIVATE_KEY && RPC_URL && CONTRACT_ADDRESS);
const wallet = hasWriteConfig ? new Wallet(PRIVATE_KEY, provider) : null;
const writeContract = hasWriteConfig
  ? new Contract(CONTRACT_ADDRESS, abi, wallet)
  : null;

const assertReadContract = () => {
  if (!readContract) {
    throw new Error(
      "Contract read client is not configured. Set RPC_URL and CONTRACT_ADDRESS.",
    );
  }
};

const assertWriteContract = () => {
  if (mode === "mock") {
    throw new Error("Contract writes are disabled in mock mode.");
  }

  if (!writeContract) {
    throw new Error(
      "Contract write client is not configured. Set PRIVATE_KEY, RPC_URL, and CONTRACT_ADDRESS.",
    );
  }
};

const normalizeCommitment = (commitment) => ({
  user: commitment.user,
  verifier: commitment.verifier,
  penaltyReceiver: commitment.penaltyReceiver,
  stake: commitment.stake,
  createdAt: commitment.createdAt,
  deadline: commitment.deadline,
  status: Number(commitment.status),
  taskURI: commitment.taskURI,
  proofURI: commitment.proofURI,
});

const isExistingCommitment = (commitment) => commitment.user !== ZeroAddress;

async function getCommitment(commitmentId) {
  assertReadContract();
  const commitment = await readContract.getCommitment(commitmentId);
  return normalizeCommitment(commitment);
}

async function getNextCommitmentId() {
  assertReadContract();
  return readContract.nextCommitmentId();
}

async function verifySuccess(commitmentId) {
  assertWriteContract();
  const tx = await writeContract.verifySuccess(commitmentId);
  await tx.wait();
  return tx;
}

async function markFailed(commitmentId) {
  assertWriteContract();
  const tx = await writeContract.markFailed(commitmentId);
  await tx.wait();
  return tx;
}

module.exports = {
  getCommitment,
  getNextCommitmentId,
  isExistingCommitment,
  markFailed,
  mode,
  provider,
  verifySuccess,
  wallet,
};
