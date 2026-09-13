import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { getPoolUrl, pools, type PoolConfig } from "@/src/config/pools";
import type { Notice, PoolCheck } from "@/src/lib/types";

const USER_AGENT = "LCSD-Swim-Availability/0.1 (personal notification project)";

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseHongKongDate(dateText: string, timeText: string): string {
  const [year, month, day] = dateText.split("/").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error(`Invalid LCSD date/time: ${dateText} ${timeText}`);
  }

  return new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`,
  ).toISOString();
}

function parseDateRange(value: string): {
  startAt: string;
  endAt: string | null;
} {
  const normalized = cleanText(value);
  const match = normalized.match(
    /^(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s*-\s*(.+)$/,
  );

  if (!match) {
    throw new Error(`Unrecognized LCSD date range: ${value}`);
  }

  const [, startDate, startTime, endValue] = match;
  const startAt = parseHongKongDate(startDate, startTime);

  if (/^until further notice$/i.test(endValue)) {
    return { startAt, endAt: null };
  }

  const endMatch = endValue.match(
    /^(?:(\d{4}\/\d{1,2}\/\d{1,2})\s+)?(\d{1,2}:\d{2})$/,
  );

  if (!endMatch) {
    throw new Error(`Unrecognized LCSD end time: ${value}`);
  }

  return {
    startAt,
    endAt: parseHongKongDate(endMatch[1] ?? startDate, endMatch[2]),
  };
}

function fingerprint(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

function parseNoticeRow(
  $: cheerio.CheerioAPI,
  row: Element,
  pool: PoolConfig,
  sourceUrl: string,
): Notice | null {
  const cells = $(row).find("td");

  if (cells.length < 4) {
    return null;
  }

  const dateRange = cleanText($(cells[0]).text());
  const facilities = cleanText($(cells[1]).text());
  const reason = cleanText($(cells[2]).text());
  const remarks = cleanText($(cells[3]).text()) || "N/A";

  if (!dateRange || /^no related notice$/i.test(dateRange)) {
    return null;
  }

  const { startAt, endAt } = parseDateRange(dateRange);
  const id = fingerprint([
    String(pool.swpId),
    startAt,
    endAt ?? "until-further-notice",
    facilities,
    reason,
    remarks,
  ]);

  return {
    id,
    swpId: pool.swpId,
    poolName: pool.name,
    sourceUrl,
    startAt,
    endAt,
    facilities,
    reason,
    remarks,
    kind: "temporary-closure",
  };
}

export function parsePoolPage(html: string, pool: PoolConfig): Notice[] {
  const $ = cheerio.load(html);
  const sourceUrl = getPoolUrl(pool);
  const heading = $("h4")
    .filter((_, element) =>
      /^notice of temporary closure$/i.test(cleanText($(element).text())),
    )
    .first();

  if (!heading.length) {
    throw new Error(`LCSD closure section not found for swpId=${pool.swpId}`);
  }

  const closureTable = heading.closest("tr").next("tr").find("table").first();

  if (!closureTable.length) {
    throw new Error(`LCSD closure table not found for swpId=${pool.swpId}`);
  }

  return closureTable
    .find("tr")
    .slice(1)
    .toArray()
    .map((row) => parseNoticeRow($, row, pool, sourceUrl))
    .filter((notice): notice is Notice => notice !== null)
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

export async function fetchPoolCheck(pool: PoolConfig): Promise<PoolCheck> {
  const sourceUrl = getPoolUrl(pool);
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": USER_AGENT },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`LCSD returned HTTP ${response.status} for swpId=${pool.swpId}`);
  }

  const notices = parsePoolPage(await response.text(), pool);

  return {
    pool,
    sourceUrl,
    notices,
    checkedAt: new Date().toISOString(),
  };
}

export async function fetchConfiguredPoolChecks(): Promise<PoolCheck[]> {
  const checks: PoolCheck[] = [];

  // Keep requests sequential and light on the public LCSD site.
  for (const pool of pools.filter((entry) => entry.enabled)) {
    const sourceUrl = getPoolUrl(pool);

    try {
      checks.push(await fetchPoolCheck(pool));
    } catch (error) {
      checks.push({
        pool,
        sourceUrl,
        notices: [],
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown LCSD error",
      });
    }
  }

  return checks;
}
