import { NextResponse } from "next/server";

import { api, getConvexHttpClient } from "@/lib/convex-server";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json(
      {
        success: false,
        message: "Name is required",
      },
      { status: 400 },
    );
  }

  const payload = {
    name,
    contactNumber: String(body.contactNumber || ""),
    email: String(body.email || ""),
    companyName: String(body.companyName || ""),
    description: String(body.description || ""),
    photoUrl: body.photoUrl ? String(body.photoUrl) : null,
  };

  const convex = getConvexHttpClient();
  if (convex) {
    try {
      const result = await convex.mutation(api.contacts.create, payload);
      return NextResponse.json({
        success: true,
        data: result,
        source: "convex",
      });
    } catch (error) {
      console.error("Convex contact submission failed.", error);
      return NextResponse.json(
        {
          success: false,
          message: "Could not submit contact form",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    data: { queued: true },
    source: "local",
  });
}
