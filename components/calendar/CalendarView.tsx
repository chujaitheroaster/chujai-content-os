"use client";

import { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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

export function CalendarView({ role, userId }: { role: Role; userId: string }) {
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: items = [] } = useQuery<ContentItem[]>({
    queryKey: ["content-items", currentMonth, selectedPlatform],
    queryFn: async () => {
      const params = new URLSearchParams({ month: currentMonth });
      if (selectedPlatform !== "ALL") params.set("platform", selectedPlatform);
      const res = await fetch(`/api/content-items?${params}`);
      return res.json();
    },
  });

  const events = items.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.targetDate,
    backgroundColor: PLATFORM_COLORS[item.platform],
    borderColor: PLATFORM_COLORS[item.platform],
    textColor: item.platform === "TIKTOK" ? "#fff" : "#fff",
    extendedProps: { platform: item.platform, status: item.status, contentType: item.contentType },
  }));

  const handleDateClick = useCallback((info: { dateStr: string }) => {
    if (role !== "OWNER" && role !== "CONTENT_STRATEGIST") return;
    setSelectedDate(info.dateStr);
    setShowForm(true);
  }, [role]);

  const handleEventClick = useCallback((info: { event: { id: string } }) => {
    window.location.href = `/content/${info.event.id}`;
  }, []);

  const handleDatesSet = useCallback((info: { start: Date }) => {
    setCurrentMonth(format(info.start, "yyyy-MM"));
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Platform Filter */}
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
        <div className="ml-auto flex items-center gap-3 text-xs text-stone-500">
          {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              {PLATFORM_LABELS[p as Platform]}
            </span>
          ))}
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
          eventContent={(info) => (
            <div className="px-1.5 py-0.5 text-xs truncate">
              <span className="font-medium">{info.event.title}</span>
            </div>
          )}
        />
      </div>

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
