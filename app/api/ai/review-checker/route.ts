import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/ai/client";
import { REVIEW_SYSTEM_PROMPT, REVIEW_TOOL_SCHEMA, buildReviewPrompt } from "@/lib/ai/prompts/review.prompt";
import type { AIReviewResult } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentItemId } = await req.json();
  if (!contentItemId) return NextResponse.json({ error: "contentItemId required" }, { status: 400 });

  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: REVIEW_SYSTEM_PROMPT,
      tools: [REVIEW_TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "review_result" },
      messages: [
        {
          role: "user",
          content: buildReviewPrompt({
            platform: item.platform,
            contentType: item.contentType,
            caption: item.captionDraft ?? "",
            hashtags: item.hashtagsDraft ?? "",
            brief: item.brief ?? "",
          }),
        },
      ],
    });

    const toolUse = message.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool_use block returned");
    }

    const result = toolUse.input as AIReviewResult;
    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI Review]", err);
    return NextResponse.json({ error: "AI review failed. Please retry." }, { status: 500 });
  }
}
