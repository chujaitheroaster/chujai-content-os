"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Role = "OWNER" | "CONTENT_STRATEGIST" | "DESIGNER" | "PUBLISHER";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  CONTENT_STRATEGIST: "Content Strategist",
  DESIGNER: "Designer",
  PUBLISHER: "Publisher",
};

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "bg-amber-100 text-amber-700",
  CONTENT_STRATEGIST: "bg-blue-100 text-blue-700",
  DESIGNER: "bg-purple-100 text-purple-700",
  PUBLISHER: "bg-green-100 text-green-700",
};

const defaultForm = { name: "", email: "", role: "CONTENT_STRATEGIST" as Role, password: "" };

export function TeamManager({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("CONTENT_STRATEGIST");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["team-members"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, password: data.password || "chujai2024" }),
      }).then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.error ?? "เกิดข้อผิดพลาด");
        }
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      setForm(defaultForm);
      setShowAdd(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Member> }) =>
      fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      setEditingId(null);
    },
  });

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditRole(m.role);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    addMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      {/* Member List */}
      {isLoading ? (
        <div className="text-sm text-stone-400">กำลังโหลด...</div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                m.isActive ? "bg-white border-stone-200" : "bg-stone-50 border-stone-200 opacity-60"
              }`}
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-sm font-bold text-stone-700 shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {m.name}
                    {m.id === currentUserId && (
                      <span className="ml-2 text-xs text-stone-400">(คุณ)</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">{m.email}</p>
                </div>
              </div>

              {/* Role + Actions */}
              <div className="flex items-center gap-2">
                {editingId === m.id ? (
                  <>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                      className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => patchMutation.mutate({ id: m.id, data: { role: editRole } })}
                      className="text-xs px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                    {!m.isActive && (
                      <span className="text-xs text-red-500 font-medium">ปิดการใช้งาน</span>
                    )}
                    {m.id !== currentUserId && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => startEdit(m)}
                          className="text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-100"
                        >
                          แก้ไข Role
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${m.isActive ? "ปิด" : "เปิด"}การใช้งาน ${m.name}?`)) {
                              patchMutation.mutate({ id: m.id, data: { isActive: !m.isActive } });
                            }
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                            m.isActive
                              ? "border-red-200 text-red-500 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {m.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-sm font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors"
        >
          + เพิ่มสมาชิกใหม่
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="border border-stone-200 rounded-xl p-5 space-y-4 bg-stone-50"
        >
          <h3 className="font-semibold text-stone-900">เพิ่มสมาชิกใหม่</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">ชื่อ *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ชื่อ-นามสกุล"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">อีเมล *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">
                Password เริ่มต้น
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="ปล่อยว่าง = ใช้ chujai2024"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {addMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่มสมาชิก"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm(defaultForm); setFormError(null); }}
              className="px-5 py-2.5 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-100"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
