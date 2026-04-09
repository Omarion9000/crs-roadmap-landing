"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AUTH_CALLBACK_PATH, getAuthRedirectUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { trackFunnelEvent, trackFunnelEventOnce } from "@/lib/funnel";

const accessSteps = [
  "Continue with your email",
  "Build your base CRS profile",
  "Unlock your smartest next move",
];

function formatAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "We couldn’t send your secure access link right now.";
  }

  const normalized = error.message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("security purposes") ||
    normalized.includes("too many requests")
  ) {
    return "Too many magic-link requests in a short time. Please wait a moment before requesting another secure link.";
  }

  return error.message;
}

function getAuthCallbackMessage(authError: string | null) {
  if (!authError) {
    return "";
  }

  if (authError === "magic_link_failed") {
    return "That secure link could not complete sign-in. Request a fresh magic link and open it on this device.";
  }

  return "";
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [redirectMessage, setRedirectMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    const rawReturnTo = searchParams.get("returnTo");
    const returnTo = sanitizeReturnTo(rawReturnTo);
    const authError = searchParams.get("authError");
    const callbackErrorMessage = getAuthCallbackMessage(authError);

    if (callbackErrorMessage) {
      setError(callbackErrorMessage);
    }

    function routeAuthenticatedUser() {
      trackFunnelEventOnce("signup-completed", "signup_completed", {
        source: "login",
        returnTo,
      });
      setRedirectMessage("Opening your roadmap...");
      router.replace(returnTo);
    }

    async function checkAuthenticatedUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setSessionChecking(false);
          return;
        }

        routeAuthenticatedUser();
      } catch {
        if (mounted) {
          setSessionChecking(false);
        }
      }
    }

    void checkAuthenticatedUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || !session?.user) return;
      routeAuthenticatedUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address to continue.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const rawReturnTo = searchParams.get("returnTo");
      const returnTo = sanitizeReturnTo(rawReturnTo);

      // Always build emailRedirectTo against the canonical production domain so
      // the magic link callback URL is consistent regardless of which deployment
      // (preview vs production) the user happens to be on when they log in.
      const siteBase =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
        window.location.origin;
      const emailRedirectTo = getAuthRedirectUrl("/auth/callback", { returnTo, requestOrigin: siteBase });
      const emailRedirectUrl = new URL(emailRedirectTo);
      const authOptionsPayload = {
        emailRedirectTo,
        hasEmailRedirectTo: Boolean(emailRedirectTo),
        callbackPath: emailRedirectUrl.pathname,
      };

      trackFunnelEvent("signup_started", { returnTo });
      console.log("[auth] returnTo:", returnTo);
      console.log("[auth] emailRedirectTo:", emailRedirectTo);
      console.log("[auth] emailRedirectTo pathname:", emailRedirectUrl.pathname);
      console.log(
        "[auth] emailRedirectTo has callback path:",
        emailRedirectUrl.pathname === AUTH_CALLBACK_PATH ? "yes" : "no"
      );
      console.log("[auth] signInWithOtp options:", authOptionsPayload);

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setMessage("Check your inbox");
      setEmail("");
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060914] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#060914] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:84px_84px] opacity-[0.05]" />
        <motion.div
          className="absolute left-1/2 top-[-10rem] h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ opacity: [0.24, 0.38, 0.24], scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-8rem] top-24 h-[24rem] w-[24rem] rounded-full bg-indigo-500/12 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-8rem] left-[-6rem] h-[22rem] w-[22rem] rounded-full bg-blue-500/10 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:min-h-[calc(100vh-88px)] lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Secure access
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Your roadmap starts here
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-white/64">
              Use one secure link to access your CRS profile, simulator, and personalized strategy workflow.
            </p>

            <div className="mt-8 space-y-3">
              {accessSteps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.14 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[11px] font-semibold text-cyan-100">
                    0{index + 1}
                  </span>
                  <span className="text-sm font-medium text-white/86">{step}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 inline-flex max-w-xl items-center rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/62"
            >
              Free users can preview the platform. Pro unlocks the full roadmap experience.
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[36px] bg-linear-to-br from-cyan-500/12 via-white/[0.03] to-indigo-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(34,211,238,0.45)] backdrop-blur-xl sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.08] via-transparent to-transparent" />

              <div className="relative z-10">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  Continue access
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Continue to your roadmap
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">
                  Enter your email to sign in or create your access instantly.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/54">
                  If you already have an account, we&apos;ll sign you in. If you&apos;re new, we&apos;ll create your secure access and send your magic link.
                </p>

                {sessionChecking || redirectMessage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100"
                  >
                    {redirectMessage ||
                      (searchParams.get("continue")
                        ? "Restoring your secure access..."
                        : "Checking for existing access...")}
                  </motion.div>
                ) : null}

                <form onSubmit={handleLogin} className="mt-8 space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-white/78">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending your secure link..." : "Continue with magic link"}
                  </button>
                </form>

                <AnimatePresence mode="wait">
                  {message ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-5 rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-4"
                    >
                      <div className="text-sm font-semibold text-emerald-100">{message}</div>
                      <div className="mt-2 text-sm leading-6 text-emerald-50/85">
                        We sent your secure access link. Open it on this device to continue.
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100"
                  >
                    {error}
                  </motion.div>
                ) : null}

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/58">
                  No password. No friction. Just secure access to your CRS roadmap.
                </div>

                <div className="mt-4 text-xs leading-6 text-white/46">
                  Start free. Upgrade later for full roadmap, premium strategies, and saved progress.
                </div>

                <div className="mt-3 text-[11px] leading-5 text-white/38">
                  Supabase Auth email rate limits are managed in your Supabase dashboard, not in Stripe.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
