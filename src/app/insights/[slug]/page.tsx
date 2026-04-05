import { notFound } from "next/navigation";
import StrategyPageShell from "@/components/insights/StrategyPageShell";
import { strategyPages, strategyPageList, type StrategySlug } from "@/lib/insights/strategyPages";
import { resolveInsightViewer } from "@/lib/insights/viewer";

export function generateStaticParams() {
  return strategyPageList.map((page) => ({ slug: page.slug }));
}

export const dynamic = "force-dynamic";

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

  const viewer = await resolveInsightViewer(`slug:${slug}`);

  return (
    <StrategyPageShell
      page={page}
      userPlan={viewer.userPlan}
      isAuthenticated={viewer.isAuthenticated}
    />
  );
}
