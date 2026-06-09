import { prisma } from "@/lib/prisma";
import type { Platform, ContentType, PrismaClient } from "@prisma/client";
import { addDays, subDays } from "date-fns";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function findTemplate(platform: Platform, contentType: ContentType, tx: Tx) {
  // 1. Exact match
  let template = await tx.pipelineTemplate.findFirst({
    where: { platform, contentType, isDefault: false },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  // 2. Platform default
  if (!template) {
    template = await tx.pipelineTemplate.findFirst({
      where: { platform, contentType: null, isDefault: true },
      include: { stages: { orderBy: { orderIndex: "asc" } } },
    });
  }

  // 3. Global default
  if (!template) {
    template = await tx.pipelineTemplate.findFirst({
      where: { platform: null, contentType: null, isDefault: true },
      include: { stages: { orderBy: { orderIndex: "asc" } } },
    });
  }

  return template;
}

export async function generateTasksForContentItem(
  contentItemId: string,
  platform: Platform,
  contentType: ContentType,
  targetDate: Date,
  tx?: Tx
): Promise<void> {
  const db = tx ?? prisma;
  const template = await findTemplate(platform, contentType, db as Tx);

  if (!template || template.stages.length === 0) return;

  const tasks = template.stages.map((stage) => ({
    contentItemId,
    stageName: stage.name,
    orderIndex: stage.orderIndex,
    isReviewStage: stage.isReviewStage,
    dueDate: stage.dueDateOffsetDays > 0
      ? subDays(targetDate, stage.dueDateOffsetDays)
      : targetDate,
  }));

  await db.task.createMany({ data: tasks });
}

export async function regenerateTasksForContentItem(
  contentItemId: string,
  platform: Platform,
  contentType: ContentType,
  targetDate: Date
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany({ where: { contentItemId } });
    await generateTasksForContentItem(contentItemId, platform, contentType, targetDate, tx as Tx);
  });
}
