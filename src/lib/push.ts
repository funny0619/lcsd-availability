import webpush from "web-push";
import type { StoredPushSubscription } from "@/src/lib/types";

let configured = false;

function configureWebPush(): void {
  if (configured) {
    return;
  }

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY are required",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendPush(
  subscription: StoredPushSubscription,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  configureWebPush();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
