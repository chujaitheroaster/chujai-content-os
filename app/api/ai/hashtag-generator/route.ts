import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/ai/client";
import { HASHTAG_SYSTEM_PROMPT, buildHashtagPrompt } from "@/lib/ai/prompts/hashtag.prompt";

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
      max_tokens: 512,
      system: HASHTAG_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildHashtagPrompt({
            platform: item.platform,
            caption: item.captionDraft ?? "",
          }),
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(raw);
    } catch {
      hashtags = raw.match(/#[\w฀-๿]+/g) ?? [];
    }

    const hashtagsStr = hashtags.join(" ");

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { hashtagsDraft: hashtagsStr },
    });

    return NextResponse.json({ hashtags });
  } catch (err) {
    console.error("[AI Hashtag]", err);
    return NextResponse.json({ error: "AI generation failed. Please retry." }, { status: 500 });
  }
}
