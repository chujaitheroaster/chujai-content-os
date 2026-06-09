import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification, createApprovalToken } from "@/lib/services/lark.service";
import { subHours, format } from "date-fns";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threshold = subHours(new Date(), 23);

  const pendingReviews = await prisma.contentItem.findMany({
    where: {
      status: "IN_REVIEW",
      tasks: {
        some: {
          isReviewStage: true,
          reviewRequestSentAt: { lte: threshold, not: null },
        },
      },
    },
    include: {
      tasks: { where: { isReviewStage: true } },
    },
  });

  let reminded = 0;
  for (const item of pendingReviews) {
    const reviewTask = item.tasks[0];
    const token = await createApprovalToken(item.id, reviewTask?.id ?? null);

    await sendNotification("APPROVE_REMINDER", {
      contentTitle: item.title,
      contentItemId: item.id,
      sentAt: reviewTask?.reviewRequestSentAt
        ? format(reviewTask.reviewRequestSentAt, "d MMM yyyy HH:mm")
        : "ไม่ทราบ",
      token,
    });
    reminded++;
  }

  return NextResponse.json({ checked: pendingReviews.length, reminded });
}
