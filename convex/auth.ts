import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              email: user.email.trim().toLowerCase(),
            },
          }),
        },
        update: {
          before: async (user) => {
            if (typeof user.email !== "string") {
              return;
            }

            return {
              data: {
                ...user,
                email: user.email.trim().toLowerCase(),
              },
            };
          },
        },
      },
    },
    trustedOrigins: [
      siteUrl,
      "https://mrmpl-temp.vercel.app",
      "https://www.mayankrawmint.com",
      "https://admin.mayankrawmint.com",
      "http://localhost:3000",
      "http://admin.localhost:3000",
    ],
    plugins: [convex({ authConfig })],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});

export const emailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.email.trim();
    if (!trimmed.includes("@")) {
      return { exists: false };
    }

    // Convex Better Auth adapter does not support mode: "insensitive".
    // Prefer normalized lowercase, then fall back to the exact entered value
    // for any users created before write-side normalization.
    const candidates = Array.from(
      new Set([trimmed.toLowerCase(), trimmed]),
    );

    for (const value of candidates) {
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [
          {
            field: "email",
            value,
            operator: "eq",
          },
        ],
      });

      if (user !== null) {
        return { exists: true };
      }
    }

    return { exists: false };
  },
});
