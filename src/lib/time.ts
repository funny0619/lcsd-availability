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

export function formatHongKongShortDate(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: HONG_KONG_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return `${part("month")}/${part("day")} (${part("weekday")})`;
}

export function formatHongKongTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: HONG_KONG_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
