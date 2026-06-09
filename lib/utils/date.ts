import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { format, isAfter, isBefore, startOfDay } from "date-fns";

export const THAI_TZ = "Asia/Bangkok";

export function toThaiTime(date: Date): Date {
  return toZonedTime(date, THAI_TZ);
}

export function formatThaiDate(date: Date, fmt = "d MMM yyyy"): string {
  return formatInTimeZone(date, THAI_TZ, fmt);
}

export function isOverdue(dueDate: Date): boolean {
  return isBefore(startOfDay(new Date(dueDate)), startOfDay(new Date()));
}

export function isDueToday(dueDate: Date): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  const due = format(new Date(dueDate), "yyyy-MM-dd");
  return today === due;
}

export function isDueInDays(dueDate: Date, days: number): boolean {
  const future = new Date();
  future.setDate(future.getDate() + days);
  return isAfter(new Date(dueDate), new Date()) && isBefore(new Date(dueDate), future);
}
