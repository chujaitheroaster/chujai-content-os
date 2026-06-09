import type { Platform, ContentStatus, TaskStatus } from "@/types";

export const PLATFORM_COLORS: Record<Platform, string> = {
  INSTAGRAM: "#E1306C",
  TIKTOK: "#000000",
  FACEBOOK: "#1877F2",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ANALYZED: "Analyzed",
};

export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ANALYZED: "bg-indigo-100 text-indigo-700",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังทำ",
  DONE: "เสร็จแล้ว",
  BLOCKED: "ติดขัด",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  BLOCKED: "bg-red-100 text-red-700",
};
