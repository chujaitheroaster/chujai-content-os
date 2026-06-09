"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = ["INSTAGRAM", "TIKTOK", "FACEBOOK"] as const;
const CONTENT_TYPES: Record<string, string[]> = {
  INSTAGRAM: ["REELS", "STATIC_POST", "CAROUSEL", "STORY"],
  TIKTOK: ["SHORT_VIDEO", "LONG_VIDEO"],
  FACEBOOK: ["STATIC_POST", "CAROUSEL", "LONG_VIDEO"],
};
const CONTENT_TYPE_LABELS: Record<string, string> = {
  REELS: "Reels",
  STATIC_POST: "Static Post",
  CAROUSEL: "Carousel",
  STORY: "Story",
  SHORT_VIDEO: "Short Video",
  LONG_VIDEO: "Long Video",
};

interface ContentFormProps {
  defaultDate: string;
  onSuccess: (id: string) => void;
  onClose: () => void;
}

export function ContentForm({ defaultDate, onSuccess, onClose }: ContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("INSTAGRAM");
  const [form, setForm] = useState({
    title: "",
    contentType: "REELS",
    targetDate: defaultDate,
    weeklyTheme: "",
    postGoal: "",
    brief: "",
  });

  function handlePlatformChange(p: string) {
    setPlatform(p);
    setForm((f) => ({ ...f, contentType: CONTENT_TYPES[p][0] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/content-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, platform }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "เกิดข้อผิดพลาด");
        return;
      }

      const item = await res.json();
      onSuccess(item.id);
      router.push(`/content/${item.id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">สร้าง Content ใหม่</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">ชื่อ Content *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="เช่น: รีวิว Washed Ethiopia - Q3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Platform *</label>
              <select
                value={platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">ประเภท *</label>
              <select
                value={form.contentType}
                onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                {CONTENT_TYPES[platform].map((t) => (
                  <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">วันโพสต์เป้าหมาย *</label>
            <input
              type="date"
              required
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Weekly Theme</label>
            <input
              type="text"
              value={form.weeklyTheme}
              onChange={(e) => setForm((f) => ({ ...f, weeklyTheme: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="เช่น: Natural Processing Week"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">เป้าหมายของโพสต์นี้</label>
            <input
              type="text"
              value={form.postGoal}
              onChange={(e) => setForm((f) => ({ ...f, postGoal: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="เช่น: สร้าง Awareness กาแฟ Ethiopia"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "กำลังสร้าง..." : "สร้าง Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
