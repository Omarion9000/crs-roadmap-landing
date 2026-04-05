import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let latestPreferredName: string | null = null;

    try {
      const { data: latestRoadmap } = await supabase
        .from("roadmaps")
        .select("profile_snapshot")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      latestPreferredName =
        latestRoadmap &&
        typeof latestRoadmap === "object" &&
        "profile_snapshot" in latestRoadmap &&
        latestRoadmap.profile_snapshot &&
        typeof latestRoadmap.profile_snapshot === "object" &&
        "preferred_name" in latestRoadmap.profile_snapshot
          ? typeof latestRoadmap.profile_snapshot.preferred_name === "string"
            ? latestRoadmap.profile_snapshot.preferred_name
            : null
          : null;
    } catch (roadmapError) {
      console.log(
        "[auth/me] roadmap preferred_name lookup failed:",
        roadmapError instanceof Error ? roadmapError.message : "unknown"
      );
    }

    const metadataPreferredName =
      typeof user.user_metadata?.preferred_name === "string"
        ? user.user_metadata.preferred_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null;

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email ?? "",
        preferred_name: latestPreferredName ?? metadataPreferredName ?? "",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
