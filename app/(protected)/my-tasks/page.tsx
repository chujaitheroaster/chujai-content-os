import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { PLATFORM_LABELS, TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/utils/platform";

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user) return null;

  const tasks = await prisma.task.findMany({
    where: { assignedToId: session.user.id },
    include: { contentItem: { select: { id: true, title: true, platform: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today && !["DONE", "BLOCKED"].includes(t.status)
  );
  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || ["DONE", "BLOCKED"].includes(t.status)) return false;
    return format(new Date(t.dueDate), "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  });
  const upcoming = tasks.filter((t) => {
    if (!t.dueDate || ["DONE", "BLOCKED"].includes(t.status)) return false;
    const d = new Date(t.dueDate);
    return d > today && format(d, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd");
  });
  const done = tasks.filter((t) => t.status === "DONE").slice(0, 10);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">My Tasks</h1>

      <TaskGroup title="🔴 Overdue" tasks={overdue} />
      <TaskGroup title="🟡 Today" tasks={dueToday} />
      <TaskGroup title="🔵 Upcoming" tasks={upcoming} />
      {done.length > 0 && <TaskGroup title="✅ Done (ล่าสุด)" tasks={done} faded />}
    </div>
  );
}

interface TaskItem {
  id: string;
  stageName: string;
  status: string;
  dueDate: Date | null;
  contentItem: { id: string; title: string; platform: string };
}

function TaskGroup({ title, tasks, faded }: { title: string; tasks: TaskItem[]; faded?: boolean }) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/content/${task.contentItem.id}`}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors ${faded ? "opacity-60" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{task.stageName}</p>
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {task.contentItem.title} · {PLATFORM_LABELS[task.contentItem.platform as keyof typeof PLATFORM_LABELS]}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
                {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
              </span>
              {task.dueDate && (
                <span className="text-xs text-stone-500">{format(new Date(task.dueDate), "d MMM")}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
