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

type AuthenticatedProUser = {
  id: string;
  email: string;
};

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createAdminRoadmapsClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

async function requireAuthenticatedProUser(): Promise<AuthenticatedProUser> {
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = cleanEmail(user.email ?? "");

  if (!email || !isValidEmail(email)) {
    throw new Error("Invalid authenticated email");
  }

  const userPlan = await getUserPlan(user.id);
  const normalizedPlan = userPlan.trim().toLowerCase();

  if (normalizedPlan !== "pro") {
    throw new Error("Pro plan required");
  }

  return {
    id: user.id,
    email,
  };
}

export async function GET() {
  try {
    const user = await requireAuthenticatedProUser();
    const supabase = createAdminRoadmapsClient();

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
        { ok: false, error: "No roadmap found" },
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

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Pro plan required"
        ? 403
        : message === "Missing Supabase env vars"
        ? 500
        : message === "Invalid authenticated email"
        ? 400
        : 500;

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedProUser();

    const body = (await req.json()) as SaveRoadmapPayload;

    const email = user.email;

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

    const supabase = createAdminRoadmapsClient();

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

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Pro plan required"
        ? 403
        : message === "Missing Supabase env vars"
        ? 500
        : message === "Invalid authenticated email"
        ? 400
        : 500;

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuthenticatedProUser();

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing roadmap id" },
        { status: 400 }
      );
    }

    const supabase = createAdminRoadmapsClient();

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

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Pro plan required"
        ? 403
        : message === "Missing Supabase env vars"
        ? 500
        : message === "Invalid authenticated email"
        ? 400
        : 500;

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}