"use client";

import { useState } from "react";

interface AnalyticsData {
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

interface AnalyticsFormProps {
  contentItemId: string;
  initialData: AnalyticsData | null;
  isPublished: boolean;
}

export function AnalyticsForm({ contentItemId, initialData, isPublished }: AnalyticsFormProps) {
  const [data, setData] = useState<AnalyticsData>(
    initialData ?? { views: null, reach: null, likes: null, comments: null, shares: null, saves: null }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fields: { key: keyof AnalyticsData; label: string; icon: string }[] = [
    { key: "views", label: "Views", icon: "👁" },
    { key: "reach", label: "Reach", icon: "📡" },
    { key: "likes", label: "Likes", icon: "❤️" },
    { key: "comments", label: "Comments", icon: "💬" },
    { key: "shares", label: "Shares", icon: "🔁" },
    { key: "saves", label: "Saves", icon: "🔖" },
  ];

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/analytics/${contentItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (!isPublished) {
    return (
      <div className="text-center py-6 text-stone-400">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-sm">Analytics จะเปิดเมื่อ Status เป็น Published</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fields.map(({ key, label, icon }) => (
          <div key={key}>
            <label className="text-xs text-stone-500 mb-1 block">
              {icon} {label}
            </label>
            <input
              type="number"
              min="0"
              value={data[key] ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, [key]: e.target.value ? parseInt(e.target.value) : null }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก Metrics"}
        </button>
        {saved && <p className="text-sm text-green-600">✅ บันทึกแล้ว</p>}
      </div>

      {/* Engagement Rate */}
      {data.reach && data.reach > 0 && (
        <div className="pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-500">
            Engagement Rate:{" "}
            <span className="font-semibold text-stone-700">
              {(
                (((data.likes ?? 0) + (data.comments ?? 0) + (data.shares ?? 0) + (data.saves ?? 0)) /
                  data.reach) *
                100
              ).toFixed(2)}
              %
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
