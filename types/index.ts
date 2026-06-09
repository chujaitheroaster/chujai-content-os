import type {
  Role,
  Platform,
  ContentType,
  ContentStatus,
  TaskStatus,
  ActivityAction,
} from "@prisma/client";

export type { Role, Platform, ContentType, ContentStatus, TaskStatus, ActivityAction };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ContentItemWithTasks {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  targetDate: Date;
  weeklyTheme: string | null;
  status: ContentStatus;
  brief: string | null;
  captionDraft: string | null;
  hashtagsDraft: string | null;
  postGoal: string | null;
  createdById: string;
  tasks: TaskWithAssignee[];
  analytics: AnalyticsEntryData | null;
  files: FileAttachmentData[];
  activityLogs: ActivityLogData[];
}

export interface TaskWithAssignee {
  id: string;
  contentItemId: string;
  stageName: string;
  orderIndex: number;
  status: TaskStatus;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  dueDate: Date | null;
  notes: string | null;
  isReviewStage: boolean;
  files: FileAttachmentData[];
}

export interface FileAttachmentData {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSizeBytes: number | null;
  createdAt: Date;
  uploadedBy: { name: string };
}

export interface AnalyticsEntryData {
  id: string;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  enteredAt: Date;
}

export interface ActivityLogData {
  id: string;
  action: ActivityAction;
  payload: unknown;
  createdAt: Date;
  actor: { name: string };
}

export interface CalendarContentItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  targetDate: string;
  status: ContentStatus;
  weeklyTheme: string | null;
}

export interface MyTask {
  id: string;
  stageName: string;
  dueDate: Date | null;
  status: TaskStatus;
  contentItem: {
    id: string;
    title: string;
    platform: Platform;
  };
}

export type AIReviewWarning = {
  category: "CAPTION_LENGTH" | "CTA_PRESENT" | "HASHTAG_COUNT" | "GRAMMAR" | "BRAND_VOICE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  suggestion: string;
};

export type AIReviewResult = {
  warnings: AIReviewWarning[];
  overallScore: number;
};
