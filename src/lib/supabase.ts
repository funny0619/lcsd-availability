import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoredPushSubscription } from "@/src/lib/types";

type PushSubscriptionRow = {
  endpoint: string;
  subscription: StoredPushSubscription;
};

let adminClient: SupabaseClient | undefined;

function getAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required",
    );
  }

  adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}

export async function savePushSubscription(
  subscription: StoredPushSubscription,
): Promise<void> {
  const { error } = await getAdminClient()
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: subscription.endpoint,
        subscription,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    throw new Error(`Could not save push subscription: ${error.message}`);
  }
}

export async function listPushSubscriptions(): Promise<PushSubscriptionRow[]> {
  const { data, error } = await getAdminClient()
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .eq("active", true);

  if (error) {
    throw new Error(`Could not list push subscriptions: ${error.message}`);
  }

  return (data ?? []) as PushSubscriptionRow[];
}

export async function deactivatePushSubscription(endpoint: string): Promise<void> {
  const { error } = await getAdminClient()
    .from("push_subscriptions")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`Could not deactivate push subscription: ${error.message}`);
  }
}

export async function hasDailySummaryBeenSent(dateKey: string): Promise<boolean> {
  const { data, error } = await getAdminClient()
    .from("daily_summary_log")
    .select("summary_date")
    .eq("summary_date", dateKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read daily summary log: ${error.message}`);
  }

  return Boolean(data);
}

export async function markDailySummarySent(dateKey: string): Promise<void> {
  const { error } = await getAdminClient().from("daily_summary_log").upsert(
    {
      summary_date: dateKey,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "summary_date" },
  );

  if (error) {
    throw new Error(`Could not write daily summary log: ${error.message}`);
  }
}
