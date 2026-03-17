import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserPlan = "free" | "pro";

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  created_at: string | null;
};

export async function getUserSubscription(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRecord>();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return "free";
  }

  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing";

  const isPro = subscription.plan === "pro";

  if (isActive && isPro) {
    return "pro";
  }

  return "free";
}

export async function isProUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "pro";
}