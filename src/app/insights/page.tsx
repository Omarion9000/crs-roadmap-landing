import Link from "next/link";
import InsightsClient from "@/components/insights/InsightsClient";

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#070A12] via-[#070A12] to-black" />
        <div className="absolute -top-44 left-1/2 h-80 w-240 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-28 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black font-semibold">
              C
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">
                Express Entry Intelligence
              </div>
              <div className="text-xs text-white/60">
                Live dashboard (mock) — real data next
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Back to landing
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <InsightsClient />
      </section>
    </main>
  );
}