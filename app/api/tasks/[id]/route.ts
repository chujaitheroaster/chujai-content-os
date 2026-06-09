import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task.schema";
import { sendNotification } from "@/lib/services/lark.service";
import { createApprovalToken } from "@/lib/services/lark.service";
import { format } from "date-fns";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    include: { contentItem: true, assignedTo: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if ("dueDate" in parsed.data) {
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate!) : null;
  }

  const prevAssigneeId = existing.assignedToId;
  if ("assignedToId" in parsed.data) {
    data.assignedToId = parsed.data.assignedToId;
  }

  if (data.status === "DONE") {
    data.completedAt = new Date();
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      contentItem: { select: { id: true, title: true, platform: true } },
    },
  });

  // Log changes
  const logActions: Promise<unknown>[] = [];

  if (parsed.data.status && parsed.data.status !== existing.status) {
    logActions.push(
      prisma.activityLog.create({
        data: {
          contentItemId: existing.contentItemId,
          taskId: id,
          actorId: session.user.id,
          action: "STATUS_CHANGE",
          payload: { from: existing.status, to: parsed.data.status, taskName: existing.stageName },
        },
      })
    );
  }

  if ("assignedToId" in parsed.data && parsed.data.assignedToId !== prevAssigneeId) {
    logActions.push(
      prisma.activityLog.create({
        data: {
          contentItemId: existing.contentItemId,
          taskId: id,
          actorId: session.user.id,
          action: "ASSIGNMENT",
          payload: { from: prevAssigneeId, to: parsed.data.assignedToId, taskName: existing.stageName },
        },
      })
    );

    // Notify new assignee
    if (parsed.data.assignedToId && updated.assignedTo) {
      sendNotification("TASK_ASSIGNED", {
        taskName: existing.stageName,
        contentTitle: existing.contentItem.title,
        contentItemId: existing.contentItemId,
        dueDate: data.dueDate ? format(data.dueDate as Date, "d MMM yyyy") : undefined,
      }).catch(console.error);
    }

    // Notify previous assignee if being replaced
    if (prevAssigneeId && parsed.data.assignedToId && prevAssigneeId !== parsed.data.assignedToId) {
      // Log notification for reassignment (Lark doesn't have direct-message in webhook mode, just send to group)
    }
  }

  await Promise.all(logActions);

  // "Send for Review" action
  if (body.action === "SEND_FOR_REVIEW" && existing.isReviewStage) {
    const token = await createApprovalToken(existing.contentItemId, id);

    await prisma.task.update({ where: { id }, data: { reviewRequestSentAt: new Date() } });
    await prisma.contentItem.update({
      where: { id: existing.contentItemId },
      data: { status: "IN_REVIEW" },
    });

    const contentItem = await prisma.contentItem.findUnique({ where: { id: existing.contentItemId } });

    await sendNotification("REVIEW_REQUESTED", {
      contentTitle: existing.contentItem.title,
      platform: existing.contentItem.platform,
      captionPreview: contentItem?.captionDraft?.substring(0, 200) ?? null,
      contentItemId: existing.contentItemId,
      token,
    });

    await prisma.activityLog.create({
      data: {
        contentItemId: existing.contentItemId,
        taskId: id,
        actorId: session.user.id,
        action: "REVIEW_REQUESTED",
        payload: { taskName: existing.stageName },
      },
    });
  }

  return NextResponse.json(updated);
}
