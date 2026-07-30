import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { api } from "../../../../../../convex/_generated/api";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import {
  isSiteMediaPageId,
  validateSiteMediaReplacement,
} from "@/lib/site-media-registry";

type ReplaceBody = {
  assetId?: unknown;
  fileKey?: unknown;
  height?: unknown;
  mimeType?: unknown;
  page?: unknown;
  size?: unknown;
  url?: unknown;
  width?: unknown;
};

function getUploadThingApi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("UPLOADTHING_TOKEN is not configured.");
  return new UTApi({ token, logLevel: "Error" });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReplaceBody;
  try {
    body = (await request.json()) as ReplaceBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body.page !== "string" ||
    !isSiteMediaPageId(body.page) ||
    typeof body.assetId !== "string" ||
    typeof body.fileKey !== "string" ||
    typeof body.url !== "string" ||
    typeof body.mimeType !== "string" ||
    typeof body.width !== "number" ||
    typeof body.height !== "number" ||
    typeof body.size !== "number"
  ) {
    return NextResponse.json({ error: "Invalid replacement metadata." }, { status: 400 });
  }

  const validationError = validateSiteMediaReplacement({
    assetId: body.assetId,
    mimeType: body.mimeType,
    pageId: body.page,
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const utapi = getUploadThingApi();
  try {
    const result = await fetchAuthMutation(api.siteMedia.replaceImage, {
      page: body.page,
      assetId: body.assetId,
      fileKey: body.fileKey,
      url: body.url,
      mimeType: body.mimeType,
      width: body.width,
      height: body.height,
      size: body.size,
    });

    if (result.previousFileKey && result.previousFileKey !== body.fileKey) {
      await utapi.deleteFiles(result.previousFileKey).catch(() => undefined);
    }

    revalidateTag("site-media", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await utapi.deleteFiles(body.fileKey).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not replace the image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
