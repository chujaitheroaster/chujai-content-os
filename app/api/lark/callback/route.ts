import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLarkSignature } from "@/lib/lark/verify";
import { sendNotification } from "@/lib/services/lark.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const action = searchParams.get("action") as "APPROVE" | "REQUEST_CHANGES" | null;

  if (!token || !action) {
    return new Response("Bad Request", { status: 400 });
  }

  const tokenRecord = await prisma.larkMessageToken.findUnique({ where: { token } });

  if (!tokenRecord) return new Response("Invalid token", { status: 400 });
  if (tokenRecord.usedAt) return new Response("Token already used", { status: 400 });
  if (new Date() > tokenRecord.expiresAt) return new Response("Token expired", { status: 400 });

  const contentItem = await prisma.contentItem.findUnique({
    where: { id: tokenRecord.contentItemId },
  });
  if (!contentItem) return new Response("Content not found", { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.larkMessageToken.update({ where: { token }, data: { usedAt: new Date() } });

    if (action === "APPROVE") {
      await tx.contentItem.update({
        where: { id: tokenRecord.contentItemId },
        data: { status: "APPROVED" },
      });
      await tx.activityLog.create({
        data: {
          contentItemId: tokenRecord.contentItemId,
          taskId: tokenRecord.taskId,
          actorId: "lark-bot",
          action: "APPROVED",
          payload: { via: "lark" },
        },
      });
    } else {
      await tx.contentItem.update({
        where: { id: tokenRecord.contentItemId },
        data: { status: "IN_PROGRESS" },
      });
      await tx.activityLog.create({
        data: {
          contentItemId: tokenRecord.contentItemId,
          taskId: tokenRecord.taskId,
          actorId: "lark-bot",
          action: "CHANGES_REQUESTED",
          payload: { via: "lark" },
        },
      });
    }
  });

  // Send follow-up notification
  if (action === "APPROVE") {
    sendNotification("APPROVED", {
      contentTitle: contentItem.title,
      contentItemId: contentItem.id,
    }).catch(console.error);
  } else {
    sendNotification("CHANGES_REQUESTED", {
      contentTitle: contentItem.title,
      contentItemId: contentItem.id,
    }).catch(console.error);
  }

  // Redirect to content page in browser (when Owner taps button in Lark app)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return Response.redirect(`${appUrl}/content/${tokenRecord.contentItemId}?action=${action}`, 302);
}

export async function POST(req: Request) {
  const body = await req.text();
  const timestamp = req.headers.get("x-lark-request-timestamp") ?? "";
  const nonce = req.headers.get("x-lark-request-nonce") ?? "";
  const signature = req.headers.get("x-lark-signature") ?? "";

  if (process.env.LARK_VERIFICATION_TOKEN) {
    const valid = verifyLarkSignature(timestamp, nonce, body, signature);
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);

  // Lark challenge verification
  if (data.type === "url_verification") {
    return NextResponse.json({ challenge: data.challenge });
  }

  return NextResponse.json({ ok: true });
}
