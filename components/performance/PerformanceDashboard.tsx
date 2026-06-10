"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import { PLATFORM_LABELS } from "@/lib/utils/platform";

type Platform = "INSTAGRAM" | "TIKTOK" | "FACEBOOK";

interface AnalyticsRow {
  id: string;
  title: string;
  platform: Platform;
  targetDate: string;
  analytics: {
    views: number | null;
    reach: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
  } | null;
}

const PLATFORM_CHART_COLORS: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  TIKTOK: "#010101",
  FACEBOOK: "#1877F2",
};

function calcER(a: AnalyticsRow["analytics"]) {
  if (!a || !a.reach || a.reach === 0) return null;
  return ((a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0) + (a.saves ?? 0)) / a.reach * 100;
}

export function PerformanceDashboard() {
  const today = new Date();
  const [platform, setPlatform] = useState<Platform | "ALL">("ALL");
  const [fromDate, setFromDate] = useState(() => format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(() => format(endOfMonth(today), "yyyy-MM-dd"));

  const { data: items = [], isLoading } = useQuery<AnalyticsRow[]>({
    queryKey: ["analytics", platform, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fromDate, to: toDate });
      if (platform !== "ALL") params.set("platform", platform);
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalViews = useMemo(() => items.reduce((s, i) => s + (i.analytics?.views ?? 0), 0), [items]);
  const totalReach = useMemo(() => items.reduce((s, i) => s + (i.analytics?.reach ?? 0), 0), [items]);
  const totalLikes = useMemo(() => items.reduce((s, i) => s + (i.analytics?.likes ?? 0), 0), [items]);
  const avgER = useMemo(() => {
    const ers = items.map((i) => calcER(i.analytics)).filter((e): e is number => e !== null);
    return ers.length ? (ers.reduce((a, b) => a + b, 0) / ers.length) : null;
  }, [items]);

  // Chart data — group by date
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; views: number; likes: number; engagement: number }>();
    for (const item of items) {
      const date = item.targetDate.slice(0, 10);
      const existing = map.get(date) ?? { date, views: 0, likes: 0, engagement: 0 };
      existing.views += item.analytics?.views ?? 0;
      existing.likes += item.analytics?.likes ?? 0;
      existing.engagement += (item.analytics?.likes ?? 0) + (item.analytics?.comments ?? 0)
        + (item.analytics?.shares ?? 0) + (item.analytics?.saves ?? 0);
      map.set(date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  function exportCSV() {
    const rows = items.map((item) => {
      const a = item.analytics;
      const er = calcER(a);
      return {
        Title: item.title,
        Platform: PLATFORM_LABELS[item.platform],
        Date: item.targetDate.slice(0, 10),
        Views: a?.views ?? 0,
        Reach: a?.reach ?? 0,
        Likes: a?.likes ?? 0,
        Comments: a?.comments ?? 0,
        Shares: a?.shares ?? 0,
        Saves: a?.saves ?? 0,
        "ER%": er !== null ? er.toFixed(2) : "",
      };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chujai-analytics-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform | "ALL")}
            className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">ตั้งแต่</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">ถึง</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <button
          onClick={exportCSV}
          disabled={items.length === 0}
          className="ml-auto text-sm px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-40"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Content Published", value: items.length.toString() },
          { label: "Total Views", value: totalViews.toLocaleString() },
          { label: "Total Reach", value: totalReach.toLocaleString() },
          { label: "Avg. Engagement Rate", value: avgER !== null ? `${avgER.toFixed(2)}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-bold text-stone-900">{value}</p>
            <p className="text-xs text-stone-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm font-semibold text-stone-900 mb-4">Views Over Time</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => typeof v === "number" ? v.toLocaleString() : String(v)} />
                <Line type="monotone" dataKey="views" stroke="#78716c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm font-semibold text-stone-900 mb-4">Engagement Over Time</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => typeof v === "number" ? v.toLocaleString() : String(v)} />
                <Bar dataKey="engagement" fill="#d6d3d1" name="Total Engagement" radius={[3, 3, 0, 0]} />
                <Bar dataKey="likes" fill="#a8a29e" name="Likes" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-600">Content</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">วันโพสต์</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Views</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Reach</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Likes</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Comments</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Shares</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Saves</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">ER%</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-stone-400">กำลังโหลด...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-stone-400">
                    ยังไม่มีข้อมูล Analytics ในช่วงวันที่เลือก
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const a = item.analytics!;
                  const er = calcER(a);
                  return (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-900 max-w-[200px] truncate">{item.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${PLATFORM_CHART_COLORS[item.platform]}20`,
                            color: PLATFORM_CHART_COLORS[item.platform],
                          }}
                        >
                          {PLATFORM_LABELS[item.platform]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{item.targetDate.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.views ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.reach ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.likes ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.comments ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.shares ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{(a?.saves ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-stone-700">
                        {er !== null ? `${er.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
