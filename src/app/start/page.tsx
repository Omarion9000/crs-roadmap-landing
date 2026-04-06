import Link from "next/link";

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#0B1020] via-[#070A12] to-black" />
        <div className="absolute -top-40 left-1/2 h-80 w-240 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            CRS Roadmap
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Start the right way
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Choose the path that matches your situation. If you already know your
            CRS score, go straight to strategy mode. If not, we’ll help you
            calculate it step by step first.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-linear-to-b from-white/8 to-white/4 p-8 shadow-2xl shadow-black/20">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
              Option 1
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              I already know my CRS score
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60">
              Go directly into the simulator and compare improvement scenarios
              based on your current CRS score.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/70">
              <li>• Faster path for informed users</li>
              <li>• Compare strategies immediately</li>
              <li>• Focus on the best next move</li>
            </ul>

            <div className="mt-8">
              <Link
                href="/simulator"
                className="inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Continue to simulator
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-8 shadow-2xl shadow-black/20">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Option 2
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              I don’t know my CRS score yet
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Use the guided calculator first. We’ll walk you through the CRS
              factors and then you can use that result in your roadmap.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/75">
              <li>• Better for first-time users</li>
              <li>• Guided step-by-step flow</li>
              <li>• Helps avoid mistakes and confusion</li>
            </ul>

            <div className="mt-8">
              <Link
                href="/crs-calculator"
                className="inline-flex items-center rounded-2xl border border-white/15 bg-[#070A12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Calculate my CRS first
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Not sure which option to choose? Start with{" "}
          <span className="font-semibold text-white">
            “I don’t know my CRS score yet”
          </span>
          .
        </div>
      </section>
    </main>
  );
}