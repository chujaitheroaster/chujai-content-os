import { auth } from "@/lib/auth";
import { PipelineEditor } from "@/components/settings/PipelineEditor";

export default async function PipelinesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isOwner = session.user.role === "OWNER";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pipeline Templates</h1>
        <p className="text-sm text-stone-500 mt-1">
          กำหนด Task Stages ที่จะ Generate อัตโนมัติเมื่อสร้าง Content ใหม่
        </p>
      </div>

      {isOwner ? (
        <PipelineEditor />
      ) : (
        <p className="text-sm text-stone-500">เฉพาะ Owner เท่านั้นที่แก้ไขได้</p>
      )}
    </div>
  );
}
