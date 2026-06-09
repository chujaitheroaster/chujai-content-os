import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/services/lark.service";
import { format } from "date-fns";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: today },
      status: { notIn: ["DONE", "BLOCKED"] },
      assignedToId: { not: null },
    },
    include: {
      assignedTo: { select: { name: true } },
      contentItem: { select: { id: true, title: true } },
    },
  });

  let notified = 0;
  for (const task of overdueTasks) {
    await sendNotification("TASK_OVERDUE", {
      taskName: task.stageName,
      contentTitle: task.contentItem.title,
      contentItemId: task.contentItem.id,
      assigneeName: task.assignedTo?.name ?? "ไม่ระบุ",
      dueDate: task.dueDate ? format(task.dueDate, "d MMM yyyy") : "",
    });
    notified++;
  }

  return NextResponse.json({ checked: overdueTasks.length, notified });
}
