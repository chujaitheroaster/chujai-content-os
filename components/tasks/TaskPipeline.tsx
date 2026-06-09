"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/utils/platform";
import type { Role, TaskStatus, ContentStatus } from "@prisma/client";

interface Task {
  id: string;
  stageName: string;
  orderIndex: number;
  status: TaskStatus;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  dueDate: Date | null;
  notes: string | null;
  isReviewStage: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: Role;
}

interface TaskPipelineProps {
  tasks: Task[];
  contentItemId: string;
  teamMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: Role;
  contentStatus: ContentStatus;
}

export function TaskPipeline({
  tasks,
  contentItemId,
  teamMembers,
  currentUserId,
  currentUserRole,
  contentStatus,
}: TaskPipelineProps) {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);

  async function updateTask(taskId: string, data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["content-item", contentItemId] });
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendForReview(taskId: string) {
    setSendingReview(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_FOR_REVIEW", status: "DONE" }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setSendingReview(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Pipeline Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
              className={`flex flex-col items-center p-2.5 rounded-xl border-2 min-w-[90px] transition-all ${
                selectedTask?.id === task.id
                  ? "border-stone-900 bg-stone-50"
                  : task.status === "DONE"
                  ? "border-green-200 bg-green-50"
                  : task.status === "IN_PROGRESS"
                  ? "border-blue-200 bg-blue-50"
                  : task.status === "BLOCKED"
                  ? "border-red-200 bg-red-50"
                  : "border-stone-200 bg-white"
              }`}
            >
              <span className="text-xs font-medium text-stone-700 text-center leading-tight">
                {task.stageName}
              </span>
              <span className={`mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status]}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
              {task.assignedTo && (
                <span className="mt-1 text-[10px] text-stone-500 truncate max-w-[80px]">
                  {task.assignedTo.name.split(" ")[0]}
                </span>
              )}
            </button>
            {i < tasks.length - 1 && (
              <span className="text-stone-300 text-lg">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="border border-stone-200 rounded-xl p-4 space-y-4 bg-stone-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">{selectedTask.stageName}</h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">สถานะ</label>
            <select
              value={selectedTask.status}
              onChange={(e) => updateTask(selectedTask.id, { status: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
            >
              {(["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"] as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">มอบหมายให้</label>
            <select
              value={selectedTask.assignedToId ?? ""}
              onChange={(e) => updateTask(selectedTask.id, { assignedToId: e.target.value || null })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
            >
              <option value="">— ยังไม่มีคน —</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Due Date</label>
            <input
              type="date"
              value={selectedTask.dueDate ? format(new Date(selectedTask.dueDate), "yyyy-MM-dd") : ""}
              onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value || null })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Notes</label>
            <textarea
              value={selectedTask.notes ?? ""}
              onBlur={(e) => updateTask(selectedTask.id, { notes: e.target.value })}
              onChange={(e) => setSelectedTask({ ...selectedTask, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white resize-none"
              placeholder="บันทึกเพิ่มเติม..."
            />
          </div>

          {/* Send for Review Button */}
          {selectedTask.isReviewStage && contentStatus !== "IN_REVIEW" && contentStatus !== "APPROVED" && (
            <button
              onClick={() => sendForReview(selectedTask.id)}
              disabled={sendingReview}
              className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {sendingReview ? "กำลังส่ง..." : "📤 Send for Review (ส่ง Lark)"}
            </button>
          )}

          {saving && <p className="text-xs text-stone-500 text-center">กำลังบันทึก...</p>}
        </div>
      )}
    </div>
  );
}
