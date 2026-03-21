// import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = keys().DATABASE_URL || "";

const createPrismaClient = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

// const createPrismaClient = () =>
// 	new PrismaClient({

// 		log:
// 			process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
// 	});
// const globalForPrisma = globalThis as unknown as {
// 	prisma: ReturnType<typeof createPrismaClient> | undefined;
// };

export const database = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

export * from "./generated/client";
