"use client";
import LeadForm from "@/components/LeadForm";
import { APP } from "@/lib/config";
import Link from "next/link";
import LandingPreview from "@/components/LandingPreview";

type Lang = "en" | "es";
const DEFAULT_LANG: Lang = "en";

const bullets: Record<Lang, { title: string; desc: string }[]> = {
  en: [
    {
      title: "1-click scenario simulator",
      desc: "Compare IELTS, French, CEC time, PNP, job offer — instantly.",
    },
    {
      title: "Recommendations by real ROI",
      desc: "See what gives the biggest point boost first (not guesswork).",
    },
    {
      title: "Save your profile & progress",
      desc: "Track improvements over weeks/months as you plan your path.",
    },
  ],
  es: [
    {
      title: "Simulador de escenarios en 1 click",
      desc: "Compara IELTS, francés, tiempo CEC, PNP, job offer — al instante.",
    },
    {
      title: "Recomendaciones por ROI real",
      desc: "Qué te da más puntos primero (sin adivinar).",
    },
    {
      title: "Guarda tu perfil y tu progreso",
      desc: "Sigue tus mejoras por semanas/meses mientras avanzas.",
    },
  ],
};

type ScenarioKey = "ielts" | "french" | "pnp" | "job" | "cec";

const scenarioChips: Record<Lang, { key: ScenarioKey; label: string }[]> = {
  en: [
    { key: "ielts", label: "IELTS → CLB 9" },
    { key: "french", label: "French → B2" },
    { key: "pnp", label: "PNP (+600)" },
    { key: "job", label: "Job offer" },
    { key: "cec", label: "CEC time" },
  ],
  es: [
    { key: "ielts", label: "IELTS → CLB 9" },
    { key: "french", label: "Francés → B2" },
    { key: "pnp", label: "PNP (+600)" },
    { key: "job", label: "Job offer" },
    { key: "cec", label: "Tiempo CEC" },
  ],
};

const outcomes: Record<
  Lang,
  { id: ScenarioKey; title: string; points: string; note: string }[]
> = {
  en: [
    {
      id: "ielts",
      title: "IELTS to CLB 9",
      points: "+ up to ~50",
      note: "Often the fastest high-ROI improvement for many profiles.",
    },
    {
      id: "french",
      title: "French to B2",
      points: "+ up to ~62",
      note: "Can unlock major category advantages depending on draws.",
    },
    {
      id: "pnp",
      title: "PNP nomination",
      points: "+600",
      note: "If eligible, it’s a massive boost — but depends on province & stream.",
    },
    {
      id: "job",
      title: "Job offer",
      points: "+ varies",
      note: "Impact depends on NOC/TEER and whether it qualifies under current rules.",
    },
    {
      id: "cec",
      title: "CEC time (Canadian experience)",
      points: "+ varies",
      note: "Time changes your profile and can materially move CRS across thresholds.",
    },
  ],
  es: [
    {
      id: "ielts",
      title: "IELTS a CLB 9",
      points: "+ hasta ~50",
      note: "Suele ser el upgrade más rápido y de mayor ROI para muchos perfiles.",
    },
    {
      id: "french",
      title: "Francés a B2",
      points: "+ hasta ~62",
      note: "Puede abrir ventajas fuertes según categorías y draws.",
    },
    {
      id: "pnp",
      title: "Nominación PNP",
      points: "+600",
      note: "Si calificas, el boost es enorme — depende de provincia y stream.",
    },
    {
      id: "job",
      title: "Job offer",
      points: "+ variable",
      note: "Depende del NOC/TEER y si califica bajo las reglas vigentes.",
    },
    {
      id: "cec",
      title: "Tiempo CEC (experiencia Canadá)",
      points: "+ variable",
      note: "El tiempo cambia tu perfil y puede mover tu CRS de forma importante.",
    },
  ],
};

const faqs: Record<Lang, { q: string; a: string }[]> = {
  en: [
    {
      q: "Is this the official CRS calculator?",
      a: "No. The official calculator gives a number. This helps you compare scenarios and prioritize what to improve first.",
    },
    {
      q: "Who is this for?",
      a: "International students on PGWP aiming for CEC → Express Entry (and anyone optimizing CRS).",
    },
    {
      q: "Is this immigration advice?",
      a: "No. It’s an informational tool based on public sources. Not legal or immigration advice.",
    },
  ],
  es: [
    {
      q: "¿Esto es la calculadora oficial?",
      a: "No. La oficial te da un número. Esto te ayuda a comparar escenarios y priorizar qué mejorar primero.",
    },
    {
      q: "¿Para quién es?",
      a: "Estudiantes con PGWP que van por CEC → Express Entry (y cualquiera optimizando CRS).",
    },
    {
      q: "¿Es asesoría migratoria?",
      a: "No. Es informativo basado en fuentes públicas. No reemplaza asesoría profesional.",
    },
  ],
};

