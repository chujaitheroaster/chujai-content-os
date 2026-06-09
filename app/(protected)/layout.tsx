import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar role={session.user.role} userName={session.user.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
