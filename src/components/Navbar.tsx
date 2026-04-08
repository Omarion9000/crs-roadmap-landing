"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  clearStoredProfileState,
  getBaseProfileOwnerKey,
  PROFILE_STATE_EVENT,
  readStoredBaseProfile,
} from "@/lib/crs/baseProfile";
import { getPreferredName, normalizePreferredName } from "@/lib/personalization";
import { useLanguage } from "@/lib/i18n/context";

type AuthMeResponse =
  | { ok: true; user: { id: string; email: string; preferred_name?: string } }
  | { ok?: false; error?: string };

type RemoteIdentity = {
  id: string;
  email: string;
};

const REMOTE_NAME_CACHE_KEY = "crs_remote_preferred_name";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang: uiLang, setLang, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profileStateVersion, setProfileStateVersion] = useState(0);
  const [remotePreferredName, setRemotePreferredName] = useState<string | null>(null);
  const [remoteIdentity, setRemoteIdentity] = useState<RemoteIdentity | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session?.user) {
        setUser(session.user);
        setRemoteIdentity({
          id: session.user.id,
          email: session.user.email ?? "",
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
        setRemoteIdentity(
          user
            ? {
                id: user.id,
                email: user.email ?? "",
              }
            : null
        );
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

  const metadataPreferredName = useMemo(() => {
    if (!user) {
      return null;
    }

    if (typeof user.user_metadata?.preferred_name === "string") {
      return normalizePreferredName(user.user_metadata.preferred_name);
    }

    if (typeof user.user_metadata?.name === "string") {
      return normalizePreferredName(user.user_metadata.name);
    }

    return null;
  }, [user]);

  const isAuthenticated = !!user || !!remoteIdentity;
  const identityOwnerKey = getBaseProfileOwnerKey(user) ?? remoteIdentity?.id ?? null;

  useEffect(() => {
    const syncProfileName = (event: Event) => {
      const detail =
        event instanceof CustomEvent &&
        event.detail &&
        typeof event.detail === "object"
          ? event.detail
          : null;

      if (!detail || detail.ownerKey !== identityOwnerKey) {
        return;
      }

      setProfileStateVersion((version) => version + 1);
    };

    window.addEventListener(PROFILE_STATE_EVENT, syncProfileName);

    return () => {
      window.removeEventListener(PROFILE_STATE_EVENT, syncProfileName);
    };
  }, [identityOwnerKey]);

  const cachedRemotePreferredName = useMemo(() => {
    if (!identityOwnerKey || typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(`${REMOTE_NAME_CACHE_KEY}:${identityOwnerKey}`);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as { preferredName?: string | null } | null;
      return normalizePreferredName(parsed?.preferredName);
    } catch {
      return null;
    }
  }, [identityOwnerKey]);

  const preferredName = useMemo(() => {
    void profileStateVersion;
    const localPreferredName = getPreferredName(readStoredBaseProfile(identityOwnerKey));
    return (
      localPreferredName ??
      normalizePreferredName(remotePreferredName) ??
      cachedRemotePreferredName ??
      metadataPreferredName
    );
  }, [cachedRemotePreferredName, identityOwnerKey, metadataPreferredName, profileStateVersion, remotePreferredName]);

  const identityLabel = useMemo(() => {
    if (!isAuthenticated) {
      return null;
    }

    return preferredName ?? "Account";
  }, [isAuthenticated, preferredName]);

  useEffect(() => {
    let mounted = true;

    async function loadPreferredName() {
      if (!user) {
        if (mounted) {
          setRemotePreferredName(null);
          setRemoteIdentity(null);
        }
        return;
      }

      try {
        const response = await fetch("/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = (await response.json().catch(() => null)) as AuthMeResponse | null;

        if (!mounted) {
          return;
        }

        if (response.ok && data && "ok" in data && data.ok === true) {
          try {
            window.sessionStorage.setItem(
              `${REMOTE_NAME_CACHE_KEY}:${data.user.id}`,
              JSON.stringify({
                preferredName: normalizePreferredName(data.user.preferred_name),
              })
            );
          } catch {
            // ignore cache persistence failures
          }

          setRemoteIdentity({
            id: data.user.id,
            email: data.user.email,
          });
          setRemotePreferredName(normalizePreferredName(data.user.preferred_name));
          return;
        }

        setRemoteIdentity(null);
        setRemotePreferredName((current) => current);
      } catch {
        if (mounted) {
          setRemotePreferredName((current) => current);
        }
      }
    }

    void loadPreferredName();

    return () => {
      mounted = false;
    };
  }, [user]);

  const setLanguage = (nextLang: "en" | "es") => setLang(nextLang);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearStoredProfileState();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full">
        <div className="mx-auto max-w-7xl px-6 py-1">
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-6 py-0.5 shadow-[0_0_40px_rgba(59,130,246,0.08)] backdrop-blur-2xl md:py-1">
            <Link href="/" className="group relative flex min-w-0 items-center md:min-w-[280px]">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-blue-500/5 opacity-70 blur-2xl" />
              <Image
                src="/logo-prave.png"
                alt="PRAVÉ"
                width={260}
                height={96}
                priority
                className="
                  h-[110px] md:h-[178px]
                  w-auto
                  object-contain
                  transition duration-300
                  -my-4 md:-my-8
                  group-hover:scale-[1.05]
                  group-hover:drop-shadow-[0_0_28px_rgba(59,130,246,0.7)]
                "
              />
              <span className="ml-2 hidden text-sm font-medium tracking-[0.04em] text-white/60 md:inline">
                {t("nav_tagline")}
              </span>
            </Link>

            <nav className="flex items-center gap-3">
              {/* Desktop-only nav links */}
              <Link
                href="/simulator"
                className={`hidden rounded-xl px-4 py-2 text-sm transition md:inline-flex ${
                  isActive("/simulator")
                    ? "bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t("nav_simulator")}
              </Link>

              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className={`hidden rounded-xl px-4 py-2 text-sm transition md:inline-flex ${
                    isActive("/dashboard")
                      ? "bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t("nav_dashboard")}
                </Link>
              ) : null}

              <Link
                href="/"
                className={`hidden rounded-xl px-4 py-2 text-sm transition md:inline-flex ${
                  isActive("/")
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t("nav_home")}
              </Link>

              {/* Desktop-only language toggle */}
              <div className="ml-2 hidden items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1 md:flex">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-lg px-2 py-1 text-xs transition ${
                    uiLang === "en" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("es")}
                  className={`rounded-lg px-2 py-1 text-xs transition ${
                    uiLang === "es" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  ES
                </button>
              </div>

              {/* Desktop-only identity label */}
              {isAuthenticated && identityLabel ? (
                <div className="ml-2 hidden items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-2 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_40px_-28px_rgba(59,130,246,0.45)] backdrop-blur-xl md:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-300/20 bg-black/25 text-blue-100/90">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path
                        d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="tracking-[0.02em] text-white/92">{identityLabel}</span>
                </div>
              ) : null}

              {/* Desktop-only: Sign in / Sign out */}
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="hidden rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 shadow-[0_16px_32px_-24px_rgba(34,197,94,0.5)] transition hover:bg-green-500/20 hover:text-white md:inline-flex"
                >
                  {t("nav_sign_in")}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 shadow-[0_16px_32px_-24px_rgba(239,68,68,0.45)] transition hover:bg-red-500/20 hover:text-white md:inline-flex"
                >
                  {t("nav_sign_out")}
                </button>
              )}

              {/* Mobile: hamburger button */}
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white md:hidden"
              >
                {menuOpen ? (
                  /* X icon */
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  /* Hamburger icon */
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={`fixed left-0 right-0 z-40 md:hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
        style={{ top: "calc(100px + 0.5rem)" }}
      >
        <div className="mx-6 overflow-hidden rounded-2xl border border-white/10 bg-[#070A12]/95 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <nav className="flex flex-col p-3">
            {/* Simulator */}
            <Link
              href="/simulator"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                isActive("/simulator")
                  ? "bg-blue-500/15 text-blue-300"
                  : "text-white/75 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/50">
                ◎
              </span>
              {t("nav_simulator")}
            </Link>

            {/* Home */}
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                isActive("/")
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/50">
                ⌂
              </span>
              {t("nav_home")}
            </Link>

            {/* Dashboard (authenticated only) */}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-purple-500/15 text-purple-300"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/50">
                  ◈
                </span>
                {t("nav_dashboard")}
              </Link>
            )}

            {/* Divider */}
            <div className="my-2 border-t border-white/8" />

            {/* Language toggle */}
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs text-white/35">
                {uiLang === "en" ? "Language" : "Idioma"}
              </span>
              <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    uiLang === "en" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("es")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    uiLang === "es" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  ES
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-white/8" />

            {/* Auth row */}
            {!isAuthenticated ? (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-green-400/20 bg-green-500/8 px-4 py-3.5 text-sm font-medium text-green-300 transition hover:bg-green-500/15"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-400/20 bg-green-500/10">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 text-green-300/70">
                    <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4Z" fill="currentColor" />
                  </svg>
                </span>
                {t("nav_sign_in")}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                {identityLabel && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/8 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300/20 bg-black/25 text-blue-100/90">
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                        <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4Z" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-white/80">{identityLabel}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/15 bg-red-500/10 text-xs">
                    ↩
                  </span>
                  {t("nav_sign_out")}
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
