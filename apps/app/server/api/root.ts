import { commitmentsRouter } from "@/server/api/routers/commitments";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  commitments: commitmentsRouter,
});

/**
 * This type is used to create the frontend client and infer the API response types.
 */
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.commitments.all();
 */
export const createCaller = createCallerFactory(appRouter);
