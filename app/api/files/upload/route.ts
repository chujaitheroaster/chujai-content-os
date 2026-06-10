import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/postscript",          // .ai
  "image/vnd.adobe.photoshop",       // .psd
  "application/octet-stream",        // .fig / generic
]);

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|mp4|mov|webm|pdf|ai|psd|fig)$/i;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const contentItemId = formData.get("contentItemId") as string | null;
  const taskId = formData.get("taskId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Client-side type check is first line of defense; server validates again
  const isAllowedType = ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);
  if (!isAllowedType) {
    return NextResponse.json(
      { error: `File type not allowed. Supported: images, video (mp4/mov/webm), PDF, AI, PSD, Figma` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 100MB limit" }, { status: 413 });
  }

  // Validate contentItemId exists if provided
  if (contentItemId) {
    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId }, select: { id: true } });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  }

  const blob = await put(file.name, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const attachment = await prisma.fileAttachment.create({
    data: {
      filename: file.name,
      blobUrl: blob.url,
      fileType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      uploadedById: session.user.id,
      ...(contentItemId ? { contentItemId } : {}),
      ...(taskId ? { taskId } : {}),
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
