import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { PLATFORM_LABELS } from "@/lib/utils/platform";

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user) return null;

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const items = await prisma.contentItem.findMany({
    where: {
      status: { in: ["PUBLISHED", "ANALYZED"] },
      analytics: { isNot: null },
      targetDate: { gte: firstOfMonth },
    },
    include: { analytics: true },
    orderBy: { targetDate: "desc" },
  });

  const totalViews = items.reduce((s, i) => s + (i.analytics?.views ?? 0), 0);
  const totalReach = items.reduce((s, i) => s + (i.analytics?.reach ?? 0), 0);
  const totalLikes = items.reduce((s, i) => s + (i.analytics?.likes ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Performance Dashboard</h1>
        <p className="text-sm text-stone-500">{format(firstOfMonth, "MMMM yyyy")}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-3xl font-bold text-stone-900">{items.length}</p>
          <p className="text-sm text-stone-500 mt-1">Content Published</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-3xl font-bold text-stone-900">{totalViews.toLocaleString()}</p>
          <p className="text-sm text-stone-500 mt-1">Total Views</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-3xl font-bold text-stone-900">{totalReach.toLocaleString()}</p>
          <p className="text-sm text-stone-500 mt-1">Total Reach</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-600">Content</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">วันโพสต์</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Views</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Reach</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Likes</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Comments</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Shares</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Saves</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">ER%</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-stone-400">
                    ยังไม่มีข้อมูล Analytics เดือนนี้
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const a = item.analytics!;
                  const er = a.reach && a.reach > 0
                    ? (((a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0) + (a.saves ?? 0)) / a.reach * 100).toFixed(2)
                    : "—";
                  return (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-900 max-w-[200px] truncate">{item.title}</td>
                      <td className="px-4 py-3 text-stone-600">{PLATFORM_LABELS[item.platform]}</td>
                      <td className="px-4 py-3 text-stone-500">{format(new Date(item.targetDate), "d MMM")}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.views ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.reach ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.likes ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.comments ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.shares ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a.saves ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-stone-700">{er}{typeof er === "string" && er !== "—" ? "%" : ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
