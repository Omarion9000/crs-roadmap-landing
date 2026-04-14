"use client";

/**
 * /auth/callback — client-side auth handler
 *
 * With flowType:'implicit', Supabase puts tokens in the URL hash fragment:
 *   /auth/callback#access_token=XXX&refresh_token=YYY&type=magiclink
 *
 * Hash fragments are NEVER sent to the server, so this must be a client
 * component. It reads window.location.hash, calls setSession(), then
 * redirects to returnTo.
 *
 * Also handles the token_hash query param (OTP path, kept as fallback).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { sanitizeReturnTo } from "@/lib/authRedirect";

// ── iOS webview detection (client-side) ───────────────────────────────────────

function isIosWebview(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/iPhone|iPad|iPod/i.test(ua)) return false;

  // Explicit in-app browser signals — check these first so known webviews
  // are caught even if their UA accidentally includes "Safari/".
  // GSA = Gmail / Google Search App on iOS
  // FBAN/FBIOS = Facebook, Instagram = Instagram, LinkedInApp = LinkedIn
  if (/GSA\/|FBAN|FBIOS|Instagram|LinkedInApp|Snapchat|WhatsApp/i.test(ua)) return true;

  // Real Safari always includes "Version/X.X ... Safari/"
  // In-app WKWebViews usually omit the Version/ component.
  if (/Version\/\d+\.\d+.*Safari\//i.test(ua)) return false;

  return true;
}

// ── Open-in-Safari UI ─────────────────────────────────────────────────────────

function OpenInSafari({ callbackUrl }: { callbackUrl: string }) {
  const safariUrl = callbackUrl.replace(/^https:\/\//i, "x-safari-https://");
  const didRedirect = useRef(false);

  // Auto-redirect to Safari on mount — no user tap required.
  // The ?code= is intact because we never called exchangeCodeForSession.
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    window.location.replace(safariUrl);
  }, [safariUrl]);

  function handleOpen() {
    window.location.replace(safariUrl);
    // No setTimeout fallback — if the deep link works, Safari handles the
    // code. A fallback navigate here would reload the webview with a
    // now-consumed code, which would fail anyway.
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      alert("Link copied — paste it into Safari to sign in.");
    } catch {
      // select the text in the box as fallback
      const el = document.getElementById("cb-url");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070A12] px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_32px_80px_-48px_rgba(59,130,246,0.35)] backdrop-blur-xl">
          <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/75">
            PRAVÉ
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight">
            Open in Safari
          </h1>
          <p className="mb-7 text-sm leading-6 text-white/55">
            Your email app&apos;s built-in browser can&apos;t complete
            sign-in. Tap <strong className="text-white/75">Open in Safari</strong>{" "}
            or copy the link and paste it into Safari.
          </p>

          <button
            type="button"
            onClick={handleOpen}
            className="mb-3 flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gray-100"
          >
            Open in Safari
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="mb-5 flex w-full items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            Copy link to clipboard
          </button>

          <div
            id="cb-url"
            className="select-all rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 text-[11px] leading-5 text-white/35 break-all"
          >
            {callbackUrl}
          </div>

          <p className="mt-5 text-xs leading-5 text-white/30">
            You can also tap <strong className="text-white/45">···</strong> or
            the share icon in your email app and choose{" "}
            <strong className="text-white/45">&ldquo;Open in Browser&rdquo;</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Loading / error states ────────────────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070A12] px-6 text-white">
      <div className="text-center">
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/75">
          PRAVÉ
        </div>
        <div className="text-sm text-white/50">{message}</div>
      </div>
    </main>
  );
}

function ErrorScreen({ message, returnTo }: { message: string; returnTo: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070A12] px-6 text-white">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/75">
          PRAVÉ
        </div>
        <h1 className="mb-3 text-xl font-semibold tracking-tight">
          Sign-in link expired
        </h1>
        <p className="mb-6 text-sm leading-6 text-white/50">{message}</p>
        <a
          href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          className="inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-100"
        >
          Request a new link
        </a>
      </div>
    </main>
  );
}

// ── Core callback logic ───────────────────────────────────────────────────────

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<
    | { phase: "loading"; message: string }
    | { phase: "webview"; url: string }
    | { phase: "error"; message: string; returnTo: string }
  >({ phase: "loading", message: "Signing you in…" });

  useEffect(() => {
    const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

    // Detect iOS webview before any network request.
    // Auto-redirect to Safari immediately — ?code= is untouched.
    if (isIosWebview()) {
      const url = window.location.href;
      window.location.replace(url.replace(/^https:\/\//i, "x-safari-https://"));
      setState({ phase: "webview", url }); // renders fallback UI if redirect stalls
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function handleCallback() {
      try {
        // ── Path 1: PKCE code flow (?code=...) ──────────────────────────────
        // @supabase/ssr always uses PKCE (it hardcodes flowType:'pkce' and
        // ignores any flowType option passed to createBrowserClient). The
        // code_verifier is stored in a cookie by @supabase/ssr, so it
        // survives navigation and is available here in the same browser.
        const code = searchParams.get("code");
        if (code) {
          // Second-layer webview gate — catches edge cases where the outer
          // isIosWebview() check passed (e.g. UA with unexpected Safari/ token,
          // or Mail.app WKWebView mimicking Safari). Without this, calling
          // exchangeCodeForSession() in a webview throws "PKCE code verifier
          // not found in storage" because the cookie set on the login page in
          // a different browser context is not accessible here.
          if (isIosWebview()) {
            const url = window.location.href;
            window.location.replace(url.replace(/^https:\/\//i, "x-safari-https://"));
            setState({ phase: "webview", url });
            return;
          }

          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (data.user) {
            fetch("/api/auth/post-signin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id }),
            }).catch(() => {/* non-critical */});
          }

          router.replace(returnTo);
          return;
        }

        // ── Path 2: implicit flow — tokens in hash fragment ──────────────────
        // Kept as fallback in case the auth server ever sends hash-based links.
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (!accessToken || !refreshToken) {
            throw new Error("Incomplete tokens in magic link. Request a new one.");
          }

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (data.user) {
            fetch("/api/auth/post-signin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id }),
            }).catch(() => {/* non-critical */});
          }

          history.replaceState(null, "", window.location.pathname + window.location.search);
          router.replace(returnTo);
          return;
        }

        // ── Path 3: token_hash in query params (OTP / email confirmation) ────
        const tokenHash = searchParams.get("token_hash");
        const otpType = searchParams.get("type");

        if (tokenHash && otpType) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as EmailOtpType,
          });

          if (error) throw error;

          if (data.user) {
            fetch("/api/auth/post-signin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id }),
            }).catch(() => {/* non-critical */});
          }

          router.replace(returnTo);
          return;
        }

        throw new Error("No authentication tokens found in this link. It may have expired.");
      } catch (err) {
        // Before showing the error screen, check if the user already has a
        // valid session. This handles two cases:
        //   (a) exchangeCodeForSession set the session but also returned an
        //       error (rare race condition in @supabase/ssr)
        //   (b) The user already had an active session from a previous login —
        //       clicking "Request a new link" on the error page navigates to
        //       /login which then detects the session and redirects here.
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            router.replace(returnTo);
            return;
          }
        } catch {
          // ignore — fall through to show error
        }
        const message =
          err instanceof Error
            ? err.message
            : "This sign-in link could not be verified.";
        setState({ phase: "error", message, returnTo });
      }
    }

    void handleCallback();
  }, [router, searchParams]);

  if (state.phase === "webview") return <OpenInSafari callbackUrl={state.url} />;
  if (state.phase === "error") return <ErrorScreen message={state.message} returnTo={state.returnTo} />;
  return <LoadingScreen message={state.message} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Signing you in…" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
