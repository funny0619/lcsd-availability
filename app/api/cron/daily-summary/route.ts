import { NextResponse } from "next/server";
import { fetchConfiguredPoolChecks } from "@/src/lib/lcsd";
import { sendPush } from "@/src/lib/push";
import { buildDailySummary } from "@/src/lib/summary";
import { hongKongDateKey } from "@/src/lib/time";
import {
  deactivatePushSubscription,
  hasDailySummaryBeenSent,
  listPushSubscriptions,
  markDailySummarySent,
} from "@/src/lib/supabase";

async function runDailySummary(request: Request): Promise<NextResponse> {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dateKey = hongKongDateKey(now);

  if (await hasDailySummaryBeenSent(dateKey)) {
    return NextResponse.json({ sent: false, reason: "already-sent", dateKey });
  }

  const checks = await fetchConfiguredPoolChecks();
  const failures = checks.filter((check) => check.error);

  if (failures.length > 0) {
    return NextResponse.json(
      {
        sent: false,
        error: "One or more LCSD pages could not be parsed",
        failures: failures.map((failure) => ({ swpId: failure.pool.swpId, error: failure.error })),
      },
      { status: 502 },
    );
  }

  const notices = checks.flatMap((check) => check.notices);
  const lookaheadDays = Number(process.env.DAILY_SUMMARY_LOOKAHEAD_DAYS ?? "2");
  const summary = buildDailySummary(notices, now, Number.isFinite(lookaheadDays) ? lookaheadDays : 2);

  if (summary.notices.length === 0 && process.env.SEND_CLEAR_SUMMARY !== "true") {
    await markDailySummarySent(dateKey);
    return NextResponse.json({ sent: false, reason: "nothing-relevant", dateKey });
  }

  const subscriptions = await listPushSubscriptions();
  let sent = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    try {
      await sendPush(subscription.subscription, {
        title: summary.title,
        body: summary.body,
        url: "/",
      });
      sent += 1;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await deactivatePushSubscription(subscription.endpoint);
        removed += 1;
      } else {
        throw error;
      }
    }
  }

  await markDailySummarySent(dateKey);
  return NextResponse.json({ sent, removed, dateKey, noticeCount: summary.notices.length });
}

// Vercel Cron invokes this route with GET. POST remains useful for manual testing.
export async function GET(request: Request): Promise<NextResponse> {
  return runDailySummary(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return runDailySummary(request);
}
