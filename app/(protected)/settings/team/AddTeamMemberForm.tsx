"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddTeamMemberForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "CONTENT_STRATEGIST", password: "chujai2024" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "เกิดข้อผิดพลาด");
      return;
    }

    router.push("/settings");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1 block">ชื่อ *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
          placeholder="ชื่อ-นามสกุล"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1 block">อีเมล *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1 block">Role *</label>
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        >
          <option value="CONTENT_STRATEGIST">Content Strategist</option>
          <option value="DESIGNER">Designer</option>
          <option value="PUBLISHER">Publisher</option>
          <option value="OWNER">Owner</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1 block">Password เริ่มต้น</label>
        <input
          type="text"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        />
        <p className="text-xs text-stone-400 mt-1">สมาชิกสามารถเปลี่ยน password ได้ภายหลัง</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "กำลังเพิ่ม..." : "เพิ่มสมาชิก"}
        </button>
      </div>
    </form>
  );
}
