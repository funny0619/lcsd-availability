export const HONG_KONG_TIME_ZONE = "Asia/Hong_Kong";

export function hongKongDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HONG_KONG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatHongKongDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HONG_KONG_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
