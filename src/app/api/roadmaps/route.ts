import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";

type SaveRoadmapPayload = {
  email?: string;
  profile_snapshot?: unknown;
  program_target?: string;
  top_scenarios?: unknown;
};

type RoadmapRow = {
  id: string;
  user_id: string | null;
  email: string;
  profile_snapshot: unknown;
  program_target: string;
  top_scenarios: unknown;
  created_at: string;
};

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

    const authSupabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userPlan = await getUserPlan(user.id);
    const normalizedPlan = userPlan.trim().toLowerCase();

    if (normalizedPlan !== "pro") {
      return NextResponse.json(
        { ok: false, error: "Pro plan required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = cleanEmail(searchParams.get("email") ?? "");

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("roadmaps")
      .select("id, user_id, email, profile_snapshot, program_target, top_scenarios, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<RoadmapRow>();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "No roadmap found for this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      roadmap: data,
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

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const authSupabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userPlan = await getUserPlan(user.id);
    const normalizedPlan = userPlan.trim().toLowerCase();

    if (normalizedPlan !== "pro") {
      return NextResponse.json(
        { ok: false, error: "Pro plan required" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as SaveRoadmapPayload;

    const email = cleanEmail(body.email ?? "");

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    if (!body.profile_snapshot || typeof body.profile_snapshot !== "object") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid profile_snapshot" },
        { status: 400 }
      );
    }

    if (!body.program_target || typeof body.program_target !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid program_target" },
        { status: 400 }
      );
    }

    if (!body.top_scenarios) {
      return NextResponse.json(
        { ok: false, error: "Missing top_scenarios" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("roadmaps")
      .insert([
        {
          user_id: user.id,
          email,
          profile_snapshot: body.profile_snapshot,
          program_target: body.program_target,
          top_scenarios: body.top_scenarios,
        },
      ])
      .select("id, email, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      roadmap: data,
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

export async function DELETE(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const authSupabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userPlan = await getUserPlan(user.id);
    const normalizedPlan = userPlan.trim().toLowerCase();

    if (normalizedPlan !== "pro") {
      return NextResponse.json(
        { ok: false, error: "Pro plan required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing roadmap id" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("roadmaps")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Roadmap not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deletedId: data.id });
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