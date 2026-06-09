import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { PLATFORM_LABELS } from "@/lib/utils/platform";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const pending = await prisma.contentItem.findMany({
    where: { status: "IN_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: {
      tasks: { where: { isReviewStage: true }, take: 1 },
      createdBy: { select: { name: true } },
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Approval Queue</h1>
        <span className="text-sm text-stone-500">{pending.length} รายการรอ Approve</span>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-stone-500">ไม่มีรายการรอ Approve</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => {
            const reviewTask = item.tasks[0];
            const waitingHours = reviewTask?.reviewRequestSentAt
              ? Math.floor((Date.now() - new Date(reviewTask.reviewRequestSentAt).getTime()) / 3_600_000)
              : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-stone-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-900">{item.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {PLATFORM_LABELS[item.platform]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-stone-500">
                      <span>โดย: {item.createdBy.name}</span>
                      <span>เป้าหมาย: {format(new Date(item.targetDate), "d MMM yyyy")}</span>
                      {waitingHours !== null && (
                        <span className={waitingHours >= 24 ? "text-red-500 font-medium" : ""}>
                          รอ {waitingHours} ชม.
                          {waitingHours >= 24 ? " ⚠️ เลย 24 ชม." : ""}
                        </span>
                      )}
                    </div>
                    {item.captionDraft && (
                      <p className="mt-2 text-sm text-stone-600 bg-stone-50 p-3 rounded-lg line-clamp-3">
                        {item.captionDraft}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/content/${item.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 text-center"
                    >
                      ดูรายละเอียด
                    </Link>
                    <ApproveButton contentItemId={item.id} action="APPROVE" />
                    <ApproveButton contentItemId={item.id} action="REJECT" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApproveButton({ contentItemId, action }: { contentItemId: string; action: "APPROVE" | "REJECT" }) {
  return (
    <form
      action={async () => {
        "use server";
        const { prisma } = await import("@/lib/prisma");
        if (action === "APPROVE") {
          await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: "APPROVED" } });
        } else {
          await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: "IN_PROGRESS" } });
        }
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/approvals");
      }}
    >
      <button
        type="submit"
        className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          action === "APPROVE"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-white text-stone-600 border border-stone-300 hover:bg-stone-50"
        }`}
      >
        {action === "APPROVE" ? "✅ Approve" : "🔄 ขอแก้ไข"}
      </button>
    </form>
  );
}
