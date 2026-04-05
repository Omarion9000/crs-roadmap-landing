import { normalizePreferredName } from "@/lib/personalization";
import { getUserPlan, type UserPlan } from "@/lib/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RoadmapSnapshotRow = {
  profile_snapshot?: unknown;
};

export type InsightViewer = {
  user: {
    id: string;
    email: string | null;
  } | null;
  isAuthenticated: boolean;
  userPlan: UserPlan;
  isPro: boolean;
  profileOwnerKey: string | null;
  preferredName: string | null;
  hasRoadmapSnapshot: boolean;
  hasProfile: boolean;
  hasStrategyPayload: boolean;
};

function normalizePlan(value: unknown): UserPlan {
  return typeof value === "string" && value.trim().toLowerCase() === "pro"
    ? "pro"
    : "free";
}

function extractPreferredNameFromSnapshot(profileSnapshot: unknown) {
  if (!profileSnapshot || typeof profileSnapshot !== "object") {
    return null;
  }

  const preferredName =
    "preferred_name" in profileSnapshot
      ? profileSnapshot.preferred_name
      : null;

  return typeof preferredName === "string"
    ? normalizePreferredName(preferredName)
    : null;
}

export async function resolveInsightViewer(route: string): Promise<InsightViewer> {
  let user: InsightViewer["user"] = null;
  let preferredName: string | null = null;
  let hasRoadmapSnapshot = false;
  let userPlan: UserPlan = "free";

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    user = supabaseUser
      ? {
          id: supabaseUser.id,
          email: supabaseUser.email ?? null,
        }
      : null;

    if (supabaseUser) {
      try {
        const { data: latestRoadmap } = await supabase
          .from("roadmaps")
          .select("profile_snapshot")
          .eq("user_id", supabaseUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<RoadmapSnapshotRow>();

        hasRoadmapSnapshot = !!latestRoadmap?.profile_snapshot;
        preferredName =
          extractPreferredNameFromSnapshot(latestRoadmap?.profile_snapshot) ??
          normalizePreferredName(
            typeof supabaseUser.user_metadata?.preferred_name === "string"
              ? supabaseUser.user_metadata.preferred_name
              : typeof supabaseUser.user_metadata?.name === "string"
                ? supabaseUser.user_metadata.name
                : null
          );
      } catch (roadmapError) {
        const message =
          roadmapError instanceof Error ? roadmapError.message : "unknown";
        console.log("[insights] roadmap snapshot lookup failed:", route, message);
      }

      try {
        userPlan = normalizePlan(await getUserPlan(supabaseUser.id));
      } catch (planError) {
        const message =
          planError instanceof Error ? planError.message : "unknown";
        console.log("[insights] plan lookup failed:", route, message);
        userPlan = "free";
      }
    }
  } catch (authError) {
    const message = authError instanceof Error ? authError.message : "unknown";
    console.log("[insights] viewer load failed:", route, message);
  }

  const viewer: InsightViewer = {
    user,
    isAuthenticated: !!user,
    userPlan,
    isPro: userPlan === "pro",
    profileOwnerKey: user?.id ?? null,
    preferredName,
    hasRoadmapSnapshot,
    hasProfile: !!user?.id,
    hasStrategyPayload: userPlan === "pro",
  };

  console.log("[insights] route:", route);
  console.log("[insights] user authenticated:", viewer.isAuthenticated ? "yes" : "no");
  console.log("[insights] roadmap snapshot found:", viewer.hasRoadmapSnapshot ? "yes" : "no");
  console.log("[insights] preferred_name available:", viewer.preferredName ? "yes" : "no");
  console.log("[insights] profile available:", viewer.hasProfile ? "yes" : "no");
  console.log(
    "[insights] strategy payload available:",
    viewer.hasStrategyPayload ? "yes" : "preview"
  );

  return viewer;
}
