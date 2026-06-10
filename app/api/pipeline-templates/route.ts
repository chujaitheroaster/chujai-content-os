import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.pipelineTemplate.findMany({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

const CONTENT_TYPES = ["REELS", "STATIC_POST", "CAROUSEL", "STORY", "SHORT_VIDEO", "LONG_VIDEO"] as const;

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "FACEBOOK"]).nullable().optional(),
  contentType: z.enum(CONTENT_TYPES).nullable().optional(),
  isDefault: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const template = await prisma.pipelineTemplate.create({
    data: { ...parsed.data, createdById: session.user.id },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json(template, { status: 201 });
}
