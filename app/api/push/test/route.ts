import { NextResponse } from "next/server";
import { fetchConfiguredPoolChecks } from "@/src/lib/lcsd";
import { sendPush } from "@/src/lib/push";
import { buildDailySummary } from "@/src/lib/summary";
import {
  deactivatePushSubscription,
  listPushSubscriptions,
} from "@/src/lib/supabase";

export async function POST(request: Request): Promise<NextResponse> {
  const expectedToken = process.env.ADMIN_TEST_TOKEN;
  const authorization = request.headers.get("authorization");

  if (!expectedToken || authorization !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checks = await fetchConfiguredPoolChecks();
  const failures = checks.filter((check) => check.error);

  if (failures.length > 0) {
    return NextResponse.json(
      {
        error: "One or more LCSD pages could not be parsed",
        failures: failures.map((failure) => ({ swpId: failure.pool.swpId, error: failure.error })),
      },
      { status: 502 },
    );
  }

  const lookaheadDays = Number(process.env.DAILY_SUMMARY_LOOKAHEAD_DAYS ?? "2");
  const summary = buildDailySummary(
    checks.flatMap((check) => check.notices),
    new Date(),
    Number.isFinite(lookaheadDays) ? lookaheadDays : 2,
  );
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

  return NextResponse.json({
    sent,
    removed,
    noticeCount: summary.notices.length,
    summary: {
      title: summary.title,
      body: summary.body,
    },
  });
}
