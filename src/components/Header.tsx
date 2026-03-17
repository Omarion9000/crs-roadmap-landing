"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
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

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;

    return [
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-gray-100 text-black"
        : "text-gray-800 hover:bg-gray-100",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-100 border-b border-black/10 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-black">
          CRS Roadmap
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/simulator" className={navLinkClass("/simulator")}>
            Simulator
          </Link>

          {!user ? (
            <Link
              href="/login"
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  pathname === "/dashboard"
                    ? "border border-gray-300 bg-gray-100 text-gray-900"
                    : "border border-gray-300 text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}