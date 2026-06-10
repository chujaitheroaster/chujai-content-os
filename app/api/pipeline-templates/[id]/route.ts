import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ContentType } from "@prisma/client";

const CONTENT_TYPES = ["REELS", "STATIC_POST", "CAROUSEL", "STORY", "SHORT_VIDEO", "LONG_VIDEO"] as const;

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "FACEBOOK"]).nullable().optional(),
  contentType: z.enum(CONTENT_TYPES).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const template = await prisma.pipelineTemplate.update({
    where: { id },
    data: parsed.data,
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.pipelineTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
