import SimulatorMVP from "@/components/SimulatorMVP";

export default function SimulatorPage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#0B1020] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:96px_96px] opacity-[0.045]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.08),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(99,102,241,0.10),transparent_20%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.08),transparent_24%)]" />
        <div className="absolute -top-44 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute top-28 right-[-6rem] h-96 w-96 rounded-full bg-blue-500/16 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-px w-[72rem] -translate-x-1/2 bg-linear-to-r from-transparent via-cyan-400/25 to-transparent" />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <SimulatorMVP />
      </section>
    </main>
  );
}
