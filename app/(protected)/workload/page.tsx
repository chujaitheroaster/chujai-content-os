import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { PLATFORM_LABELS, TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/utils/platform";

export default async function WorkloadPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      tasksAssigned: {
        where: { status: { notIn: ["DONE", "BLOCKED"] } },
        include: { contentItem: { select: { id: true, title: true, platform: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Team Workload</h1>

      <div className="space-y-4">
        {users.map((user) => {
          const overdue = user.tasksAssigned.filter(
            (t) => t.dueDate && new Date(t.dueDate) < today
          );
          return (
            <div key={user.id} className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-sm font-bold text-stone-700">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{user.name}</p>
                    <p className="text-xs text-stone-500">{user.role.replace("_", " ")} · {user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-stone-500">{user.tasksAssigned.length} Active</span>
                  {overdue.length > 0 && (
                    <span className="text-red-600 font-medium">{overdue.length} Overdue</span>
                  )}
                </div>
              </div>

              {user.tasksAssigned.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-stone-100">
                  {user.tasksAssigned.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <Link
                        href={`/content/${task.contentItem.id}`}
                        className="flex-1 min-w-0 flex items-center gap-2 text-sm hover:text-stone-700"
                      >
                        <span className="text-stone-900 truncate">{task.stageName}</span>
                        <span className="text-stone-400 truncate">— {task.contentItem.title}</span>
                        <span className="text-xs text-stone-400 shrink-0">
                          {PLATFORM_LABELS[task.contentItem.platform]}
                        </span>
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TASK_STATUS_COLORS[task.status]}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs shrink-0 ${new Date(task.dueDate) < today ? "text-red-500" : "text-stone-400"}`}>
                          {format(new Date(task.dueDate), "d MMM")}
                        </span>
                      )}
                    </div>
                  ))}
                  {user.tasksAssigned.length > 5 && (
                    <p className="text-xs text-stone-400 pl-1">+ {user.tasksAssigned.length - 5} รายการอื่น</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
