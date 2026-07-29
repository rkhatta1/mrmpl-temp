import { v } from "convex/values";

import {
  decryptAccessCode,
  encryptAccessCode,
  timingSafeEqualString,
} from "./lib/accessCodeCrypto";
import { mutation } from "./_generated/server";

const GATE_KEY = "gate";

function requireEncryptionSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not configured on Convex.");
  }
  return secret;
}

export const seedEncryptedAccessCode = mutation({
  args: {
    code: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminAccessSettings")
      .withIndex("by_key", (q) => q.eq("key", GATE_KEY))
      .unique();

    if (existing && !args.force) {
      return {
        seeded: false,
        reason: "already-seeded" as const,
        id: existing._id,
      };
    }

    const encryptedCode = await encryptAccessCode(
      args.code.trim(),
      requireEncryptionSecret(),
    );
    const doc = {
      key: GATE_KEY,
      encryptedCode,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { seeded: true, id: existing._id };
    }

    const id = await ctx.db.insert("adminAccessSettings", doc);
    return { seeded: true, id };
  },
});

export const verifyAccessCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminAccessSettings")
      .withIndex("by_key", (q) => q.eq("key", GATE_KEY))
      .unique();

    if (!existing) {
      return { ok: false as const };
    }

    try {
      const decrypted = await decryptAccessCode(
        existing.encryptedCode,
        requireEncryptionSecret(),
      );
      return {
        ok: timingSafeEqualString(decrypted, args.code.trim()) as boolean,
      };
    } catch {
      return { ok: false as const };
    }
  },
});
