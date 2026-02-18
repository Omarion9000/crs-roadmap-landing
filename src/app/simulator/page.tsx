import Link from "next/link";
import SimulatorMVP from "@/components/SimulatorMVP";

export default function SimulatorPage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#0B1020] via-[#070A12] to-black" />
        <div className="absolute -top-40 left-1/2 h-80 w-240 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-sm font-semibold">CRS Roadmap • Simulator</div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            ← Back to landing
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Scenario Simulator (MVP)</h1>
          <p className="mt-2 text-white/70">
            Enter your baseline CRS and test improvements. You’ll get a ranked plan by ROI.
          </p>
        </div>

        <SimulatorMVP />
      </section>
    </main>
  );
}
