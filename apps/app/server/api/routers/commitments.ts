import { createPublicClient, http } from "viem";
import { avalanche, avalancheFuji } from "viem/chains";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

const publicClientFuji = createPublicClient({
  chain: avalancheFuji,
  transport: http(),
});

const publicClientMainnet = createPublicClient({
  chain: avalanche,
  transport: http(),
});

export const commitmentsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const commitments = await ctx.db.commitment.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { payments: true },
    });
    return commitments;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const commitment = await ctx.db.commitment.findUnique({
        where: { id: input.id },
        include: { payments: true },
      });
      if (!commitment || commitment.userId !== ctx.session.user.id) {
        return null;
      }
      return commitment;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        durationSeconds: z.number().int().positive(),
        stakeAmount: z.string().min(1),
        verifierAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.commitment.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + input.durationSeconds * 1000),
          paid: false,
          completed: false,
        },
      });
    }),

  syncWithContract: protectedProcedure
    .input(
      z.object({
        commitmentId: z.string(),
        onChainCommitmentId: z.bigint().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.commitment.update({
        where: { id: input.commitmentId },
        data: {
          onChainCommitmentId: input.onChainCommitmentId?.toString(),
        },
      });
    }),

  getContractCommitment: protectedProcedure
    .input(
      z.object({
        onChainCommitmentId: z.bigint(),
        chainId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const client =
        input.chainId === 43_114 ? publicClientMainnet : publicClientFuji;
      const commitment = await client.readContract({
        address: "0x0000000000000000000000000000000000000000",
        abi: [
          {
            name: "getCommitment",
            type: "function",
            inputs: [{ name: "commitmentId", type: "uint256" }],
            outputs: [
              {
                components: [
                  { name: "user", type: "address" },
                  { name: "verifier", type: "address" },
                  { name: "penaltyReceiver", type: "address" },
                  { name: "stake", type: "uint256" },
                  { name: "createdAt", type: "uint64" },
                  { name: "deadline", type: "uint64" },
                  { name: "status", type: "uint8" },
                  { name: "taskURI", type: "string" },
                  { name: "proofURI", type: "string" },
                ],
                name: "",
                type: "tuple",
              },
            ],
            stateMutability: "view",
          },
        ] as const,
        functionName: "getCommitment",
        args: [input.onChainCommitmentId],
      });
      return commitment;
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const commitment = await ctx.db.commitment.findFirst({
      orderBy: { createdAt: "desc" },
      where: { userId: { equals: ctx.session.user.id } },
    });
    return commitment ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
