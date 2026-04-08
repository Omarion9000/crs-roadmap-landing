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

const IRCC_GENERAL_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html";

// Updated 2026-04: old category-based URL returned 404, replaced with current history page
const IRCC_CATEGORY_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/rounds-invitations-history.html";

// Fallback category URL in case primary returns non-200
const IRCC_CATEGORY_URL_FALLBACK =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/category-based-selection.html";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; PRAVÉ-CRS-Bot/1.0; +https://prave.ca)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-CA,en;q=0.9",
  "Cache-Control": "no-cache",
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

/**
 * Extract rows from an HTML table string.
 * Returns array of string arrays (one per row, cells as text).
 */
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

/**
 * Find nearest section heading (h2/h3) before a given position in the HTML.
 * Used to identify the program type for each table.
 */
function findNearestHeading(html: string, tableIndex: number): string {
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let lastHeading = "General";
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    if (match.index > tableIndex) break;
    const text = stripTags(match[1]).toLowerCase();
    // Map common section titles to our program type labels
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

/**
 * Parse all draws from a single IRCC HTML page.
 * Handles pages that contain multiple tables for different program types.
 */
function parseDrawsFromHtml(html: string, defaultProgram: string): ScrapedDraw[] {
  const draws: ScrapedDraw[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(html)) !== null) {
    const programType = findNearestHeading(html, match.index) || defaultProgram;
    const rows = extractTableRows(match[1]);

    for (const cells of rows) {
      // Skip header rows (contain text like "Round", "Date", "CRS")
      if (!cells[0] || !/^\d+$/.test(cells[0].replace(/\s/g, ""))) continue;

      // Column order: draw_number | date | invitations | minimum_score | [tie-breaking]
      // Some tables omit the draw number column — detect by checking if cell[0] is a number
      const drawNumRaw = cells[0].replace(/\s/g, "");
      const drawNumber = /^\d+$/.test(drawNumRaw) ? parseInt(drawNumRaw, 10) : null;

      // When draw number is present: cols = [num, date, invitations, score]
      // When absent:                 cols = [date, invitations, score]
      const offset = drawNumber !== null ? 1 : 0;

      const dateStr = parseCanadaDate(cells[offset] ?? "");
      const invitations = parseNumber(cells[offset + 1] ?? "");
      const score = parseNumber(cells[offset + 2] ?? "");

      if (!dateStr || invitations === null || score === null) continue;
      if (score < 300 || score > 900) continue; // sanity check
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

  return draws;
}

// ----- Public API -----

export type ScrapeResult = {
  draws: ScrapedDraw[];
  source: string;
  fetchedAt: string;
  error?: string;
};

export async function scrapeGeneralDraws(): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(IRCC_GENERAL_URL, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const draws = parseDrawsFromHtml(html, "General");
    return { draws, source: IRCC_GENERAL_URL, fetchedAt };
  } catch (err) {
    return {
      draws: [],
      source: IRCC_GENERAL_URL,
      fetchedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function scrapeCategoryDraws(): Promise<ScrapeResult> {
  const fetchedAt = new Date().toISOString();

  for (const url of [IRCC_CATEGORY_URL, IRCC_CATEGORY_URL_FALLBACK]) {
    try {
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) continue; // try next URL
      const html = await res.text();
      const draws = parseDrawsFromHtml(html, "Category-Based");
      return { draws, source: url, fetchedAt };
    } catch {
      // try next URL
    }
  }

  return {
    draws: [],
    source: IRCC_CATEGORY_URL,
    fetchedAt,
    error: "All category draw URLs returned non-200 or failed",
  };
}
