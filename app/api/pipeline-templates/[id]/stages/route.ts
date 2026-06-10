import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Role } from "@prisma/client";

const StageSchema = z.object({
  name: z.string().min(1).max(100),
  orderIndex: z.number().int().min(0),
  defaultAssigneeRole: z.enum(["OWNER", "CONTENT_STRATEGIST", "DESIGNER", "PUBLISHER"]).nullable().optional(),
  dueDateOffsetDays: z.number().int().min(0).default(0),
  isReviewStage: z.boolean().optional().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: templateId } = await params;
  const body = await req.json();
  const parsed = StageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const stage = await prisma.pipelineTemplateStage.create({
    data: {
      ...parsed.data,
      defaultAssigneeRole: (parsed.data.defaultAssigneeRole ?? null) as Role | null,
      templateId,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: templateId } = await params;
  const body = await req.json() as Array<{ id?: string; name: string; orderIndex: number; defaultAssigneeRole?: string | null; dueDateOffsetDays: number; isReviewStage: boolean }>;

  // Replace all stages in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.pipelineTemplateStage.deleteMany({ where: { templateId } });
    await tx.pipelineTemplateStage.createMany({
      data: body.map((s) => ({
        templateId,
        name: s.name,
        orderIndex: s.orderIndex,
        defaultAssigneeRole: (s.defaultAssigneeRole ?? null) as Role | null,
        dueDateOffsetDays: s.dueDateOffsetDays,
        isReviewStage: s.isReviewStage ?? false,
      })),
    });
  });

  const updated = await prisma.pipelineTemplate.findUnique({
    where: { id: templateId },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json(updated);
}
