/**
 * GET /api/debug/scraper
 *
 * Diagnostic endpoint for the canada.ca draws scraper.
 * Returns raw fetch details (HTTP status, content-type, HTML preview,
 * table/row counts, parsed draws) without writing anything to Supabase.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 * (also open in non-production environments without a secret)
 */

import { NextResponse, type NextRequest } from "next/server";
import { scrapeGeneralDraws, scrapeCategoryDraws } from "@/lib/draws/scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  // Always open in non-production (local dev / preview)
  if (process.env.NODE_ENV !== "production") return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  const [generalResult, categoryResult] = await Promise.all([
    scrapeGeneralDraws(),
    scrapeCategoryDraws(),
  ]);

  return NextResponse.json({
    ok: true,
    startedAt,
    general: {
      url: generalResult.source,
      httpStatus: generalResult.httpStatus,
      contentType: generalResult.contentType,
      htmlLength: generalResult.htmlLength,
      tablesFound: generalResult.tablesFound,
      rowsBeforeFilter: generalResult.rowsBeforeFilter,
      drawsParsed: generalResult.draws.length,
      // First 1000 chars of HTML — enough to see if it's a real page or a
      // bot-challenge / redirect page
      htmlPreview: generalResult.htmlPreview
        ? generalResult.htmlPreview.slice(0, 1000)
        : null,
      draws: generalResult.draws.slice(0, 5), // first 5 as sample
      error: generalResult.error ?? null,
    },
    category: {
      url: categoryResult.source,
      httpStatus: categoryResult.httpStatus,
      contentType: categoryResult.contentType,
      htmlLength: categoryResult.htmlLength,
      tablesFound: categoryResult.tablesFound,
      rowsBeforeFilter: categoryResult.rowsBeforeFilter,
      drawsParsed: categoryResult.draws.length,
      htmlPreview: categoryResult.htmlPreview
        ? categoryResult.htmlPreview.slice(0, 1000)
        : null,
      draws: categoryResult.draws.slice(0, 5),
      error: categoryResult.error ?? null,
    },
  });
}
