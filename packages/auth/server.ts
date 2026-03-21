import { database } from "@repo/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(database, {
    provider: "postgresql",
  }),
  plugins: [
    nextCookies(),
    // organization() // if you want to use organization plugin
  ],
  //...add more options here
});
