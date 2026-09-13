import { NextResponse } from "next/server";
import { sendPush } from "@/src/lib/push";
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

  const subscriptions = await listPushSubscriptions();
  let sent = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    try {
      await sendPush(subscription.subscription, {
        title: "Swim Check test alert",
        body: "Notifications are connected. This is a simulated pool closure.",
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

  return NextResponse.json({ sent, removed });
}
