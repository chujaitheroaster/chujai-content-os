import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let where = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where = { date: { gte: start, lt: end } };
  }

  const days = await prisma.blockedDay.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(days);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { date, reason } = parsed.data;
  const dateObj = new Date(date + "T00:00:00.000Z");

  // Check for content on this day
  const existingContent = await prisma.contentItem.count({
    where: { targetDate: { gte: dateObj, lt: new Date(dateObj.getTime() + 86400000) } },
  });

  const blocked = await prisma.blockedDay.upsert({
    where: { date: dateObj },
    update: { reason: reason ?? null },
    create: { date: dateObj, reason: reason ?? null, createdById: session.user.id },
  });

  return NextResponse.json({ ...blocked, hasExistingContent: existingContent > 0 }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const dateObj = new Date(date + "T00:00:00.000Z");
  await prisma.blockedDay.deleteMany({ where: { date: dateObj } });

  return NextResponse.json({ ok: true });
}
