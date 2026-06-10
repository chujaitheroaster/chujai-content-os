import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-stone-200", className)} />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TaskBoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-48 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
