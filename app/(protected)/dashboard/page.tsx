import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { PLATFORM_LABELS, TASK_STATUS_COLORS, CONTENT_STATUS_COLORS } from "@/lib/utils/platform";

async function getDashboardData(userId: string, role: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [myTasks, pendingApprovals, thisMonthPublished, monthlyGoal] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { notIn: ["DONE", "BLOCKED"] },
      },
      include: { contentItem: { select: { id: true, title: true, platform: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    role === "OWNER"
      ? prisma.contentItem.findMany({
          where: { status: "IN_REVIEW" },
          orderBy: { updatedAt: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.contentItem.count({
      where: {
        status: "PUBLISHED",
        targetDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lte: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        },
      },
    }),
    prisma.monthlyGoal.findFirst({
      where: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        platform: null,
      },
    }),
  ]);

  const overdueCount = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today
  ).length;
  const todayCount = myTasks.filter((t) => {
    if (!t.dueDate) return false;
    return format(new Date(t.dueDate), "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  }).length;

  return { myTasks, pendingApprovals, overdueCount, todayCount, thisMonthPublished, goalCount: monthlyGoal?.goalCount ?? 0 };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { myTasks, pendingApprovals, overdueCount, todayCount, thisMonthPublished, goalCount } =
    await getDashboardData(session.user.id, session.user.role);

  const today = new Date();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">สวัสดี, {session.user.name} 👋</h1>
          <p className="text-stone-500 text-sm mt-1">{format(today, "EEEE d MMMM yyyy")}</p>
        </div>
        <Link
          href="/calendar"
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          + New Content
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Task เกินกำหนด" value={overdueCount} color="text-red-600" />
        <StatCard label="Task วันนี้" value={todayCount} color="text-amber-600" />
        <StatCard label="โพสต์แล้วเดือนนี้" value={thisMonthPublished} color="text-green-600" />
        <StatCard
          label="เป้าหมายเดือนนี้"
          value={goalCount > 0 ? `${thisMonthPublished}/${goalCount}` : "ไม่ระบุ"}
          color="text-stone-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">My Tasks</h2>
            <Link href="/my-tasks" className="text-sm text-stone-500 hover:text-stone-700">
              ดูทั้งหมด →
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <p className="text-stone-400 text-sm py-4">ไม่มี Task ที่ค้างอยู่ 🎉</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 8).map((task) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = task.dueDate && new Date(task.dueDate) < today;
                return (
                  <Link
                    key={task.id}
                    href={`/content/${task.contentItem.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {task.stageName}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {task.contentItem.title} · {PLATFORM_LABELS[task.contentItem.platform]}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-stone-500"}`}>
                        {task.dueDate ? format(new Date(task.dueDate), "d MMM") : "—"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Approvals (Owner only) */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">
              {session.user.role === "OWNER" ? "รอ Approve" : "Performance เดือนนี้"}
            </h2>
            {session.user.role === "OWNER" && (
              <Link href="/approvals" className="text-sm text-stone-500 hover:text-stone-700">
                ดูทั้งหมด →
              </Link>
            )}
          </div>

          {session.user.role === "OWNER" ? (
            pendingApprovals.length === 0 ? (
              <p className="text-stone-400 text-sm py-4">ไม่มีรอ Approve ✅</p>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="block p-3 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-stone-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-500">{PLATFORM_LABELS[item.platform]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CONTENT_STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-6 text-stone-400">
              <p className="text-3xl mb-2">{thisMonthPublished}</p>
              <p className="text-sm">Content โพสต์แล้ว</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          href="/calendar"
          className="flex-1 py-3 text-center bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          📅 Content Calendar
        </Link>
        <Link
          href="/my-tasks"
          className="flex-1 py-3 text-center bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          ✅ My Tasks
        </Link>
        <Link
          href="/performance"
          className="flex-1 py-3 text-center bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          📊 Performance
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
