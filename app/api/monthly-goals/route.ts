import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Platform } from "@prisma/client";

const UpsertSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "FACEBOOK"]).nullable().optional(),
  goalCount: z.number().int().min(0),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const goals = await prisma.monthlyGoal.findMany({
    where: { year, ...(month ? { month } : {}) },
    orderBy: [{ month: "asc" }, { platform: "asc" }],
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "CONTENT_STRATEGIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { year, month, platform, goalCount } = parsed.data;

  const platformValue = (platform ?? null) as Platform | null;

  // Prisma upsert with nullable unique field requires findFirst+update/create pattern
  const existing = await prisma.monthlyGoal.findFirst({ where: { year, month, platform: platformValue } });
  const result = existing
    ? await prisma.monthlyGoal.update({ where: { id: existing.id }, data: { goalCount } })
    : await prisma.monthlyGoal.create({ data: { year, month, platform: platformValue, goalCount, createdById: session.user.id } });

  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.monthlyGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
