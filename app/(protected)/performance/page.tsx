import { auth } from "@/lib/auth";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Performance Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">วิเคราะห์ผลลัพธ์ Content ของทีม</p>
      </div>
      <PerformanceDashboard />
    </div>
  );
}
