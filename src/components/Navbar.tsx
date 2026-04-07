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
    router.push("/");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
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

            {/* Always visible: Sign in / Sign out */}
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 shadow-[0_16px_32px_-24px_rgba(34,197,94,0.5)] transition hover:bg-green-500/20 hover:text-white"
              >
                {t("nav_sign_in")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 shadow-[0_16px_32px_-24px_rgba(239,68,68,0.45)] transition hover:bg-red-500/20 hover:text-white"
              >
                {t("nav_sign_out")}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
