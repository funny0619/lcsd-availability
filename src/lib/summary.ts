import { addDays, formatHongKongDateTime } from "@/src/lib/time";
import type { Notice } from "@/src/lib/types";

export function getSummaryNotices(
  notices: readonly Notice[],
  now = new Date(),
  lookaheadDays = 2,
): Notice[] {
  const horizon = addDays(now, lookaheadDays);

  return notices
    .filter((notice) => {
      const start = new Date(notice.startAt);
      const end = notice.endAt ? new Date(notice.endAt) : null;
      return start <= horizon && (end === null || end >= now);
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function formatNotice(notice: Notice): string {
  const start = formatHongKongDateTime(notice.startAt);
  const end = notice.endAt
    ? formatHongKongDateTime(notice.endAt)
    : "until further notice";

  return [
    `${notice.poolName}: ${start} to ${end}`,
    `Temporarily unavailable: ${notice.facilities}`,
    `Reason: ${notice.reason}`,
    notice.remarks !== "N/A" ? `Details: ${notice.remarks}` : null,
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
      title: "Swim check: no known closures",
      body: `No LCSD temporary closure notices were found for the monitored pools in ${lookaheadLabel}.`,
      notices: [],
    };
  }

  return {
    title: `Swim check: ${upcoming.length} notice${upcoming.length === 1 ? "" : "s"}`,
    body: `${upcoming.map(formatNotice).join("\n\n")}\n\nCheck the official LCSD page before leaving.`,
    notices: upcoming,
  };
}
