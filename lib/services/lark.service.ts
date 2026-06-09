import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { addHours } from "date-fns";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getLarkWebhook(): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "lark_webhook_url" } });
  return setting?.value ?? null;
}

async function sendToLark(webhookUrl: string, body: object): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[Lark] Failed to send notification:", await res.text());
  }
}

export type LarkNotificationType =
  | "TASK_ASSIGNED"
  | "TASK_OVERDUE"
  | "REVIEW_REQUESTED"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "APPROVE_REMINDER"
  | "CONTENT_PUBLISHED";

export async function sendNotification(
  type: LarkNotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = await getLarkWebhook();
  if (!webhookUrl) return; // Lark not configured yet

  const card = buildCard(type, payload);
  if (!card) return;

  try {
    await sendToLark(webhookUrl, card);
  } catch (err) {
    console.error("[Lark] Error:", err);
  }
}

export async function createApprovalToken(
  contentItemId: string,
  taskId: string | null
): Promise<string> {
  const token = randomUUID();
  await prisma.larkMessageToken.create({
    data: {
      contentItemId,
      taskId,
      actionType: "APPROVE",
      token,
      expiresAt: addHours(new Date(), 48),
    },
  });
  return token;
}

function buildCard(type: LarkNotificationType, payload: Record<string, unknown>): object | null {
  switch (type) {
    case "TASK_ASSIGNED":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "📋 งานใหม่มาแล้ว!" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**Task:** ${payload.taskName}\n**Content:** ${payload.contentTitle}\n**Due:** ${payload.dueDate ?? "ยังไม่กำหนด"}`,
              },
            },
            {
              tag: "action",
              actions: [
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "ดู Content" },
                  type: "primary",
                  url: `${APP_URL}/content/${payload.contentItemId}`,
                },
              ],
            },
          ],
        },
      };

    case "TASK_OVERDUE":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "⚠️ Task เลยกำหนดแล้ว!" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**Task:** ${payload.taskName}\n**Content:** ${payload.contentTitle}\n**ถือโดย:** ${payload.assigneeName}\n**กำหนด:** ${payload.dueDate}`,
              },
            },
          ],
        },
      };

    case "REVIEW_REQUESTED":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "📝 ขอ Approve Content" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**Content:** ${payload.contentTitle}\n**Platform:** ${payload.platform}\n\n**Caption Preview:**\n${payload.captionPreview ?? "(ยังไม่มี Caption)"}`,
              },
            },
            {
              tag: "action",
              actions: [
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "✅ Approve" },
                  type: "primary",
                  url: `${APP_URL}/api/lark/callback?token=${payload.token}&action=APPROVE`,
                },
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "🔄 ขอแก้ไข" },
                  type: "danger",
                  url: `${APP_URL}/api/lark/callback?token=${payload.token}&action=REQUEST_CHANGES`,
                },
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "ดูรายละเอียด" },
                  type: "default",
                  url: `${APP_URL}/content/${payload.contentItemId}`,
                },
              ],
            },
          ],
        },
      };

    case "APPROVED":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "✅ Approved แล้ว!" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**${payload.contentTitle}** ได้รับการ Approve แล้ว — พร้อม Schedule!`,
              },
            },
          ],
        },
      };

    case "CHANGES_REQUESTED":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "🔄 ต้องแก้ไข" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**${payload.contentTitle}** ต้องแก้ไขก่อน Approve\n\n${payload.comment ?? ""}`,
              },
            },
            {
              tag: "action",
              actions: [
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "แก้ไข Content" },
                  type: "primary",
                  url: `${APP_URL}/content/${payload.contentItemId}`,
                },
              ],
            },
          ],
        },
      };

    case "APPROVE_REMINDER":
      return {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "⏰ Reminder: ยังรอ Approve" } },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: `**${payload.contentTitle}** ยังรอ Approve อยู่ (ส่งไปเมื่อ ${payload.sentAt})`,
              },
            },
            {
              tag: "action",
              actions: [
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "✅ Approve" },
                  type: "primary",
                  url: `${APP_URL}/api/lark/callback?token=${payload.token}&action=APPROVE`,
                },
                {
                  tag: "button",
                  text: { tag: "plain_text", content: "🔄 ขอแก้ไข" },
                  type: "danger",
                  url: `${APP_URL}/api/lark/callback?token=${payload.token}&action=REQUEST_CHANGES`,
                },
              ],
            },
          ],
        },
      };

    case "CONTENT_PUBLISHED":
      return {
        msg_type: "text",
        content: {
          text: `🚀 "${payload.contentTitle}" โพสต์แล้วบน ${payload.platform}!`,
        },
      };

    default:
      return null;
  }
}
