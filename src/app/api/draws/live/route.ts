/**
 * /api/draws/live
 * Returns the latest Express Entry draws from Supabase.
 * Falls back to static bundled data if the table is empty or unavailable.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GENERAL_DRAWS_REAL, CATEGORY_DRAWS_REAL } from "@/lib/insights/data/general-draws.real";
import type { Draw } from "@/lib/insights/types";

export const dynamic = "force-dynamic";

type DrawRow = {
  id: string;
  draw_date: string;
  draw_number: number | null;
  program_type: string;
  minimum_score: number;
  invitations_issued: number;
  is_new: boolean;
  created_at: string;
};

function rowToDraw(row: DrawRow): Draw & { is_new: boolean; draw_number: number | null } {
  return {
    date: row.draw_date,
    program: row.program_type,
    cutoff: row.minimum_score,
    invitations: row.invitations_issued,
    is_new: row.is_new,
    draw_number: row.draw_number,
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("express_entry_draws") as any)
      .select("id, draw_date, draw_number, program_type, minimum_score, invitations_issued, is_new, created_at")
      .order("draw_date", { ascending: false })
      .limit(20) as { data: DrawRow[] | null; error: { message: string } | null };

    if (!error && data && data.length > 0) {
      return NextResponse.json(
        {
          items: data.map(rowToDraw),
          source: "supabase",
          updatedAt: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Fallback: merge static datasets
    const staticDraws = [
      ...GENERAL_DRAWS_REAL.map((d) => ({ ...d, is_new: false, draw_number: null })),
      ...CATEGORY_DRAWS_REAL.map((d) => ({ ...d, is_new: false, draw_number: null })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(
      {
        items: staticDraws,
        source: "static",
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    // Always return something usable
    const staticDraws = [
      ...GENERAL_DRAWS_REAL.map((d) => ({ ...d, is_new: false, draw_number: null })),
      ...CATEGORY_DRAWS_REAL.map((d) => ({ ...d, is_new: false, draw_number: null })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(
      {
        items: staticDraws,
        source: "static-fallback",
        updatedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
