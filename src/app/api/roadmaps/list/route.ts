import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RoadmapListRow = {
  id: string;
  email: string;
  profile_snapshot: unknown;
  program_target: string;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("roadmaps")
      .select("id, email, profile_snapshot, program_target, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      roadmaps: (data ?? []) as RoadmapListRow[],
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}