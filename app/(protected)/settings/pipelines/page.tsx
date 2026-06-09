import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_LABELS } from "@/lib/utils/platform";
import type { Platform, ContentType } from "@prisma/client";

export default async function PipelinesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const templates = await prisma.pipelineTemplate.findMany({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Pipeline Templates</h1>

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-semibold text-stone-900">{template.name}</h3>
              {template.platform && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {PLATFORM_LABELS[template.platform as Platform]}
                </span>
              )}
              {template.isDefault && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Default</span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {template.stages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-2 shrink-0">
                  <div className={`px-3 py-2 rounded-lg border text-xs ${stage.isReviewStage ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 bg-stone-50 text-stone-700"}`}>
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {stage.defaultAssigneeRole ?? "—"} · -{stage.dueDateOffsetDays}d
                    </p>
                  </div>
                  {i < template.stages.length - 1 && (
                    <span className="text-stone-300">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-stone-400">
        การแก้ไข Pipeline Templates จะมีผลกับ Content ชิ้นใหม่เท่านั้น
        Content ที่สร้างแล้วจะไม่เปลี่ยนแปลง
      </p>
    </div>
  );
}
