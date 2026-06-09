import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyticsSchema } from "@/lib/validations/analytics.schema";

export async function GET(req: Request, { params }: { params: Promise<{ contentItemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentItemId } = await params;
  const entry = await prisma.analyticsEntry.findUnique({ where: { contentItemId } });
  return NextResponse.json(entry);
}

export async function PUT(req: Request, { params }: { params: Promise<{ contentItemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentItemId } = await params;

  const contentItem = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!contentItem) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contentItem.status !== "PUBLISHED" && contentItem.status !== "ANALYZED") {
    return NextResponse.json({ error: "Analytics only available after publishing" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = analyticsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.analyticsEntry.upsert({
    where: { contentItemId },
    update: { ...parsed.data, enteredById: session.user.id },
    create: { contentItemId, ...parsed.data, enteredById: session.user.id },
  });

  // Log metrics entry
  await prisma.activityLog.create({
    data: {
      contentItemId,
      actorId: session.user.id,
      action: "METRICS_ENTERED",
      payload: parsed.data,
    },
  });

  return NextResponse.json(entry);
}
