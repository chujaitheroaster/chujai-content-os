import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateContentItemSchema } from "@/lib/validations/content-item.schema";
import { sendNotification } from "@/lib/services/lark.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          files: { include: { uploadedBy: { select: { name: true } } } },
        },
        orderBy: { orderIndex: "asc" },
      },
      files: { include: { uploadedBy: { select: { name: true } } } },
      analytics: true,
      activityLogs: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateContentItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only Owner can approve
  if (parsed.data.status === "APPROVED" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only Owner can approve" }, { status: 403 });
  }

  const updated = await prisma.contentItem.update({
    where: { id },
    data: {
      ...parsed.data,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : undefined,
      updatedAt: new Date(),
    },
  });

  // Log status change
  if (parsed.data.status && parsed.data.status !== existing.status) {
    await prisma.activityLog.create({
      data: {
        contentItemId: id,
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        payload: { from: existing.status, to: parsed.data.status },
      },
    });

    // Notify on publish
    if (parsed.data.status === "PUBLISHED") {
      sendNotification("CONTENT_PUBLISHED", {
        contentTitle: updated.title,
        platform: updated.platform,
        contentItemId: id,
      }).catch(console.error);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "OWNER" && role !== "CONTENT_STRATEGIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.contentItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
