import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PLATFORM_LABELS, CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS } from "@/lib/utils/platform";
import { TaskPipeline } from "@/components/tasks/TaskPipeline";
import { AiToolsPanel } from "@/components/ai/AiToolsPanel";
import { AnalyticsForm } from "@/components/content/AnalyticsForm";
import { EditableContentSection } from "@/components/content/EditableContentSection";
import Link from "next/link";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const [item, teamMembers] = await Promise.all([
    prisma.contentItem.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            files: { include: { uploadedBy: { select: { name: true } } } },
          },
          orderBy: { orderIndex: "asc" },
        },
        files: { include: { uploadedBy: { select: { name: true } } } },
        analytics: true,
        activityLogs: {
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!item) notFound();

  const canApprove = session.user.role === "OWNER";
  const isPublished = item.status === "PUBLISHED" || item.status === "ANALYZED";

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/calendar" className="text-stone-400 hover:text-stone-600 mt-1">←</Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-stone-900 truncate">{item.title}</h1>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: PLATFORM_LABELS[item.platform] === "Instagram" ? "#FCE7F3"
                    : PLATFORM_LABELS[item.platform] === "TikTok" ? "#F3F4F6"
                    : "#EBF5FF",
                  color: PLATFORM_LABELS[item.platform] === "Instagram" ? "#9D174D"
                    : PLATFORM_LABELS[item.platform] === "TikTok" ? "#111827"
                    : "#1D4ED8",
                }}
              >
                {PLATFORM_LABELS[item.platform]}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CONTENT_STATUS_COLORS[item.status]}`}>
                {CONTENT_STATUS_LABELS[item.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
              <span>📅 {format(new Date(item.targetDate), "d MMMM yyyy")}</span>
              <span>🎯 {item.contentType.replace("_", " ")}</span>
              {item.weeklyTheme && <span>🏷 {item.weeklyTheme}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Task Pipeline + Content Brief */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Pipeline */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="font-semibold text-stone-900 mb-4">Task Pipeline</h2>
              <TaskPipeline
                tasks={item.tasks as Parameters<typeof TaskPipeline>[0]["tasks"]}
                contentItemId={id}
                teamMembers={teamMembers}
                currentUserId={session.user.id}
                currentUserRole={session.user.role}
                contentStatus={item.status}
              />
            </div>

            {/* Editable: Brief, Caption, Hashtags, Files */}
            <EditableContentSection
              contentItemId={id}
              brief={item.brief}
              postGoal={item.postGoal}
              captionDraft={item.captionDraft}
              hashtagsDraft={item.hashtagsDraft}
              files={item.files as Parameters<typeof EditableContentSection>[0]["files"]}
            />

            {/* Analytics (Published only) */}
            {isPublished && (
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h2 className="font-semibold text-stone-900 mb-4">Analytics</h2>
                <AnalyticsForm
                  contentItemId={id}
                  initialData={item.analytics}
                  isPublished={isPublished}
                />
              </div>
            )}

            {/* Activity Log */}
            {item.activityLogs.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h2 className="font-semibold text-stone-900 mb-3">Activity</h2>
                <div className="space-y-3">
                  {item.activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0 mt-0.5">
                        {(log.actor?.name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-stone-700">{log.actor?.name ?? "System"}</span>
                        <span className="text-stone-500"> · {log.action.replace("_", " ")}</span>
                        <p className="text-xs text-stone-400">
                          {format(new Date(log.createdAt), "d MMM HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Tools Panel */}
          <div className="space-y-4">
            <AiToolsPanel
              contentItemId={id}
              captionDraft={item.captionDraft}
              canApprove={canApprove}
              contentStatus={item.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
