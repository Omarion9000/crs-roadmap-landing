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
  ai_requests_used?: number | null;
  ai_requests_limit?: number | null;
  ai_usage_period_start?: string | null;
  created_at: string | null;
};

export function isProUser(plan: string | null | undefined) {
  return plan === "pro";
}
export function getNextMonthStart(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function isNewUsagePeriod(periodStart: string | Date, now: Date = new Date()) {
  const start = typeof periodStart === "string" ? new Date(periodStart) : periodStart;
  const nextMonthStart = getNextMonthStart(start);
  return now >= nextMonthStart;
}
export async function getUserSubscription(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, ai_requests_used, ai_requests_limit, ai_usage_period_start, created_at"
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

  const isPaidPlan = isProUser(subscription.plan);

  if (isActive && isPaidPlan) {
    return "pro";
  }

  return "free";
}

export async function isCurrentUserPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return isProUser(plan);
}
