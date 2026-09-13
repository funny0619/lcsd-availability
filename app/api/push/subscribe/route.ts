import { NextResponse } from "next/server";
import { savePushSubscription } from "@/src/lib/supabase";
import type { StoredPushSubscription } from "@/src/lib/types";

function isValidSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredPushSubscription>;
  return Boolean(
    typeof candidate.endpoint === "string" &&
      candidate.keys &&
      typeof candidate.keys.p256dh === "string" &&
      typeof candidate.keys.auth === "string",
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json();

  if (!isValidSubscription(body)) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  await savePushSubscription(body);
  return new NextResponse(null, { status: 204 });
}
