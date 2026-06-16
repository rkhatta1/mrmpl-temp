import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    contactNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    companyName: v.optional(v.string()),
    description: v.optional(v.string()),
    photoUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const contactId = await ctx.db.insert("contacts", {
      name: args.name.trim(),
      contactNumber: args.contactNumber?.trim() || "",
      email: args.email?.trim() || "",
      companyName: args.companyName?.trim() || "",
      description: args.description?.trim() || "",
      photoUrl: args.photoUrl || null,
      submittedAt: Date.now(),
    });

    return { contactId };
  },
});
