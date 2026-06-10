import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamManager } from "./TeamManager";
import Link from "next/link";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "OWNER") redirect("/settings");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Team Members</h1>
          <p className="text-sm text-stone-500 mt-0.5">จัดการสมาชิกและสิทธิ์การใช้งาน</p>
        </div>
      </div>

      <TeamManager currentUserId={session.user.id} />
    </div>
  );
}
