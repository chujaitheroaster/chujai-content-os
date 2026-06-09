import { PrismaClient, Role, Platform, ContentType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Owner user
  const ownerPassword = await bcrypt.hash("chujai2024", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@chujai.co" },
    update: {},
    create: {
      email: "owner@chujai.co",
      name: "เจ้าของ (Owner)",
      passwordHash: ownerPassword,
      role: Role.OWNER,
    },
  });

  // Team members
  const strategistPwd = await bcrypt.hash("chujai2024", 10);
  await prisma.user.upsert({
    where: { email: "strategist@chujai.co" },
    update: {},
    create: {
      email: "strategist@chujai.co",
      name: "Content Strategist",
      passwordHash: strategistPwd,
      role: Role.CONTENT_STRATEGIST,
    },
  });

  await prisma.user.upsert({
    where: { email: "designer@chujai.co" },
    update: {},
    create: {
      email: "designer@chujai.co",
      name: "Designer",
      passwordHash: await bcrypt.hash("chujai2024", 10),
      role: Role.DESIGNER,
    },
  });

  await prisma.user.upsert({
    where: { email: "publisher@chujai.co" },
    update: {},
    create: {
      email: "publisher@chujai.co",
      name: "Publisher",
      passwordHash: await bcrypt.hash("chujai2024", 10),
      role: Role.PUBLISHER,
    },
  });

  console.log("✅ Users created");

  // Pipeline Templates
  const igReelsTemplate = await prisma.pipelineTemplate.create({
    data: {
      name: "IG Reels",
      platform: Platform.INSTAGRAM,
      contentType: ContentType.REELS,
      isDefault: false,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Research", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 7 },
          { name: "Script", orderIndex: 1, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 5 },
          { name: "Design Cover", orderIndex: 2, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 3 },
          { name: "Shoot & Edit", orderIndex: 3, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 2 },
          { name: "Review", orderIndex: 4, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 1, isReviewStage: true },
          { name: "Approved", orderIndex: 5, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 0 },
          { name: "Schedule", orderIndex: 6, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
          { name: "Publish", orderIndex: 7, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  await prisma.pipelineTemplate.create({
    data: {
      name: "IG Static Post",
      platform: Platform.INSTAGRAM,
      contentType: ContentType.STATIC_POST,
      isDefault: false,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Brief", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 4 },
          { name: "Design", orderIndex: 1, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 2 },
          { name: "Caption", orderIndex: 2, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 1 },
          { name: "Review", orderIndex: 3, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 0, isReviewStage: true },
          { name: "Schedule", orderIndex: 4, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
          { name: "Publish", orderIndex: 5, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  await prisma.pipelineTemplate.create({
    data: {
      name: "IG Carousel",
      platform: Platform.INSTAGRAM,
      contentType: ContentType.CAROUSEL,
      isDefault: false,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Research", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 5 },
          { name: "Outline", orderIndex: 1, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 3 },
          { name: "Design Slides", orderIndex: 2, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 2 },
          { name: "Review", orderIndex: 3, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 1, isReviewStage: true },
          { name: "Schedule", orderIndex: 4, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
          { name: "Publish", orderIndex: 5, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  await prisma.pipelineTemplate.create({
    data: {
      name: "TikTok Short Video",
      platform: Platform.TIKTOK,
      contentType: ContentType.SHORT_VIDEO,
      isDefault: false,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Concept", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 5 },
          { name: "Script", orderIndex: 1, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 4 },
          { name: "Shoot", orderIndex: 2, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 2 },
          { name: "Edit", orderIndex: 3, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 1 },
          { name: "Review", orderIndex: 4, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 0, isReviewStage: true },
          { name: "Publish", orderIndex: 5, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  await prisma.pipelineTemplate.create({
    data: {
      name: "Facebook Post",
      platform: Platform.FACEBOOK,
      contentType: ContentType.STATIC_POST,
      isDefault: false,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Brief", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 3 },
          { name: "Design", orderIndex: 1, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 1 },
          { name: "Review", orderIndex: 2, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 0, isReviewStage: true },
          { name: "Publish", orderIndex: 3, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  // Global default template (fallback)
  await prisma.pipelineTemplate.create({
    data: {
      name: "Default Pipeline",
      isDefault: true,
      createdById: owner.id,
      stages: {
        create: [
          { name: "Research", orderIndex: 0, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 5 },
          { name: "Draft", orderIndex: 1, defaultAssigneeRole: Role.CONTENT_STRATEGIST, dueDateOffsetDays: 3 },
          { name: "Design", orderIndex: 2, defaultAssigneeRole: Role.DESIGNER, dueDateOffsetDays: 2 },
          { name: "Review", orderIndex: 3, defaultAssigneeRole: Role.OWNER, dueDateOffsetDays: 1, isReviewStage: true },
          { name: "Publish", orderIndex: 4, defaultAssigneeRole: Role.PUBLISHER, dueDateOffsetDays: 0 },
        ],
      },
    },
  });

  console.log("✅ Pipeline templates created");
  console.log(`\n🚀 Seed complete!`);
  console.log(`   Owner: owner@chujai.co / chujai2024`);
  console.log(`   Strategist: strategist@chujai.co / chujai2024`);
  console.log(`   Designer: designer@chujai.co / chujai2024`);
  console.log(`   Publisher: publisher@chujai.co / chujai2024`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
