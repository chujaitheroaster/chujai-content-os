import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [users, settings] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.appSetting.findMany(),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">Settings</h1>

      {/* Lark Config */}
      {session.user.role === "OWNER" && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-900 mb-4">🔔 Lark Notifications</h2>
          <SettingsForm initialWebhook={settingsMap["lark_webhook_url"] ?? ""} />
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">👥 Team Members</h2>
          {session.user.role === "OWNER" && (
            <Link
              href="/settings/team"
              className="text-sm px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              + เพิ่มสมาชิก
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-xs font-bold text-stone-700">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{user.name}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 bg-stone-200 text-stone-700 rounded-full">
                  {user.role.replace("_", " ")}
                </span>
                {!user.isActive && (
                  <span className="text-xs text-red-500">ปิดการใช้งาน</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Templates */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">⚙️ Pipeline Templates</h2>
          <Link
            href="/settings/pipelines"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            จัดการ →
          </Link>
        </div>
        <p className="text-sm text-stone-500">
          กำหนด Task stages สำหรับแต่ละ Platform และประเภท Content
        </p>
      </div>
    </div>
  );
}
