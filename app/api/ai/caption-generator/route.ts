import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/ai/client";
import { CAPTION_SYSTEM_PROMPT, buildCaptionPrompt } from "@/lib/ai/prompts/caption.prompt";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentItemId } = await req.json();
  if (!contentItemId) return NextResponse.json({ error: "contentItemId required" }, { status: 400 });

  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: CAPTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildCaptionPrompt({
            platform: item.platform,
            contentType: item.contentType,
            weeklyTheme: item.weeklyTheme ?? "",
            brief: item.brief ?? "",
          }),
        },
      ],
    });

    const caption =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { captionDraft: caption },
    });

    return NextResponse.json({ caption });
  } catch (err) {
    console.error("[AI Caption]", err);
    return NextResponse.json({ error: "AI generation failed. Please retry." }, { status: 500 });
  }
}
