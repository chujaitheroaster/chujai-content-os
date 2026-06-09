import { z } from "zod";

export const createContentItemSchema = z.object({
  title: z.string().min(1, "กรุณาใส่ชื่อ Content").max(200),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "FACEBOOK"]),
  contentType: z.enum(["REELS", "STATIC_POST", "CAROUSEL", "STORY", "SHORT_VIDEO", "LONG_VIDEO"]),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง"),
  weeklyTheme: z.string().optional(),
  postGoal: z.string().optional(),
  brief: z.string().optional(),
});

export const updateContentItemSchema = createContentItemSchema.partial().extend({
  status: z.enum(["DRAFT", "IN_PROGRESS", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ANALYZED"]).optional(),
  captionDraft: z.string().optional(),
  hashtagsDraft: z.string().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;
export type UpdateContentItemInput = z.infer<typeof updateContentItemSchema>;
