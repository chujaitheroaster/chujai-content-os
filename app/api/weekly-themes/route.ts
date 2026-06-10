import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getISOWeek } from "date-fns";

const UpsertSchema = z.object({
  year: z.number().int(),
  weekNumber: z.number().int().min(1).max(53),
  theme: z.string().min(1).max(200),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  const themes = await prisma.weeklyTheme.findMany({
    where: { year },
    orderBy: { weekNumber: "asc" },
  });

  return NextResponse.json(themes);
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

  const { year, weekNumber, theme } = parsed.data;

  const result = await prisma.weeklyTheme.upsert({
    where: { year_weekNumber: { year, weekNumber } },
    update: { theme },
    create: { year, weekNumber, theme, createdById: session.user.id },
  });

  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "CONTENT_STRATEGIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const weekNumber = Number(searchParams.get("week"));

  await prisma.weeklyTheme.deleteMany({ where: { year, weekNumber } });
  return NextResponse.json({ ok: true });
}
