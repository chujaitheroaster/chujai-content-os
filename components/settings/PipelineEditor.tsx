"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PLATFORM_LABELS } from "@/lib/utils/platform";
import type { Role, Platform, ContentType } from "@prisma/client";

interface Stage {
  id?: string;
  name: string;
  orderIndex: number;
  defaultAssigneeRole: Role | null;
  dueDateOffsetDays: number;
  isReviewStage: boolean;
}

interface Template {
  id: string;
  name: string;
  platform: Platform | null;
  contentType: ContentType | null;
  isDefault: boolean;
  stages: Stage[];
}

const ROLES: Role[] = ["OWNER", "CONTENT_STRATEGIST", "DESIGNER", "PUBLISHER"];
const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  CONTENT_STRATEGIST: "Strategist",
  DESIGNER: "Designer",
  PUBLISHER: "Publisher",
};

function StageRow({
  stage,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  stage: Stage;
  index: number;
  total: number;
  onChange: (s: Stage) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 leading-none"
        >▲</button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 leading-none"
        >▼</button>
      </div>
      <span className="text-xs text-stone-400 w-5 text-center">{index + 1}</span>
      <input
        type="text"
        value={stage.name}
        onChange={(e) => onChange({ ...stage, name: e.target.value })}
        className="flex-1 text-sm px-2 py-1 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-500"
        placeholder="ชื่อ Stage"
      />
      <select
        value={stage.defaultAssigneeRole ?? ""}
        onChange={(e) => onChange({ ...stage, defaultAssigneeRole: (e.target.value || null) as Role | null })}
        className="text-xs border border-stone-300 rounded px-1.5 py-1 focus:outline-none"
      >
        <option value="">— Role —</option>
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-400">-</span>
        <input
          type="number"
          min={0}
          value={stage.dueDateOffsetDays}
          onChange={(e) => onChange({ ...stage, dueDateOffsetDays: parseInt(e.target.value) || 0 })}
          className="w-12 text-xs px-1.5 py-1 border border-stone-300 rounded text-center focus:outline-none"
        />
        <span className="text-xs text-stone-400">วัน</span>
      </div>
      <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer">
        <input
          type="checkbox"
          checked={stage.isReviewStage}
          onChange={(e) => onChange({ ...stage, isReviewStage: e.target.checked })}
          className="rounded"
        />
        Review
      </label>
      <button
        type="button"
        onClick={onDelete}
        className="text-xs text-red-400 hover:text-red-600 px-1"
      >✕</button>
    </div>
  );
}

function TemplateCard({ template, onRefresh }: { template: Template; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [stages, setStages] = useState<Stage[]>(template.stages);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStage() {
    setStages((prev) => [
      ...prev,
      {
        name: "",
        orderIndex: prev.length,
        defaultAssigneeRole: null,
        dueDateOffsetDays: 0,
        isReviewStage: false,
      },
    ]);
  }

  function updateStage(index: number, updated: Stage) {
    setStages((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function deleteStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i })));
  }

  function moveStage(index: number, dir: -1 | 1) {
    const next = [...stages];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next.map((s, i) => ({ ...s, orderIndex: i })));
  }

  async function saveStages() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipeline-templates/${template.id}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stages.map((s, i) => ({ ...s, orderIndex: i }))),
      });
      if (!res.ok) throw new Error("Save failed");
      onRefresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate() {
    if (!confirm(`ลบ Template "${template.name}"?`)) return;
    await fetch(`/api/pipeline-templates/${template.id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-stone-50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-stone-400">{expanded ? "▼" : "▶"}</span>
        <h3 className="font-semibold text-stone-900 flex-1">{template.name}</h3>
        {template.platform && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
            {PLATFORM_LABELS[template.platform]}
          </span>
        )}
        {template.isDefault && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Default</span>
        )}
        <span className="text-xs text-stone-400">{template.stages.length} stages</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); deleteTemplate(); }}
          className="text-xs text-red-400 hover:text-red-600 ml-2"
        >
          ลบ
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-stone-100 pt-3">
          {stages.map((stage, i) => (
            <StageRow
              key={i}
              stage={stage}
              index={i}
              total={stages.length}
              onChange={(s) => updateStage(i, s)}
              onDelete={() => deleteStage(i)}
              onMove={(dir) => moveStage(i, dir)}
            />
          ))}

          <button
            type="button"
            onClick={addStage}
            className="w-full text-sm py-2 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            + เพิ่ม Stage
          </button>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={saveStages}
              disabled={saving}
              className="text-sm px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={() => { setStages(template.stages); setExpanded(false); }}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              ยกเลิก
            </button>
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function NewTemplateForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/pipeline-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), platform: platform || null, isDefault: false }),
    });
    setSaving(false);
    if (res.ok) {
      setName(""); setPlatform(""); setOpen(false);
      onSuccess();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-stone-400 hover:text-stone-700 font-medium"
      >
        + สร้าง Pipeline Template ใหม่
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
      <h3 className="font-medium text-stone-900">Template ใหม่</h3>
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อ Template"
          className="flex-1 text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="text-sm border border-stone-300 rounded-lg px-2 py-2 focus:outline-none"
        >
          <option value="">ทุก Platform</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="TIKTOK">TikTok</option>
          <option value="FACEBOOK">Facebook</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={create}
          disabled={saving || !name.trim()}
          className="text-sm px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? "กำลังสร้าง..." : "สร้าง"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

export function PipelineEditor() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["pipeline-templates"],
    queryFn: () => fetch("/api/pipeline-templates").then((r) => r.json()),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["pipeline-templates"] });
  }

  if (isLoading) return <div className="text-sm text-stone-400">กำลังโหลด...</div>;

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} onRefresh={refresh} />
      ))}
      <NewTemplateForm onSuccess={refresh} />
      <p className="text-xs text-stone-400 pt-1">
        การแก้ไข Pipeline Templates จะมีผลกับ Content ชิ้นใหม่เท่านั้น
      </p>
    </div>
  );
}
