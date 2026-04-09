/**
 * GET /api/debug/scraper
 *
 * Diagnostic endpoint — runs the IRCC JSON scraper and returns full details
 * without writing anything to Supabase.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>  (or any env in non-production)
 */

import { NextResponse, type NextRequest } from "next/server";
import { scrapeAllDraws } from "@/lib/draws/scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await scrapeAllDraws();

  return NextResponse.json({
    ok: true,
    source: result.source,
    fetchedAt: result.fetchedAt,
    httpStatus: result.httpStatus,
    contentType: result.contentType,
    drawsParsed: result.drawsParsed,
    error: result.error ?? null,
    sample: result.draws.slice(0, 5),
    allDraws: result.draws,
  });
}
