import { describe, expect, it } from "vitest";
import { buildDailySummary, getSummaryNotices, hasMainPool } from "@/src/lib/summary";
import type { Notice } from "@/src/lib/types";

const now = new Date("2026-09-13T00:00:00.000Z");

const notice: Notice = {
  id: "notice-1",
  swpId: 5,
  poolName: "Victoria Park Swimming Pool",
  sourceUrl: "https://example.com",
  startAt: "2026-09-17T00:00:00.000Z",
  endAt: "2026-09-17T07:00:00.000Z",
  facilities: "Main Pool",
  reason: "Competition",
  remarks: "N/A",
  kind: "temporary-closure",
};

describe("daily summary", () => {
  it("includes notices within the lookahead window", () => {
    expect(getSummaryNotices([notice], now, 7)).toHaveLength(1);
    expect(getSummaryNotices([notice], now, 2)).toHaveLength(0);
  });

  it("matches Main Pool case-insensitively after trimming", () => {
    expect(hasMainPool("  main pool  , Multi-purpose Pool")).toBe(true);
    expect(hasMainPool("Training Pool, Toddlers' Pool")).toBe(false);
  });

  it("builds a quiet clear summary when there are no notices", () => {
    const summary = buildDailySummary([], now);

    expect(summary.notices).toHaveLength(0);
    expect(summary.title).toBe("No known closures");
  });

  it("describes the main pool closure concisely", () => {
    const summary = buildDailySummary([notice], now, 7);

    expect(summary.title).toContain("main pool closure");
    expect(summary.body).toContain("Main Pool closed, Competition");
    expect(summary.body).toContain("Time: 08:00-15:00");
    expect(summary.body).not.toContain("Details:");
  });
});
