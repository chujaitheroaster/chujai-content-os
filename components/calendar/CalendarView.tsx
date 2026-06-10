"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, getISOWeek, parseISO, startOfMonth, eachWeekOfInterval, endOfMonth } from "date-fns";
import type { Role } from "@prisma/client";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/utils/platform";
import { ContentForm } from "./ContentForm";

type Platform = "INSTAGRAM" | "TIKTOK" | "FACEBOOK";

interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: string;
  targetDate: string;
  status: string;
}

interface BlockedDay {
  id: string;
  date: string;
  reason: string | null;
}

interface WeeklyTheme {
  id: string;
  year: number;
  weekNumber: number;
  theme: string;
}

export function CalendarView({ role, userId }: { role: Role; userId: string }) {
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockingDate, setBlockingDate] = useState<string | null>(null);

  const canCreate = role === "OWNER" || role === "CONTENT_STRATEGIST";
  const isOwner = role === "OWNER";

  const currentYear = parseInt(currentMonth.split("-")[0]);

  const { data: items = [] } = useQuery<ContentItem[]>({
    queryKey: ["content-items", currentMonth, selectedPlatform],
    queryFn: async () => {
      const params = new URLSearchParams({ month: currentMonth });
      if (selectedPlatform !== "ALL") params.set("platform", selectedPlatform);
      const res = await fetch(`/api/content-items?${params}`);
      return res.json();
    },
  });

  const { data: blockedDays = [] } = useQuery<BlockedDay[]>({
    queryKey: ["blocked-days", currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/blocked-days?month=${currentMonth}`);
      return res.json();
    },
  });

  const { data: weeklyThemes = [] } = useQuery<WeeklyTheme[]>({
    queryKey: ["weekly-themes", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-themes?year=${currentYear}`);
      return res.json();
    },
  });

  const blockedDatesSet = useMemo(
    () => new Set(blockedDays.map((d) => d.date.slice(0, 10))),
    [blockedDays]
  );

  const weekThemeMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const wt of weeklyThemes) {
      map.set(wt.weekNumber, wt.theme);
    }
    return map;
  }, [weeklyThemes]);

  const contentEvents = items.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.targetDate,
    backgroundColor: PLATFORM_COLORS[item.platform],
    borderColor: PLATFORM_COLORS[item.platform],
    textColor: "#fff",
    extendedProps: { type: "content", platform: item.platform, status: item.status },
  }));

  // Weekly theme background events
  const [y, m] = currentMonth.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

  const themeEvents = weekStarts.flatMap((weekStart) => {
    const weekNum = getISOWeek(weekStart);
    const theme = weekThemeMap.get(weekNum);
    if (!theme) return [];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return [{
      id: `theme-${weekNum}`,
      title: `🏷 ${theme}`,
      start: format(weekStart, "yyyy-MM-dd"),
      end: format(weekEnd, "yyyy-MM-dd"),
      display: "background",
      backgroundColor: "#fef9c3",
      extendedProps: { type: "theme" },
    }];
  });

  // Blocked day background events
  const blockedEvents = blockedDays.map((bd) => ({
    id: `blocked-${bd.id}`,
    title: bd.reason ? `🚫 ${bd.reason}` : "🚫 วันหยุด",
    date: bd.date.slice(0, 10),
    display: "background",
    backgroundColor: "#fee2e2",
    extendedProps: { type: "blocked" },
  }));

  const events = [...contentEvents, ...themeEvents, ...blockedEvents];

  const handleDateClick = useCallback((info: { dateStr: string }) => {
    const dateStr = info.dateStr;
    if (blockedDatesSet.has(dateStr)) {
      // If owner, offer to unblock
      if (isOwner && confirm(`วันที่ ${dateStr} ถูกปิดอยู่ ต้องการเปิดอีกครั้ง?`)) {
        fetch(`/api/blocked-days?date=${dateStr}`, { method: "DELETE" }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["blocked-days"] });
        });
      }
      return;
    }
    if (!canCreate) return;
    setSelectedDate(dateStr);
    setShowForm(true);
  }, [canCreate, isOwner, blockedDatesSet, queryClient]);

  const handleEventClick = useCallback((info: { event: { id: string; extendedProps: Record<string, unknown> } }) => {
    if (info.event.extendedProps.type !== "content") return;
    window.location.href = `/content/${info.event.id}`;
  }, []);

  const handleDatesSet = useCallback((info: { start: Date }) => {
    setCurrentMonth(format(info.start, "yyyy-MM"));
  }, []);

  async function blockDate(dateStr: string, reason: string) {
    const res = await fetch("/api/blocked-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, reason: reason || undefined }),
    });
    const data = await res.json();
    queryClient.invalidateQueries({ queryKey: ["blocked-days"] });
    if (data.hasExistingContent) {
      alert(`⚠️ มี Content อยู่ในวันนี้แล้ว ${data.hasExistingContent} ชิ้น — ปิดวันแล้วแต่ Content ยังอยู่`);
    }
    setBlockingDate(null);
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "INSTAGRAM", "TIKTOK", "FACEBOOK"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPlatform(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedPlatform === p
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {p === "ALL" ? "ทั้งหมด" : PLATFORM_LABELS[p]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-yellow-100 border border-yellow-200" /> Theme</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-red-100 border border-red-200" /> ปิดวัน</span>
          </div>
          {isOwner && (
            <button
              onClick={() => {
                const dateStr = prompt("ปิดวันที่ (YYYY-MM-DD):");
                if (dateStr) setBlockingDate(dateStr);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            >
              🚫 ปิดวัน
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => { setSelectedDate(null); setShowForm(true); }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-stone-800"
            >
              + New Content
            </button>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 [&_.fc-event]:cursor-pointer [&_.fc-day-today]:bg-amber-50 [&_.fc-daygrid-day-frame]:min-h-20">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          locale="th"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="100%"
          eventContent={(info) => {
            const type = info.event.extendedProps.type;
            if (type === "theme" || type === "blocked") return null; // background events
            return (
              <div className="px-1.5 py-0.5 text-xs truncate">
                <span className="font-medium">{info.event.title}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Block Date Modal */}
      {blockingDate && (
        <BlockDateModal
          date={blockingDate}
          onConfirm={(reason) => blockDate(blockingDate, reason)}
          onClose={() => setBlockingDate(null)}
        />
      )}

      {/* Create Content Form Modal */}
      {showForm && (
        <ContentForm
          defaultDate={selectedDate ?? ""}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["content-items"] });
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function BlockDateModal({
  date,
  onConfirm,
  onClose,
}: {
  date: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold text-stone-900">ปิดวันที่ {date}</h3>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เหตุผล (เช่น วันหยุดเทศกาล)"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            ปิดวัน
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

