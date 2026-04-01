"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [uiLang, setUiLang] = useState<"en" | "es">(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    try {
      const saved = window.localStorage.getItem("crs_ui_lang");
      return saved === "en" || saved === "es" ? saved : "en";
    } catch {
      return "en";
    }
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setLanguage = (nextLang: "en" | "es") => {
    setUiLang(nextLang);

    try {
      window.localStorage.setItem("crs_ui_lang", nextLang);
      window.dispatchEvent(new CustomEvent("crs-ui-lang-change", { detail: nextLang }));
    } catch {
      // ignore local storage failures
    }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;
    const isSimulator = href === "/simulator";
    const isDashboard = href === "/dashboard";
    const isHome = href === "/";

    return [
      "rounded-full border px-4 py-2 text-sm font-medium tracking-[0.01em] transition duration-300 backdrop-blur",
      isActive
        ? isSimulator
          ? "border-cyan-400/25 bg-linear-to-r from-cyan-400/20 via-sky-400/10 to-indigo-400/15 text-white shadow-[0_16px_42px_-22px_rgba(34,211,238,0.5)]"
          : isDashboard
          ? "border-violet-400/20 bg-linear-to-r from-violet-400/16 via-indigo-400/10 to-white/10 text-white shadow-[0_16px_42px_-22px_rgba(139,92,246,0.42)]"
          : "border-white/15 bg-linear-to-r from-white/12 via-white/8 to-transparent text-white shadow-[0_16px_42px_-24px_rgba(255,255,255,0.2)]"
        : isDashboard
        ? "border-violet-400/12 bg-violet-400/[0.06] text-white/72 hover:border-violet-400/18 hover:bg-violet-400/[0.10] hover:text-white"
        : isHome
        ? "border-white/10 bg-white/5 text-white/70 hover:border-white/15 hover:bg-white/10 hover:text-white"
        : "border-cyan-400/10 bg-cyan-400/[0.05] text-white/70 hover:border-cyan-400/18 hover:bg-cyan-400/[0.10] hover:text-white",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-100 border-b border-white/10 bg-[rgba(4,8,20,0.78)] shadow-[0_20px_60px_-48px_rgba(59,130,246,0.45)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-500/5 via-transparent to-indigo-500/5" />
      {user ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-300/25 to-transparent" />
      ) : null}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/" className="relative text-lg font-semibold tracking-[0.02em] text-white">
            <span className="absolute -inset-x-3 -inset-y-2 rounded-full bg-white/[0.03] blur-xl" />
            <span className="relative">CRS Roadmap</span>
          </Link>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className={[
            "flex flex-wrap items-center justify-end gap-2 rounded-full border px-2 py-1.5 sm:gap-3",
            user
              ? "border-cyan-400/10 bg-white/[0.045] shadow-[0_18px_52px_-34px_rgba(34,211,238,0.32)]"
              : "border-white/10 bg-white/[0.03]",
          ].join(" ")}
        >
          <Link href="/simulator" className={navLinkClass("/simulator")}>
            Simulator
          </Link>

          {user ? (
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>
          ) : null}

          <Link href="/" className={navLinkClass("/")}>
            Home
          </Link>

          <div className="inline-flex items-center rounded-full border border-white/10 bg-black/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition duration-300",
                uiLang === "en"
                  ? "bg-white/10 text-white shadow-[0_10px_30px_-20px_rgba(255,255,255,0.35)]"
                  : "text-white/60 hover:text-white",
              ].join(" ")}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition duration-300",
                uiLang === "es"
                  ? "bg-white/10 text-white shadow-[0_10px_30px_-20px_rgba(255,255,255,0.35)]"
                  : "text-white/60 hover:text-white",
              ].join(" ")}
            >
              ES
            </button>
          </div>

          {!user ? (
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition duration-300 hover:border-white/15 hover:bg-white/10 hover:text-white"
            >
              Login
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-amber-400/10 bg-amber-400/[0.04] px-4 py-2 text-sm font-medium text-white/65 transition duration-300 hover:border-amber-400/16 hover:bg-amber-400/[0.08] hover:text-white"
            >
              Sign out
            </button>
          )}
        </motion.nav>
      </div>
    </header>
  );
}
