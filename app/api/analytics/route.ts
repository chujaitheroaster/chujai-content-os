import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as Platform | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { status: { in: ["PUBLISHED", "ANALYZED"] } };
  if (platform) where.platform = platform;
  if (from || to) {
    where.targetDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const items = await prisma.contentItem.findMany({
    where: { ...where, analytics: { isNot: null } },
    include: { analytics: true },
    orderBy: { targetDate: "desc" },
  });

  return NextResponse.json(items);
}
