import { auth } from "@/lib/auth";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Content Calendar</h1>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-stone-200 p-4 overflow-hidden">
        <CalendarView role={session.user.role} userId={session.user.id} />
      </div>
    </div>
  );
}
