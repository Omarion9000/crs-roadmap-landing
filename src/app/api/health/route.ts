import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, supabase: false, draws_count: 0, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { count, error } = await supabase
      .from("draws")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        ok: true,
        supabase: false,
        draws_count: 0,
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      supabase: true,
      draws_count: count ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        supabase: false,
        draws_count: 0,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
