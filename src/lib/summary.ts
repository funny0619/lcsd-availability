import {
  addDays,
  formatHongKongShortDate,
  formatHongKongTime,
  hongKongDateKey,
} from "@/src/lib/time";
import type { Notice } from "@/src/lib/types";

export function hasMainPool(facilities: string): boolean {
  return facilities
    .split(",")
    .some((facility) => facility.replace(/\s+/g, " ").trim().toLowerCase() === "main pool");
}

export function getSummaryNotices(
  notices: readonly Notice[],
  now = new Date(),
  lookaheadDays = 2,
): Notice[] {
  const horizon = addDays(now, lookaheadDays);

  return notices
    .filter((notice) => {
      if (!hasMainPool(notice.facilities)) {
        return false;
      }

      const start = new Date(notice.startAt);
      const end = notice.endAt ? new Date(notice.endAt) : null;
      return start <= horizon && (end === null || end >= now);
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function formatNotice(notice: Notice): string {
  const startDate = formatHongKongShortDate(notice.startAt);
  const startTime = formatHongKongTime(notice.startAt);
  let timeRange = `${startTime} until further notice`;

  if (notice.endAt) {
    const endDate = formatHongKongShortDate(notice.endAt);
    const endTime = formatHongKongTime(notice.endAt);
    timeRange =
      hongKongDateKey(new Date(notice.startAt)) === hongKongDateKey(new Date(notice.endAt))
        ? `${startTime}-${endTime}`
        : `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }

  return [
    `${startDate} ${notice.poolName}`,
    `Main Pool closed, ${notice.reason}`,
    `Time: ${timeRange}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDailySummary(
  notices: readonly Notice[],
  now = new Date(),
  lookaheadDays = 2,
): { title: string; body: string; notices: Notice[] } {
  const upcoming = getSummaryNotices(notices, now, lookaheadDays);
  const lookaheadLabel = lookaheadDays === 1 ? "the next day" : `the next ${lookaheadDays} days`;

  if (!upcoming.length) {
    return {
      title: "No known closures",
      body: `No LCSD temporary closure notices were found for the monitored pools in ${lookaheadLabel}.`,
      notices: [],
    };
  }

  return {
    title: `${upcoming.length} main pool closure${upcoming.length === 1 ? "" : "s"}`,
    body: `${upcoming.map(formatNotice).join("\n\n")}\n\nCheck the official LCSD page before leaving.`,
    notices: upcoming,
  };
}
