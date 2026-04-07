// src/app/api/insights/benchmark/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CATEGORY_DRAWS_REAL, GENERAL_DRAWS_REAL } from "@/lib/insights/data/general-draws.real";

export const dynamic = "force-dynamic";

type Program = "general" | "category";

type DrawRow = {
  draw_date: string;
  minimum_score: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const program = (searchParams.get("program") ?? "general").toLowerCase() as Program;

    // ── Try Supabase first ──────────────────────────────────────────────────
    try {
      const supabase = createSupabaseAdminClient();

      // Map "general" → all draws not category-based; "category" → category-based
      const programFilter =
        program === "category" ? "Category-Based" : "General";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("express_entry_draws") as any)
        .select("draw_date, minimum_score")
        .eq("program_type", programFilter)
        .order("draw_date", { ascending: false })
        .limit(2) as { data: DrawRow[] | null; error: { message: string } | null };

      if (!error && data && data.length > 0) {
        const latest = data[0];
        const prev = data[1];
        const trend = prev ? latest.minimum_score - prev.minimum_score : 0;

        return NextResponse.json({
          ok: true,
          data: {
            program,
            latest: { cutoff: latest.minimum_score, date: latest.draw_date },
            trend,
            source: "supabase",
          },
        });
      }
    } catch {
      // Supabase unavailable — fall through to static
    }

    // ── Static fallback ─────────────────────────────────────────────────────
    const draws = program === "category" ? CATEGORY_DRAWS_REAL : GENERAL_DRAWS_REAL;

    if (!Array.isArray(draws) || draws.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No draw data available" },
        { status: 500 }
      );
    }

    const latest = draws[0];
    const prev = draws.length >= 2 ? draws[1] : undefined;
    const trend = prev ? latest.cutoff - prev.cutoff : 0;

    return NextResponse.json({
      ok: true,
      data: {
        program,
        latest: { cutoff: latest.cutoff, date: latest.date },
        trend,
        source: "static",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[benchmark route] error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
