/**
 * Scraper for IRCC Express Entry draw results.
 * Source: canada.ca official pages (public government data).
 */

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
  // Debug fields — always populated for observability
  httpStatus: number | null;
  contentType: string | null;
  htmlLength: number | null;
  tablesFound: number | null;
  rowsBeforeFilter: number | null;
  htmlPreview: string | null; // first 500 chars
  error?: string;
};

const IRCC_GENERAL_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html";

// Updated 2026-04: old category-based URL returned 404
const IRCC_CATEGORY_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/rounds-invitations-history.html";

const IRCC_CATEGORY_URL_FALLBACK =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/category-based-selection.html";

// Realistic Chrome on macOS UA — canada.ca silently returns bot-challenge pages
// for non-browser UAs (HTTP 200, no tables, no error).
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  Connection: "keep-alive",
  Referer: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Upgrade-Insecure-Requests": "1",
};

// ----- HTML helpers -----

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCanadaDate(raw: string): string | null {
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  const m = raw.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return null;
  const mm = months[m[1].toLowerCase()];
  if (!mm) return null;
  return `${m[3]}-${mm}-${m[2].padStart(2, "0")}`;
}

function parseNumber(raw: string): number | null {
  const n = parseInt(raw.replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function extractTableRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    for (const cell of cellMatches) {
      cells.push(stripTags(cell[1]));
    }
    if (cells.length >= 4) rows.push(cells);
  }
  return rows;
}

function findNearestHeading(html: string, tableIndex: number): string {
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let lastHeading = "General";
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    if (match.index > tableIndex) break;
    const text = stripTags(match[1]).toLowerCase();
    if (text.includes("no program") || text.includes("general")) {
      lastHeading = "General";
    } else if (text.includes("category")) {
      lastHeading = "Category-Based";
    } else if (text.includes("canadian experience")) {
      lastHeading = "CEC";
    } else if (text.includes("federal skilled worker")) {
      lastHeading = "FSW";
    } else if (text.includes("french")) {
      lastHeading = "French Language";
    } else if (text.includes("stem") || text.includes("science")) {
      lastHeading = "STEM";
    } else if (text.includes("trade")) {
      lastHeading = "Trade";
    } else if (text.includes("health")) {
      lastHeading = "Healthcare";
    } else if (text.includes("transport")) {
      lastHeading = "Transport";
    } else if (text.includes("agriculture")) {
      lastHeading = "Agriculture";
    } else if (text.length > 3) {
      lastHeading = stripTags(match[1]).trim().split("\n")[0].trim() || lastHeading;
    }
  }
  return lastHeading;
}

function parseDrawsFromHtml(
  html: string,
  defaultProgram: string
): { draws: ScrapedDraw[]; tablesFound: number; rowsBeforeFilter: number } {
  const draws: ScrapedDraw[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match: RegExpExecArray | null;
  let tablesFound = 0;
  let rowsBeforeFilter = 0;

  while ((match = tableRegex.exec(html)) !== null) {
    tablesFound++;
    const programType = findNearestHeading(html, match.index) || defaultProgram;
    const rows = extractTableRows(match[1]);
    rowsBeforeFilter += rows.length;

    for (const cells of rows) {
      if (!cells[0] || !/^\d+$/.test(cells[0].replace(/\s/g, ""))) continue;

      const drawNumRaw = cells[0].replace(/\s/g, "");
      const drawNumber = /^\d+$/.test(drawNumRaw) ? parseInt(drawNumRaw, 10) : null;
      const offset = drawNumber !== null ? 1 : 0;

      const dateStr = parseCanadaDate(cells[offset] ?? "");
      const invitations = parseNumber(cells[offset + 1] ?? "");
      const score = parseNumber(cells[offset + 2] ?? "");

      if (!dateStr || invitations === null || score === null) continue;
      if (score < 300 || score > 900) continue;
      if (invitations < 1 || invitations > 100000) continue;

      draws.push({
        draw_number: drawNumber,
        draw_date: dateStr,
        program_type: programType,
        minimum_score: score,
        invitations_issued: invitations,
      });
    }
  }

  return { draws, tablesFound, rowsBeforeFilter };
}

// ----- Public API -----

export async function scrapeGeneralDraws(): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let contentType: string | null = null;
  let htmlLength: number | null = null;
  let htmlPreview: string | null = null;

  try {
    const res = await fetch(IRCC_GENERAL_URL, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });

    httpStatus = res.status;
    contentType = res.headers.get("content-type");

    if (!res.ok) {
      const err = `HTTP ${res.status}`;
      console.log(`[scraper] general draws fetch failed: ${err} url=${IRCC_GENERAL_URL}`);
      return { draws: [], source: IRCC_GENERAL_URL, fetchedAt, httpStatus, contentType, htmlLength: 0, tablesFound: 0, rowsBeforeFilter: 0, htmlPreview: null, error: err };
    }

    const html = await res.text();
    htmlLength = html.length;
    htmlPreview = html.slice(0, 500);

    const { draws, tablesFound, rowsBeforeFilter } = parseDrawsFromHtml(html, "General");

    console.log(`[scraper] general: status=${httpStatus} len=${htmlLength} tables=${tablesFound} rows=${rowsBeforeFilter} draws=${draws.length} url=${IRCC_GENERAL_URL}`);

    return { draws, source: IRCC_GENERAL_URL, fetchedAt, httpStatus, contentType, htmlLength, tablesFound, rowsBeforeFilter, htmlPreview };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[scraper] general draws exception: ${msg}`);
    return { draws: [], source: IRCC_GENERAL_URL, fetchedAt, httpStatus, contentType, htmlLength, tablesFound: null, rowsBeforeFilter: null, htmlPreview, error: msg };
  }
}

export async function scrapeCategoryDraws(): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();

  for (const url of [IRCC_CATEGORY_URL, IRCC_CATEGORY_URL_FALLBACK]) {
    let httpStatus: number | null = null;
    let contentType: string | null = null;

    try {
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        cache: "no-store",
      });

      httpStatus = res.status;
      contentType = res.headers.get("content-type");

      if (!res.ok) {
        console.log(`[scraper] category draws fetch failed: HTTP ${res.status} url=${url}`);
        continue;
      }

      const html = await res.text();
      const htmlLength = html.length;
      const htmlPreview = html.slice(0, 500);

      const { draws, tablesFound, rowsBeforeFilter } = parseDrawsFromHtml(html, "Category-Based");

      console.log(`[scraper] category: status=${httpStatus} len=${htmlLength} tables=${tablesFound} rows=${rowsBeforeFilter} draws=${draws.length} url=${url}`);

      return { draws, source: url, fetchedAt, httpStatus, contentType, htmlLength, tablesFound, rowsBeforeFilter, htmlPreview };
    } catch (err) {
      console.log(`[scraper] category draws exception for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    draws: [],
    source: IRCC_CATEGORY_URL,
    fetchedAt,
    httpStatus: null,
    contentType: null,
    htmlLength: null,
    tablesFound: null,
    rowsBeforeFilter: null,
    htmlPreview: null,
    error: "All category draw URLs returned non-200 or failed",
  };
}
