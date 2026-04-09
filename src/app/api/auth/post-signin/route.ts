/**
 * POST /api/auth/post-signin
 *
 * Called by the client-side /auth/callback page after a successful setSession()
 * or verifyOtp(). Sends a welcome email on first sign-in (idempotent via
 * user_metadata.welcome_sent flag). Non-critical — failures are swallowed.
 *
 * Body: { userId: string }
 */

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId);

    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Already sent — nothing to do
    if (user.user_metadata?.welcome_sent) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY || !user.email) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const langCookie = request.cookies.get("crs_lang")?.value;
    const isES = langCookie === "es";

    const appBase =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
      "https://www.pravepath.ca";

    const calcUrl = `${appBase}/crs-calculator`;

    const subject = isES
      ? "Bienvenido a Pravé — Tu roadmap empieza aquí"
      : "Welcome to Pravé — Your roadmap starts here";

    const html = isES
      ? buildWelcomeHtml({
          headline: "Bienvenido a Pravé",
          body: "Tu camino hacia la residencia permanente comienza aquí. El simulador de Pravé analiza tu perfil CRS y te muestra los movimientos más efectivos para mejorar tu puntaje.",
          stepLabel: "PRIMER PASO",
          stepBody: "Comienza con la Calculadora CRS para obtener tu puntaje base. Luego el simulador clasificará tus mejores caminos de mejora.",
          ctaText: "Calcular mi puntaje CRS →",
          ctaUrl: calcUrl,
          safariNote: "¿El link no funcionó? Cópialo y pégalo directamente en Safari.",
          disclaimer:
            "Solo con fines informativos. No es asesoría legal ni migratoria. Verifica siempre con IRCC o un RCIC autorizado.",
        })
      : buildWelcomeHtml({
          headline: "Welcome to Pravé",
          body: "Your path to permanent residence starts here. Pravé's simulator analyzes your CRS profile and shows you the most effective moves to improve your score.",
          stepLabel: "FIRST STEP",
          stepBody: "Start with the CRS Calculator to get your baseline score. Then the simulator will rank your best improvement paths.",
          ctaText: "Calculate my CRS score →",
          ctaUrl: calcUrl,
          safariNote: "If the link doesn't work, copy and paste it into Safari.",
          disclaimer:
            "For informational purposes only. Not legal or immigration advice. Always verify with IRCC or a licensed RCIC.",
        });

    const resend = new Resend(RESEND_API_KEY);
    const FROM = process.env.RESEND_FROM_EMAIL ?? "PRAVÉ <noreply@prave.ca>";

    await resend.emails.send({ from: FROM, to: [user.email], subject, html });

    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...user.user_metadata, welcome_sent: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-critical — log and return ok so the client's fire-and-forget doesn't care
    console.log(
      "[post-signin] welcome email error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ ok: true, skipped: true });
  }
}

// ── Welcome email HTML ────────────────────────────────────────────────────────

function buildWelcomeHtml({
  headline, body, stepLabel, stepBody, ctaText, ctaUrl, safariNote, disclaimer,
}: {
  headline: string; body: string; stepLabel: string; stepBody: string;
  ctaText: string; ctaUrl: string; safariNote: string; disclaimer: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070A12;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="max-width:540px;margin:0 auto;padding:48px 28px">

    <div style="margin-bottom:36px">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(103,232,249,0.75)">PRAVÉ</span>
    </div>

    <h1 style="margin:0 0 16px;font-size:30px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;line-height:1.2">
      ${headline}
    </h1>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.62)">
      ${body}
    </p>

    <div style="margin:0 0 28px;padding:20px 22px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px">
      <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.35)">${stepLabel}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72)">${stepBody}</p>
    </div>

    <a href="${ctaUrl}"
       style="display:inline-block;padding:14px 28px;background:#ffffff;color:#000000;font-size:14px;font-weight:700;border-radius:100px;text-decoration:none;letter-spacing:-0.01em">
      ${ctaText}
    </a>

    <p style="margin:24px 0 0;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.38)">
      📱 ${safariNote}
    </p>

    <hr style="margin:32px 0 24px;border:none;border-top:1px solid rgba(255,255,255,0.08)">

    <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.25)">
      ${disclaimer}
    </p>
  </div>
</body>
</html>`;
}
