/**
 * /api/admin/seed-draws
 *
 * One-time endpoint to seed the express_entry_draws table
 * with the existing hardcoded draw data.
 *
 * Protected by CRON_SECRET. Call once, then ignore.
 *
 * GET /api/admin/seed-draws
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GENERAL_DRAWS_REAL, CATEGORY_DRAWS_REAL } from "@/lib/insights/data/general-draws.real";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SeedRow = {
  draw_date: string;
  draw_number: number | null;
  program_type: string;
  minimum_score: number;
  invitations_issued: number;
  is_new: boolean;
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // Mark only the most recent draw per program as is_new: true
  const allDraws: SeedRow[] = [
    ...GENERAL_DRAWS_REAL.map((d, i) => ({
      draw_date: d.date,
      draw_number: null,
      program_type: "General",
      minimum_score: d.cutoff,
      invitations_issued: d.invitations,
      is_new: i === 0,
    })),
    ...CATEGORY_DRAWS_REAL.map((d, i) => ({
      draw_date: d.date,
      draw_number: null,
      program_type: "Category-Based",
      minimum_score: d.cutoff,
      invitations_issued: d.invitations,
      is_new: i === 0,
    })),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("express_entry_draws") as any)
    .upsert(allDraws, {
      onConflict: "draw_date,program_type",
      ignoreDuplicates: false,
    })
    .select("id, draw_date, program_type") as {
      data: { id: string; draw_date: string; program_type: string }[] | null;
      error: { message: string } | null;
    };

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    seeded: data?.length ?? 0,
    rows: data,
  });
}
