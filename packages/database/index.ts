/**
 * Selects the appropriate Prisma adapter based on environment:
 * - Production: attempt to use Neon adapter (@prisma/adapter-neon + @neondatabase/serverless)
 * - Non-production (development / test): use local Postgres via pg Pool + @prisma/adapter-pg
 *
 * Re-uses a single PrismaClient instance in non-production to avoid connection storming.
 */

import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const connectionString = keys().DATABASE_URL || process.env.DATABASE_URL || "";

function createPrismaClient(): PrismaClient {
  // Prefer Neon in production. If Neon packages are not available or initialization fails,
  // fall back to using the pg adapter so the app still starts.
  if (process.env.NODE_ENV === "production") {
    try {
      // Dynamically require Neon-related packages so development environments without those
      // dependencies don't fail at import time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { neonConfig } = require("@neondatabase/serverless");
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { PrismaNeon } = require("@prisma/adapter-neon");
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const ws = require("ws");

      // Required by the Neon serverless adapter when running in certain environments.
      neonConfig.webSocketConstructor = ws;

      const adapter = new PrismaNeon({ connectionString });
      return new PrismaClient({
        adapter,
        log: ["error"], // keep production logs minimal
      });
    } catch (neonErr) {
      // If Neon initialization fails, log a helpful message and attempt to fall back.
      // Don't throw here to allow the process to continue using the pg adapter.
      // eslint-disable-next-line no-console
      console.warn(
        "[database] Failed to initialize Neon adapter; falling back to pg adapter. Reason:",
        (neonErr as Error).message ?? neonErr
      );
      // fallthrough to pg adapter
    }
  }

  // Default / fallback: use pg Pool + PrismaPg adapter.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { Pool } = require("pg");
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch (pgErr) {
    // If adapter initialization fails, surface a clear error so the deployer can fix dependencies.
    // eslint-disable-next-line no-console
    console.error(
      "[database] Failed to initialize Postgres adapter. Make sure `pg` and `@prisma/adapter-pg` are installed.",
      (pgErr as Error).message ?? pgErr
    );
    throw pgErr;
  }
}

export const database: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Cache the client across module reloads in development to prevent exhausting DB connections
  globalForPrisma.prisma = database;
}

export * from "./generated/client";
