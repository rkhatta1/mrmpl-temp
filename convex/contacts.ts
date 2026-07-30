import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const enquiryValidator = v.object({
  _id: v.id("contacts"),
  name: v.string(),
  contactNumber: v.string(),
  email: v.string(),
  companyName: v.string(),
  description: v.string(),
  submittedAt: v.number(),
});

function buildSearchText(contact: {
  name: string;
  contactNumber: string;
  email: string;
  companyName: string;
  description: string;
}) {
  return [
    contact.name,
    contact.contactNumber,
    contact.email,
    contact.companyName,
    contact.description,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n");
}

function toEnquiry(contact: Doc<"contacts">) {
  return {
    _id: contact._id,
    name: contact.name,
    contactNumber: contact.contactNumber,
    email: contact.email,
    companyName: contact.companyName,
    description: contact.description,
    submittedAt: contact.submittedAt,
  };
}

export const create = mutation({
  args: {
    name: v.string(),
    contactNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    companyName: v.optional(v.string()),
    description: v.optional(v.string()),
    photoUrl: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({
    contactId: v.id("contacts"),
  }),
  handler: async (ctx, args) => {
    const contact = {
      name: args.name.trim(),
      contactNumber: args.contactNumber?.trim() || "",
      email: args.email?.trim() || "",
      companyName: args.companyName?.trim() || "",
      description: args.description?.trim() || "",
    };
    const contactId = await ctx.db.insert("contacts", {
      ...contact,
      searchText: buildSearchText(contact),
      photoUrl: args.photoUrl || null,
      submittedAt: Date.now(),
    });

    return { contactId };
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.string(),
  },
  returns: paginationResultValidator(enquiryValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("You must be signed in to view enquiries.");
    }

    const search = args.search.trim();
    const paginationOpts = {
      ...args.paginationOpts,
      maximumBytesRead: 200_000,
      maximumRowsRead: 30,
    };
    const results = search
      ? await ctx.db
          .query("contacts")
          .withSearchIndex("search_contacts", (q) =>
            q.search("searchText", search),
          )
          .paginate(paginationOpts)
      : await ctx.db
          .query("contacts")
          .withIndex("by_submitted_at")
          .order("desc")
          .paginate(paginationOpts);

    return {
      ...results,
      page: results.page.map(toEnquiry),
    };
  },
});