export default function Page() {
  const lang = DEFAULT_LANG;

  const ui = {
    en: {
      navCta: "Early access",
      ctaPrimary: "Get access",
      ctaSecondary: "How it works",
      micro: "No spam. 1 minute. You’ll get invited to the private beta.",
      badge: "PGWP → CEC → Express Entry",
      statusPill: "Private beta building now",
      painTitle: "Stuck around 465–485 CRS?",
      painBody:
        "Most PGWP students don’t know which improvement actually moves the needle. This tool ranks options by points ROI.",
      trust:
        "Built by a former international student. Beta in progress — your feedback shapes the roadmap.",
      sectionValue: "What you’ll get",
      chipsTitle: "Try the scenarios",
      chipsSub: "Click a scenario to preview typical impact and what to prioritize first.",
      outcomesTitle: "Example outcomes",
      outcomesSub:
        "Preview the kind of “points ROI” guidance you’ll get (varies by profile & current rules).",
      faqTitle: "Quick FAQ",
      disclaimer:
        "Disclaimer: informational tool based on public sources. Not legal or immigration advice.",
    },
    es: {
      navCta: "Acceso anticipado",
      ctaPrimary: "Quiero acceso",
      ctaSecondary: "Cómo funciona",
      micro: "Cero spam. 1 minuto. Te invito a la beta privada cuando esté lista.",
      badge: "PGWP → CEC → Express Entry",
      statusPill: "Beta privada en progreso",
      painTitle: "¿Atorado en 465–485 CRS?",
      painBody:
        "Muchos con PGWP no saben qué mejora realmente sube puntos. Esto ordena opciones por ROI de puntos.",
      trust:
        "Hecho por un ex estudiante internacional. Beta en progreso — tu feedback define el roadmap.",
      sectionValue: "Lo que obtendrás",
      chipsTitle: "Prueba escenarios",
      chipsSub: "Haz click en un escenario para ver impacto típico y qué priorizar.",
      outcomesTitle: "Ejemplos de impacto",
      outcomesSub:
        "Vista previa del “ROI de puntos” (varía por perfil y reglas vigentes).",
      faqTitle: "Preguntas rápidas",
      disclaimer:
        "Disclaimer: herramienta informativa basada en fuentes públicas. No es asesoría legal o migratoria.",
    },
  }[lang];

  return (
    <main className="min-h-screen bg-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
        <div className="absolute -top-40 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-40 right-[-8rem] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white font-semibold">
              C
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">{APP.name}</div>
              <div className="text-xs text-gray-600">{ui.badge}</div>
            </div>
          </div>

          {/* ✅ Make it visible (not washed out) */}
          <a
            href="#access"
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            {ui.navCta}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {ui.statusPill}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              {APP.tagline[lang]}
            </h1>

            <p className="mt-4 text-lg text-gray-800">{APP.subtagline[lang]}</p>

            {/* Pain box */}
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">{ui.painTitle}</div>
              <p className="mt-1 text-sm text-gray-700">{ui.painBody}</p>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#access"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:opacity-95"
              >
                {ui.ctaPrimary}
              </a>

              <a
                href="#how"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm hover:bg-gray-50"
              >
                {ui.ctaSecondary}
              </a>

              <span className="text-sm text-gray-600">{ui.micro}</span>
            </div>

            <p className="mt-4 text-sm text-gray-600">{ui.trust}</p>

            {/* Value */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900">{ui.sectionValue}</h2>

              <ul className="mt-4 space-y-3">
                {bullets[lang].map((b) => (
                  <li
                    key={b.title}
                    className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm text-white">
                      ✓
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{b.title}</div>
                      <div className="mt-1 text-sm text-gray-700">{b.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ✅ Clickable scenarios (brings you to outcomes) */}
            <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">{ui.chipsTitle}</h2>
              <p className="mt-1 text-sm text-gray-700">{ui.chipsSub}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {scenarioChips[lang].map((c) => (
                  <a
                    key={c.key}
                    href={`#outcome-${c.key}`}
                    className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">{ui.outcomesTitle}</h2>
              <p className="mt-1 text-sm text-gray-700">{ui.outcomesSub}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {outcomes[lang].map((o) => (
                  <div
                    key={o.id}
                    id={`outcome-${o.id}`}
                    className="scroll-mt-24 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">{o.title}</div>
                      <div className="shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1 text-sm font-semibold text-white">
                        {o.points}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{o.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div
              id="how"
              className="mt-10 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {lang === "en" ? "How it works" : "Cómo funciona"}
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700">
                <li>
                  {lang === "en"
                    ? "Enter your profile (PGWP/CEC: age, education, languages, experience)."
                    : "Ingresas tu perfil (PGWP/CEC: edad, estudios, idiomas, experiencia)."}
                </li>
                <li>
                  {lang === "en"
                    ? "Simulate improvements (IELTS, French, Canadian experience, PNP, job offer)."
                    : "Simulas mejoras (IELTS, francés, experiencia Canadá, PNP, job offer)."}
                </li>
                <li>
                  {lang === "en"
                    ? "Get a prioritized plan by impact (points ROI)."
                    : "Recibes un plan priorizado por impacto (ROI de puntos)."}
                </li>
              </ol>
            </div>
          </div>

          {/* Right */}
          <div id="access" className="md:sticky md:top-6">
            <div className="rounded-3xl border border-black/10 bg-white/80 p-3 shadow-lg backdrop-blur">
              <LeadForm lang={lang} />
            </div>
          </div>
        </div>

        {/* ===== Restored: Latest draw preview + links ===== */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Latest Express Entry snapshot
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                See the latest draw + trends, then open the simulator to compare scenarios.
              </p>
            </div>

            <div className="hidden sm:flex gap-2">
              <Link
                href="/simulator"
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90"
              >
                Open simulator
              </Link>
              <Link
                href="/insights"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
              >
                View insights
              </Link>
            </div>
          </div>

          <div className="mt-5">
            <LandingPreview />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
            <Link
              href="/simulator"
              className="w-full rounded-xl bg-black px-4 py-2 text-center text-sm font-semibold text-white shadow-md hover:opacity-90"
            >
              Open simulator
            </Link>
            <Link
              href="/insights"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              View insights
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900">{ui.faqTitle}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {faqs[lang].map((f) => (
              <div key={f.q} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="font-semibold text-gray-900">{f.q}</div>
                <p className="mt-2 text-sm text-gray-700">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t py-8 text-sm text-gray-600">
          <p>{ui.disclaimer}</p>
        </footer>
      </section>
    </main>
  );
}