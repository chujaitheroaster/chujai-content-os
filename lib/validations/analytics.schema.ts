import { z } from "zod";

export const analyticsSchema = z.object({
  views: z.number().int().min(0).optional().nullable(),
  reach: z.number().int().min(0).optional().nullable(),
  likes: z.number().int().min(0).optional().nullable(),
  comments: z.number().int().min(0).optional().nullable(),
  shares: z.number().int().min(0).optional().nullable(),
  saves: z.number().int().min(0).optional().nullable(),
});

export type AnalyticsInput = z.infer<typeof analyticsSchema>;
