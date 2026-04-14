/**
 * /api/cron/scrape-draws
 *
 * Vercel cron job — runs every 2 hours.
 * 1. Scrapes IRCC canada.ca for the latest Express Entry draw results.
 * 2. Saves new draws to Supabase (skips duplicates).
 * 3. If a new draw is detected, sends email notifications to all active Pro users.
 *
 * Secured with CRON_SECRET env var.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { scrapeGeneralDraws, scrapeCategoryDraws, type ScrapedDraw } from "@/lib/draws/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // must be set in Vercel env vars
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

type DrawRow = {
  id: string;
  draw_number: number | null;
  draw_date: string;
  program_type: string;
  minimum_score: number;
  invitations_issued: number;
  is_new: boolean;
  created_at: string;
};

type RoadmapRow = {
  email: string;
  profile_snapshot: { baseCrs?: number } | null;
};

async function getLatestStoredDraw(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  programType: string
): Promise<DrawRow | null> {
  const { data } = await (supabase.from("express_entry_draws") as AnyTable)
    .select("*")
    .eq("program_type", programType)
    .order("draw_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DrawRow) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

async function upsertDraw(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  draw: ScrapedDraw
): Promise<{ inserted: boolean; row: DrawRow | null }> {
  const payload = {
    draw_date: draw.draw_date,
    draw_number: draw.draw_number,
    program_type: draw.program_type,
    minimum_score: draw.minimum_score,
    invitations_issued: draw.invitations_issued,
    is_new: true,
  };

  // Cast needed until Supabase types are generated for this table
  const { data, error } = await (supabase.from("express_entry_draws") as AnyTable)
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    // 23505 = unique violation → already exists
    if ((error as { code?: string }).code === "23505") {
      return { inserted: false, row: null };
    }
    throw new Error(`DB insert failed: ${(error as { message: string }).message}`);
  }

  return { inserted: true, row: data as DrawRow | null };
}

async function markNotified(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await (supabase.from("express_entry_draws") as AnyTable)
    .update({ is_new: false })
    .in("id", ids);
}

// ── Notification email ────────────────────────────────────────────────────────

function buildNotificationEmail(opts: {
  userEmail: string;
  userCrs: number | null;
  drawScore: number;
  drawDate: string;
  invitations: number;
  programType: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { userCrs, drawScore, drawDate, invitations, programType, appUrl } = opts;

  const formattedDate = new Date(drawDate + "T12:00:00Z").toLocaleDateString(
    "en-CA",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const gapLine =
    userCrs !== null
      ? userCrs >= drawScore
        ? `<p style="color:#22c55e;font-weight:600">✅ Your current CRS (${userCrs}) is above this draw's cutoff — you may already be competitive.</p>`
        : `<p style="color:#f59e0b;font-weight:600">📍 You need <strong>${drawScore - userCrs} more points</strong> to reach this cutoff (your current CRS: ${userCrs}).</p>`
      : "";

  const subject = `🇨🇦 New Express Entry Draw — ${drawScore} cutoff (${programType})`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a14;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:20px">
        <span style="display:inline-block;background:#1e3a5f;color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:0.1em;padding:4px 12px;border-radius:999px;text-transform:uppercase">
          PRAVÉ · Express Entry Alert
        </span>
      </div>

      <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#f9fafb">
        New draw: ${drawScore} minimum CRS
      </h1>
      <p style="color:#9ca3af;margin:0 0 20px;font-size:14px">
        ${formattedDate} · ${programType} · ${invitations.toLocaleString()} invitations
      </p>

      <div style="background:#111827;border-radius:12px;padding:20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Minimum CRS Score</td>
            <td style="padding:8px 0;text-align:right;font-size:20px;font-weight:700;color:#f9fafb">${drawScore}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Invitations Issued</td>
            <td style="padding:8px 0;text-align:right;font-size:15px;font-weight:600;color:#d1d5db">${invitations.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Program Type</td>
            <td style="padding:8px 0;text-align:right;font-size:14px;color:#d1d5db">${programType}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Draw Date</td>
            <td style="padding:8px 0;text-align:right;font-size:14px;color:#d1d5db">${formattedDate}</td>
          </tr>
        </table>
      </div>

      ${gapLine ? `<div style="background:#1f2937;border-radius:10px;padding:16px;margin-bottom:20px">${gapLine}</div>` : ""}

      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#fff;color:#000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;text-decoration:none;margin-bottom:20px">
        See your updated strategy →
      </a>

      <p style="font-size:12px;color:#4b5563;margin-top:24px;padding-top:16px;border-top:1px solid #1f2937">
        You're receiving this because you have an active PRAVÉ Pro subscription.
        Data sourced from <a href="https://www.canada.ca" style="color:#6b7280">canada.ca</a>. Not immigration advice.
      </p>
    </div>
  `;

  return { subject, html };
}

async function sendProNotifications(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  draw: DrawRow
): Promise<{ sent: number; errors: number }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prave.ca";
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "PRAVÉ <noreply@prave.ca>";

  if (!RESEND_API_KEY) return { sent: 0, errors: 0 };

  // 1. Get all active Pro user IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proSubs } = await (supabase.from("subscriptions") as any)
    .select("user_id")
    .eq("plan", "pro")
    .in("status", ["active", "trialing"]) as { data: { user_id: string }[] | null };

  if (!proSubs || proSubs.length === 0) return { sent: 0, errors: 0 };

  const proUserIds = proSubs.map((s) => s.user_id);

  // 2. Get the latest roadmap per user (contains email + CRS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roadmaps } = await (supabase.from("roadmaps") as any)
    .select("user_id, email, profile_snapshot")
    .in("user_id", proUserIds)
    .order("created_at", { ascending: false }) as { data: (RoadmapRow & { user_id: string })[] | null };

  if (!roadmaps || roadmaps.length === 0) return { sent: 0, errors: 0 };

  // De-duplicate: keep only the latest roadmap per user
  const latestByUser = new Map<string, RoadmapRow & { user_id: string }>();
  for (const r of roadmaps) {
    if (!latestByUser.has(r.user_id)) latestByUser.set(r.user_id, r);
  }

  const resend = new Resend(RESEND_API_KEY);
  let sent = 0;
  let errors = 0;

  for (const roadmap of latestByUser.values()) {
    if (!roadmap.email) continue;

    const userCrs =
      typeof roadmap.profile_snapshot?.baseCrs === "number"
        ? roadmap.profile_snapshot.baseCrs
        : null;

    const { subject, html } = buildNotificationEmail({
      userEmail: roadmap.email,
      userCrs,
      drawScore: draw.minimum_score,
      drawDate: draw.draw_date,
      invitations: draw.invitations_issued,
      programType: draw.program_type,
      appUrl: APP_URL,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [roadmap.email],
        subject,
        html,
      });
      sent++;
    } catch {
      errors++;
    }
  }

  return { sent, errors };
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const summary: {
    scraped: number;
    inserted: number;
    notified: number;
    errors: string[];
  } = { scraped: 0, inserted: 0, notified: 0, errors: [] };

  try {
    // Scrape both page types in parallel
    const [generalResult, categoryResult] = await Promise.all([
      scrapeGeneralDraws(),
      scrapeCategoryDraws(),
    ]);

    if (generalResult.error) summary.errors.push(`general: ${generalResult.error}`);
    if (categoryResult.error) summary.errors.push(`category: ${categoryResult.error}`);

    const allScraped = [...generalResult.draws, ...categoryResult.draws];
    summary.scraped = allScraped.length;

    // Sort by date desc — process newest first so is_new lands on the right row
    allScraped.sort(
      (a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    );

    const newlyInserted: DrawRow[] = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < allScraped.length; i += BATCH_SIZE) {
      const batch = allScraped.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((draw) =>
          upsertDraw(supabase, draw).catch((err) => {
            summary.errors.push(
              `insert(${draw.draw_date}/${draw.program_type}): ${err instanceof Error ? err.message : String(err)}`
            );
            return null;
          })
        )
      );
      for (const result of results) {
        if (result?.inserted && result.row) {
          summary.inserted++;
          newlyInserted.push(result.row);
        }
      }
    }

    // Send notifications for newly inserted draws
    const notificationIds: string[] = [];

    for (const draw of newlyInserted) {
      try {
        const { sent } = await sendProNotifications(supabase, draw);
        summary.notified += sent;
        notificationIds.push(draw.id);
      } catch (err) {
        summary.errors.push(
          `notify(${draw.id}): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Mark notified draws as is_new: false
    await markNotified(supabase, notificationIds);

    return NextResponse.json({
      ok: true,
      ...summary,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        ...summary,
      },
      { status: 500 }
    );
  }
}
