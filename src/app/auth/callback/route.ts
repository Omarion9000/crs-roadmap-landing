import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ── iOS in-app browser (webview) detection ────────────────────────────────────
//
// Gmail, Instagram, Facebook, and LinkedIn on iOS open links in their own
// embedded WebView (WKWebView). These contexts:
//   - Don't share localStorage / sessionStorage with Safari → PKCE fails
//   - Block third-party cookies → session cookies may not persist
//
// Detection heuristic: iOS device whose User-Agent does NOT contain the
// standard "Version/X.X ... Safari/" fingerprint that real Safari always
// includes. Common in-app UAs also carry recognizable tokens (GSA, FBAN, etc.).

function isIosWebview(ua: string): boolean {
  if (!/iPhone|iPad|iPod/i.test(ua)) return false;
  // Real Safari on iOS always has both "Version/X.X" and "Safari/"
  if (/Version\/\d+\.\d+.*Safari\//i.test(ua)) return false;
  return true;
}

// ── "Open in Safari" page ─────────────────────────────────────────────────────
//
// Returned instead of processing the token when a webview is detected.
// The token is NOT consumed so the link remains valid when re-opened in Safari.
// Uses the x-safari-https:// URL scheme (supported on iOS) for one-tap open;
// falls back to clipboard copy.

function buildOpenInSafariPage(callbackUrl: string): NextResponse {
  const safariSchemeUrl = callbackUrl.replace(/^https:\/\//i, "x-safari-https://");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Open in Safari — PRAVÉ</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;min-height:100dvh;background:#070A12;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      -webkit-font-smoothing:antialiased;color:#fff;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:32px 24px}
    .card{width:100%;max-width:400px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:28px;padding:32px 28px;
      box-shadow:0 0 0 1px rgba(255,255,255,0.03),0 32px 80px -48px rgba(59,130,246,0.35)}
    .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
      color:rgba(103,232,249,0.75);margin-bottom:16px}
    h1{margin:0 0 12px;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.25}
    p{margin:0 0 20px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.58)}
    .btn-primary{display:block;width:100%;padding:15px 24px;
      background:#fff;color:#000;font-size:15px;font-weight:700;
      border:none;border-radius:100px;cursor:pointer;
      text-align:center;text-decoration:none;letter-spacing:-0.01em;
      margin-bottom:12px;-webkit-appearance:none}
    .btn-copy{display:block;width:100%;padding:14px 24px;
      background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.78);
      font-size:14px;font-weight:600;
      border:1px solid rgba(255,255,255,0.12);border-radius:100px;cursor:pointer;
      text-align:center;-webkit-appearance:none}
    .url-box{margin-top:20px;padding:12px 14px;
      background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);
      border-radius:14px;font-size:11px;color:rgba(255,255,255,0.35);
      word-break:break-all;line-height:1.5;user-select:all;-webkit-user-select:all}
    .copied{color:rgba(52,211,153,0.9)!important}
    .hint{margin-top:20px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.3);
      text-align:center}
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">PRAVÉ</div>
    <h1>Open this link in Safari</h1>
    <p>
      Your email app's built-in browser can't complete secure sign-in.
      Tap the button below to open in Safari, or copy the link and paste it manually.
    </p>

    <a id="btn-safari" class="btn-primary" href="${safariSchemeUrl}">
      Open in Safari
    </a>

    <button id="btn-copy" class="btn-copy" type="button">
      Copy link to clipboard
    </button>

    <div class="url-box" id="url-text">${callbackUrl}</div>

    <p class="hint">
      You can also tap ··· or the share icon in your email app and choose<br>
      <strong style="color:rgba(255,255,255,0.5)">"Open in Safari"</strong> or
      <strong style="color:rgba(255,255,255,0.5)">"Open in Browser"</strong>.
    </p>
  </div>

  <script>
    var url = ${JSON.stringify(callbackUrl)};
    var safariUrl = ${JSON.stringify(safariSchemeUrl)};

    document.getElementById('btn-safari').addEventListener('click', function(e) {
      e.preventDefault();
      // Try x-safari scheme first
      window.location.href = safariUrl;
      // After short delay, if still here, try plain https (may open in default browser)
      setTimeout(function() { window.location.href = url; }, 800);
    });

    document.getElementById('btn-copy').addEventListener('click', function() {
      var btn = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(function() {
            btn.textContent = 'Copy link to clipboard';
            btn.classList.remove('copied');
          }, 2500);
        }).catch(function() { fallbackCopy(); });
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        try {
          var el = document.getElementById('url-text');
          var range = document.createRange();
          range.selectNodeContents(el);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          btn.textContent = '✓ Copied!';
          setTimeout(function() { btn.textContent = 'Copy link to clipboard'; }, 2500);
        } catch(err) {}
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  // ── Webview gate — must run BEFORE any token exchange ──────────────────────
  // If we're inside an iOS in-app browser, return the "Open in Safari" page
  // without consuming the token. The user opens the same URL in Safari and
  // auth completes there.
  const ua = request.headers.get("user-agent") ?? "";
  if (isIosWebview(ua)) {
    console.log("[auth callback] iOS webview detected — showing Open in Safari page");
    return buildOpenInSafariPage(request.url);
  }

  // ── Canonical base for redirects ───────────────────────────────────────────
  const canonicalBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    getAuthBaseUrl({ requestOrigin: origin }); // fallback for local dev

  const baseUrl = canonicalBase;
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
        const appBase = canonicalBase; // always use canonical URL, not request origin
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
  safariNote,
  disclaimer,
}: {
  headline: string;
  body: string;
  stepLabel: string;
  stepBody: string;
  ctaText: string;
  ctaUrl: string;
  safariNote: string;
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
