// @ts-nocheck
// src/lib/cloudinary.js
export async function uploadToCloudinary(file) {
  if (!file) return null;

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url; // photoUrl to save
}
