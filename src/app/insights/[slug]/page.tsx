import { notFound } from "next/navigation";
import StrategyPageShell from "@/components/insights/StrategyPageShell";
import { strategyPages, strategyPageList, type StrategySlug } from "@/lib/insights/strategyPages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";

export function generateStaticParams() {
  return strategyPageList.map((page) => ({ slug: page.slug }));
}

export default async function InsightPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = strategyPages[slug as StrategySlug];

  if (!page) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userPlan = user ? await getUserPlan(user.id) : "free";
  const normalizedPlan = userPlan.trim().toLowerCase() === "pro" ? "pro" : "free";

  return (
    <StrategyPageShell
      page={page}
      userPlan={normalizedPlan}
      isAuthenticated={!!user}
    />
  );
}
