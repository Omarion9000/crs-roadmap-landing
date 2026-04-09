/**
 * Scraper for IRCC Express Entry draw results.
 *
 * Source: IRCC official JSON feed — canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json
 * This endpoint is publicly available and not blocked by Akamai (unlike the HTML pages).
 *
 * JSON field → DB column mapping:
 *   drawNumber  (string) → draw_number  (int | null)
 *   drawDate    (ISO string "YYYY-MM-DD") → draw_date  (string)
 *   drawName    (string) → program_type  (string, normalized)
 *   drawSize    (string with commas "3,000") → invitations_issued (int)
 *   drawCRS     (string "477") → minimum_score (int)
 */

const IRCC_JSON_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";

// Realistic browser headers — keeps requests consistent with the HTML scraper
// and avoids any future WAF rules that check User-Agent.
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Referer:
    "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html",
};

export type ScrapedDraw = {
  draw_number: number | null;
  draw_date: string; // ISO YYYY-MM-DD
  program_type: string;
  minimum_score: number;
  invitations_issued: number;
};

export type ScrapeResult = {
  draws: ScrapedDraw[];
  source: string;
  fetchedAt: string;
  httpStatus: number | null;
  contentType: string | null;
  drawsParsed: number;
  error?: string;
};

// ── drawName → program_type normalization ────────────────────────────────────
// IRCC uses verbose English names; we normalize to consistent short labels
// that match the existing DB values.

function normalizeProgramType(drawName: string): string {
  const n = drawName.toLowerCase();

  if (n.includes("no program") || n.includes("general"))           return "General";
  if (n.includes("canadian experience"))                            return "CEC";
  if (n.includes("federal skilled worker"))                         return "FSW";
  if (n.includes("federal skilled trade") || n.includes("trades"))  return "Trade";
  if (n.includes("provincial nominee"))                             return "PNP";
  if (n.includes("french"))                                         return "French Language";
  if (n.includes("healthcare") || n.includes("health care") ||
      n.includes("health occupation"))                              return "Healthcare";
  if (n.includes("stem") || n.includes("science, technology"))     return "STEM";
  if (n.includes("transport"))                                      return "Transport";
  if (n.includes("agriculture"))                                    return "Agriculture";
  if (n.includes("education"))                                      return "Education";

  // Keep the original name for any new category IRCC introduces
  return drawName.trim();
}

function parseIntSafe(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw.replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

// ── JSON response shape from IRCC ─────────────────────────────────────────────

type IrccRound = {
  drawNumber?: string;
  drawDate?: string;      // "YYYY-MM-DD"
  drawDateFull?: string;  // "April 2, 2026" (not used)
  drawName?: string;
  drawSize?: string;      // "3,000"
  drawCRS?: string;       // "477"
  [key: string]: unknown;
};

type IrccJsonResponse = {
  rounds?: IrccRound[];
  [key: string]: unknown;
};

// ── Public API ────────────────────────────────────────────────────────────────

export async function scrapeAllDraws(): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();

  let httpStatus: number | null = null;
  let contentType: string | null = null;

  try {
    const res = await fetch(IRCC_JSON_URL, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });

    httpStatus = res.status;
    contentType = res.headers.get("content-type");

    if (!res.ok) {
      const err = `HTTP ${res.status}`;
      console.log(`[scraper] fetch failed: ${err} url=${IRCC_JSON_URL}`);
      return { draws: [], source: IRCC_JSON_URL, fetchedAt, httpStatus, contentType, drawsParsed: 0, error: err };
    }

    const json = (await res.json()) as IrccJsonResponse;
    const rounds = json?.rounds;

    if (!Array.isArray(rounds)) {
      const err = "JSON response missing 'rounds' array";
      console.log(`[scraper] ${err} — keys: ${Object.keys(json ?? {}).join(", ")}`);
      return { draws: [], source: IRCC_JSON_URL, fetchedAt, httpStatus, contentType, drawsParsed: 0, error: err };
    }

    const draws: ScrapedDraw[] = [];

    for (const round of rounds) {
      const drawNumber = parseIntSafe(round.drawNumber);
      const drawDate = round.drawDate?.trim() ?? "";
      const programType = normalizeProgramType(round.drawName ?? "");
      const minimumScore = parseIntSafe(round.drawCRS);
      const invitations = parseIntSafe(round.drawSize);

      // Validate
      if (!drawDate || !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) continue;
      if (minimumScore === null || minimumScore < 300 || minimumScore > 900) continue;
      if (invitations === null || invitations < 1 || invitations > 100_000) continue;

      draws.push({
        draw_number: drawNumber,
        draw_date: drawDate,
        program_type: programType,
        minimum_score: minimumScore,
        invitations_issued: invitations,
      });
    }

    console.log(
      `[scraper] status=${httpStatus} rounds_in_json=${rounds.length} draws_parsed=${draws.length}`
    );

    return { draws, source: IRCC_JSON_URL, fetchedAt, httpStatus, contentType, drawsParsed: draws.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[scraper] exception: ${msg}`);
    return { draws: [], source: IRCC_JSON_URL, fetchedAt, httpStatus, contentType, drawsParsed: 0, error: msg };
  }
}

// Back-compat shims so the cron route doesn't need to change.
// Both return the same unified result; the cron route merges .draws from both.
export const scrapeGeneralDraws = scrapeAllDraws;
export const scrapeCategoryDraws = async (): Promise<ScrapeResult> => ({
  draws: [],
  source: IRCC_JSON_URL,
  fetchedAt: new Date().toISOString(),
  httpStatus: null,
  contentType: null,
  drawsParsed: 0,
});
