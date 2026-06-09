import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContentItemSchema } from "@/lib/validations/content-item.schema";
import { generateTasksForContentItem } from "@/lib/services/pipeline.service";
import type { Platform, ContentType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const platform = searchParams.get("platform") as Platform | null;

  const where: Record<string, unknown> = {};

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    where.targetDate = { gte: start, lte: end };
  }

  if (platform) {
    where.platform = platform;
  }

  // Role-based scoping
  const role = session.user.role;
  if (role === "DESIGNER" || role === "PUBLISHER") {
    where.tasks = { some: { assignedToId: session.user.id } };
  }

  const items = await prisma.contentItem.findMany({
    where,
    include: {
      tasks: {
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: { orderIndex: "asc" },
      },
      analytics: true,
    },
    orderBy: { targetDate: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "OWNER" && role !== "CONTENT_STRATEGIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createContentItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, platform, contentType, targetDate, weeklyTheme, postGoal, brief } = parsed.data;
  const targetDateObj = new Date(targetDate);

  const contentItem = await prisma.$transaction(async (tx) => {
    const item = await tx.contentItem.create({
      data: {
        title,
        platform: platform as Platform,
        contentType: contentType as ContentType,
        targetDate: targetDateObj,
        weeklyTheme: weeklyTheme ?? null,
        postGoal: postGoal ?? null,
        brief: brief ?? null,
        createdById: session.user.id,
      },
    });

    await generateTasksForContentItem(
      item.id,
      platform as Platform,
      contentType as ContentType,
      targetDateObj,
      tx as Parameters<typeof generateTasksForContentItem>[4]
    );

    return item;
  });

  const result = await prisma.contentItem.findUnique({
    where: { id: contentItem.id },
    include: {
      tasks: { orderBy: { orderIndex: "asc" } },
      analytics: true,
    },
  });

  return NextResponse.json(result, { status: 201 });
}
