import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddTeamMemberForm } from "./AddTeamMemberForm";

export default async function AddTeamMemberPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "OWNER") redirect("/settings");

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">เพิ่มสมาชิก</h1>
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <AddTeamMemberForm />
      </div>
    </div>
  );
}
