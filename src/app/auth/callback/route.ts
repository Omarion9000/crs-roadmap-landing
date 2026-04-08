import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const baseUrl = getAuthBaseUrl({ requestOrigin: origin });
  const successDestination = `${baseUrl}${returnTo}`;
  const successResponse = NextResponse.redirect(successDestination);
  let sessionEstablished = false;
  const flowType = code ? "code" : tokenHash ? "token_hash" : "unknown";
  const supabase = createSupabaseRouteHandlerClient(request, successResponse);

  try {

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      sessionEstablished = !error;

      if (error) {
        console.log("[auth callback] session exchange error:", error.message);
      }
    } else if (tokenHash && otpType) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as EmailOtpType,
      });
      sessionEstablished = !error;

      if (error) {
        console.log("[auth callback] otp verification error:", error.message);
      }
    }
  } catch (error) {
    console.log(
      "[auth callback] session establishment error:",
      error instanceof Error ? error.message : "unknown"
    );
  }

  // ── Welcome email on first sign-in ─────────────────────────────────────────
  if (sessionEstablished) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const RESEND_API_KEY = process.env.RESEND_API_KEY;

      if (user && RESEND_API_KEY && !user.user_metadata?.welcome_sent) {
        const langCookie = request.cookies.get("crs_lang")?.value;
        const isES = langCookie === "es";
        const appBase = getAuthBaseUrl({ requestOrigin: new URL(request.url).origin });
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
              disclaimer:
                "For informational purposes only. Not legal or immigration advice. Always verify with IRCC or a licensed RCIC.",
            });

        const resend = new Resend(RESEND_API_KEY);
        const FROM = process.env.RESEND_FROM_EMAIL ?? "PRAVÉ <noreply@prave.ca>";

        await resend.emails.send({ from: FROM, to: [user.email!], subject, html });

        const admin = createSupabaseAdminClient();
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, welcome_sent: true },
        });
      }
    } catch (welcomeErr) {
      console.log(
        "[auth callback] welcome email skipped:",
        welcomeErr instanceof Error ? welcomeErr.message : welcomeErr
      );
    }
  }

  const fallbackParams = new URLSearchParams({ returnTo });
  if (!sessionEstablished) {
    fallbackParams.set("authError", "magic_link_failed");
  }
  const finalDestination = sessionEstablished
    ? successDestination
    : `${baseUrl}/login?${fallbackParams.toString()}`;
  const cookiesAttached = successResponse.cookies.getAll().length > 0 ? "yes" : "no";

  console.log("[auth callback] flow type:", flowType);
  console.log("[auth callback] session established:", sessionEstablished);
  console.log("[auth callback] returnTo:", returnTo);
  console.log("[auth callback] cookies attached:", cookiesAttached);
  console.log("[auth callback] final redirect:", finalDestination);

  if (sessionEstablished) {
    return successResponse;
  }

  return NextResponse.redirect(finalDestination);
}

// ── Welcome email HTML builder ────────────────────────────────────────────────
function buildWelcomeHtml({
  headline,
  body,
  stepLabel,
  stepBody,
  ctaText,
  ctaUrl,
  disclaimer,
}: {
  headline: string;
  body: string;
  stepLabel: string;
  stepBody: string;
  ctaText: string;
  ctaUrl: string;
  disclaimer: string;
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

    <hr style="margin:40px 0 24px;border:none;border-top:1px solid rgba(255,255,255,0.08)">

    <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.25)">
      ${disclaimer}
    </p>
  </div>
</body>
</html>`;
}
