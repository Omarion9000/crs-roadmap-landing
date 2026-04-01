"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getBaseProfileOwnerKey, hasBaseProfile } from "@/lib/crs/baseProfile";
import { trackFunnelEventOnce } from "@/lib/funnel";
import { buildLoginHref } from "@/lib/upgrade";

type SubscriptionResponse = {
  plan?: string;
};

type RoadmapListResponse =
  | { ok: true; roadmaps: Array<{ id: string }> }
  | { ok?: false; error?: string };

export default function StartPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Opening your roadmap...");

  useEffect(() => {
    let cancelled = false;

    async function routeIntoProduct() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        router.replace(buildLoginHref({ returnTo: "/start" }));
        return;
      }

      trackFunnelEventOnce("signup-completed", "signup_completed", {
        source: "start",
      });

      const ownerKey = getBaseProfileOwnerKey(user);

      if (!hasBaseProfile(ownerKey)) {
        setStatus("Let’s build your base profile first...");
        router.replace("/crs-calculator?entry=activation");
        return;
      }

      setStatus("Checking your roadmap continuity...");

      let normalizedPlan: "free" | "pro" = "free";

      try {
        const subscriptionResponse = await fetch("/api/subscription", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (subscriptionResponse.ok) {
          const subscriptionData =
            (await subscriptionResponse.json()) as SubscriptionResponse;
          normalizedPlan = subscriptionData.plan === "pro" ? "pro" : "free";
        }
      } catch {
        normalizedPlan = "free";
      }

      if (normalizedPlan === "pro") {
        try {
          const roadmapsResponse = await fetch("/api/roadmaps/list", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

          const roadmapsData =
            (await roadmapsResponse.json().catch(() => null)) as RoadmapListResponse | null;

          if (
            roadmapsResponse.ok &&
            roadmapsData &&
            "ok" in roadmapsData &&
            roadmapsData.ok === true &&
            roadmapsData.roadmaps.length > 0
          ) {
            setStatus("Opening your dashboard...");
            router.replace("/dashboard");
            return;
          }
        } catch {
          // fall back to simulator
        }
      }

      setStatus("Opening your simulator...");
      router.replace("/simulator?entry=activation");
    }

    void routeIntoProduct();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(99,102,241,0.10),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_22%)]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-[32px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(59,130,246,0.4)] backdrop-blur-xl"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
            Activation
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Opening your roadmap
          </div>
          <div className="mt-3 text-sm leading-7 text-white/62">
            {status}
          </div>
          <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full border border-white/10 bg-black/25">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-cyan-400 via-blue-400 to-violet-400"
              animate={{ x: ["-30%", "130%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "45%" }}
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
