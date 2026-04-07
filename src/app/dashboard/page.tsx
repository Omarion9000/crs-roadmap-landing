import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";
import { t as tr, type Lang } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

type RoadmapRow = {
  id: string;
  email: string;
  profile_snapshot: {
    baseCrs?: number;
    effectiveBaseCrs?: number;
    ieltsClb?: number;
    frenchClb?: number;
    canExpYears?: number;
    hasJobOffer?: boolean;
    hasPnp?: boolean;
    lang?: "en" | "es";
  } | null;
  program_target: string;
  top_scenarios:
    | Array<{
        id?: string;
        title?: string;
        delta?: number;
      }>
    | null;
  created_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function programLabel(program: string) {
  switch (program) {
    case "general":
      return "General";
    case "category":
      return "Category";
    case "cec":
      return "CEC";
    case "fsw":
      return "FSW";
    case "pnp":
      return "PNP";
    default:
      return program;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("crs_lang")?.value;
  const lang: Lang = langCookie === "es" ? "es" : "en";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const userPlan = await getUserPlan(user.id);
  const normalizedPlan = userPlan.trim().toLowerCase();

  if (normalizedPlan !== "pro") {
    redirect("/billing");
  }

  const { data: roadmapsData, error } = await supabase
    .from("roadmaps")
    .select("id, email, profile_snapshot, program_target, top_scenarios, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<RoadmapRow[]>();

  const roadmaps = error ? [] : (roadmapsData ?? []);
  const lastRoadmap = roadmaps[0] ?? null;
  const savedCount = roadmaps.length;
  const lastBaseCrs =
    typeof lastRoadmap?.profile_snapshot?.baseCrs === "number"
      ? lastRoadmap.profile_snapshot.baseCrs
      : null;
  const bestMove = lastRoadmap?.top_scenarios?.[0] ?? null;

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
              {tr("dash_eyebrow", lang)}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {tr("dash_title", lang)}
            </h1>
            <p className="mt-3 text-sm text-white/65">
              {tr("dash_logged_as", lang)} <span className="font-semibold text-white">{user.email}</span>
            </p>

            <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {tr("dash_current_plan", lang)} {normalizedPlan}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/simulator"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              {tr("dash_open_simulator", lang)}
            </Link>
            <Link
              href="/simulator"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tr("dash_load_roadmap", lang)}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {tr("dash_saved_roadmaps", lang)}
            </div>
            <div className="mt-3 text-3xl font-bold">{savedCount}</div>
            <div className="mt-2 text-sm text-white/60">
              {tr("dash_saved_desc", lang)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {tr("dash_last_crs", lang)}
            </div>
            <div className="mt-3 text-3xl font-bold">{lastBaseCrs ?? "—"}</div>
            <div className="mt-2 text-sm text-white/60">
              {lastRoadmap ? `${tr("dash_program", lang)}: ${programLabel(lastRoadmap.program_target)}` : tr("dash_no_roadmap", lang)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {tr("dash_best_move", lang)}
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              {bestMove?.title ?? tr("dash_no_strategy", lang)}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {typeof bestMove?.delta === "number"
                ? `${tr("dash_est_gain", lang)} +${bestMove.delta} CRS`
                : tr("dash_save_roadmap_hint", lang)}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{tr("dash_latest_title", lang)}</h2>
              <p className="mt-1 text-sm text-white/60">
                {tr("dash_latest_desc", lang)}
              </p>
            </div>
          </div>

          {lastRoadmap ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {tr("dash_program", lang)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {programLabel(lastRoadmap.program_target)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {tr("dash_baseline_crs", lang)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {lastBaseCrs ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {tr("dash_english_french", lang)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {typeof lastRoadmap.profile_snapshot?.ieltsClb === "number"
                    ? `CLB ${lastRoadmap.profile_snapshot.ieltsClb}`
                    : "—"}
                  <span className="mx-2 text-white/30">/</span>
                  {typeof lastRoadmap.profile_snapshot?.frenchClb === "number"
                    ? `CLB ${lastRoadmap.profile_snapshot.frenchClb}`
                    : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {tr("dash_last_updated", lang)}
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {formatDate(lastRoadmap.created_at)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
              {tr("dash_no_roadmaps", lang)}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">{tr("dash_recent_title", lang)}</h2>
          <p className="mt-1 text-sm text-white/60">
            {tr("dash_recent_desc", lang)}
          </p>

          {roadmaps.length > 0 ? (
            <div className="mt-5 space-y-3">
              {roadmaps.slice(0, 5).map((roadmap) => (
                <div
                  key={roadmap.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      CRS {typeof roadmap.profile_snapshot?.baseCrs === "number" ? roadmap.profile_snapshot.baseCrs : "—"}
                      <span className="mx-2 text-white/30">•</span>
                      {programLabel(roadmap.program_target)}
                    </div>
                    <div className="mt-1 text-xs text-white/55">{formatDate(roadmap.created_at)}</div>
                  </div>

                  <div className="text-sm text-white/65">
                    {roadmap.top_scenarios?.[0]?.title
                      ? `${tr("dash_top_move", lang)} ${roadmap.top_scenarios[0].title}`
                      : tr("dash_no_ranked", lang)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
