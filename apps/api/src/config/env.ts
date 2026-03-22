import { TIME_LEND_CONTRACT_ADDRESS } from "@repo/contracts/timelend-contract";

const LEGACY_GEMINI_API_KEY_ENV =
  "AIzaSyCyLWX6GjiskE9oB5ACJrrqlghV7hT7VHo" as const;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/timelend";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_PORT = 3000;
const DEFAULT_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_PROOF_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const PLACEHOLDER_ENV_VALUES = new Set([
  "0xYOUR_BACKEND_RESOLVER_PRIVATE_KEY",
  "YOUR_BACKEND_RESOLVER_PRIVATE_KEY",
  "YOUR_GEMINI_API_KEY",
]);

export type AppMode = "real" | "readonly";

const readEnv = (key: string) => {
  const value = process.env[key];
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (PLACEHOLDER_ENV_VALUES.has(normalizedValue)) {
    return "";
  }

  return normalizedValue;
};

const readRequiredEnv = (key: string) => {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`Missing ${key} in environment`);
  }

  return value;
};

const parseNumberEnv = (key: string, fallback: number) => {
  const value = readEnv(key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key} in environment`);
  }

  return parsed;
};

export const normalizePrivateKey = (value: string) =>
  value.startsWith("0x") ? value : `0x${value}`;

export const getAppMode = (): AppMode =>
  readEnv("MODE") === "readonly" ? "readonly" : "real";

export const getAllowedOrigins = () => {
  const configuredOrigins = readEnv("ALLOWED_ORIGINS");

  if (!configuredOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configuredOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getDatabaseConfig = () => {
  const databaseUrl = readEnv("DATABASE_URL") || DEFAULT_DATABASE_URL;
  const sslMode = readEnv("DATABASE_SSL").toLowerCase();
  const isLocalDatabase =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  const shouldUseSsl =
    sslMode === "require" ||
    sslMode === "true" ||
    !(sslMode || isLocalDatabase);

  return {
    connectionString: databaseUrl,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  } as const;
};

export const getGeminiApiKey = () =>
  readEnv("GEMINI_API_KEY") || readEnv(LEGACY_GEMINI_API_KEY_ENV);

export const getGeminiModel = () =>
  readEnv("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;

export const getGeminiTimeoutMs = () =>
  parseNumberEnv("AI_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);

export const getMaxProofFileBytes = () =>
  parseNumberEnv("MAX_PROOF_FILE_BYTES", DEFAULT_PROOF_FILE_SIZE_BYTES);

export const getPort = () => parseNumberEnv("PORT", DEFAULT_PORT);

export const getRpcUrl = () => readEnv("RPC_URL") || DEFAULT_RPC_URL;

export const getContractAddress = () =>
  (readEnv("CONTRACT_ADDRESS") || TIME_LEND_CONTRACT_ADDRESS) as `0x${string}`;

export const getResolverPrivateKey = () => {
  const privateKey = readRequiredEnv("PRIVATE_KEY");

  return normalizePrivateKey(privateKey);
};

export const getLegacyGeminiApiKeyEnvName = () => LEGACY_GEMINI_API_KEY_ENV;
