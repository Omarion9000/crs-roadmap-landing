import LeadForm from "@/components/LeadForm";
import { APP } from "@/lib/config";

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

const faqs: Record<Lang, { q: string; a: string }[]> = {
  en: [
    {
      q: "Is this the official CRS calculator?",
      a: "No. The official calculator gives a number. This tool helps you compare scenarios and prioritize what to improve first.",
    },
    {
      q: "Who is this for?",
      a: "International students on PGWP aiming for CEC → Express Entry (and anyone optimizing CRS).",
    },
    {
      q: "Is this immigration advice?",
      a: "No. It’s an informational tool based on public sources. Not legal or immigration advice.",
    },
    {
      q: "How much will it cost?",
      a: "Early access is free. The goal is a simple monthly plan later (around $19 CAD/month).",
    },
    {
      q: "When will the beta open?",
      a: "Soon. I’m collecting early users first to build the right features in the right order.",
    },
    {
      q: "What data do you store?",
      a: "For early access we only collect what you submit in the form. You can unsubscribe anytime.",
    },
  ],
  es: [
    {
      q: "¿Esto es la calculadora oficial?",
      a: "No. La calculadora oficial te da un número. Esto te ayuda a comparar escenarios y priorizar qué mejorar primero.",
    },
    {
      q: "¿Para quién es?",
      a: "Estudiantes internacionales con PGWP que van por CEC → Express Entry (y cualquiera optimizando CRS).",
    },
    {
      q: "¿Es asesoría migratoria?",
      a: "No. Es una herramienta informativa basada en fuentes públicas. No reemplaza asesoría profesional.",
    },
    {
      q: "¿Cuánto costará?",
      a: "El acceso anticipado es gratis. La idea es un plan mensual simple después (aprox. $19 CAD/mes).",
    },
    {
      q: "¿Cuándo abre la beta?",
      a: "Pronto. Primero estoy juntando usuarios tempranos para construir lo correcto en el orden correcto.",
    },
    {
      q: "¿Qué datos guardas?",
      a: "Por ahora solo lo que envías en el formulario. Puedes salir cuando quieras.",
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
      examplesTitle: "Real-world examples",
      examplesSub:
        "Typical point boosts vary by profile — this tool helps you model YOUR scenarios.",
      trustStripA: "Based on public sources",
      trustStripB: "Not legal advice",
      trustStripC: "Built for PGWP → CEC",
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
        "Muchos con PGWP no saben qué mejora realmente sube puntos. Esta herramienta ordena opciones por ROI de puntos.",
      trust:
        "Hecho por un ex estudiante internacional. Beta en progreso — tu feedback define el roadmap.",
      sectionValue: "Lo que obtendrás",
      examplesTitle: "Ejemplos reales",
      examplesSub:
        "Los puntos varían por perfil — esta herramienta modela TUS escenarios.",
      trustStripA: "Basado en fuentes públicas",
      trustStripB: "No es asesoría legal",
      trustStripC: "Hecho para PGWP → CEC",
      faqTitle: "Preguntas rápidas",
      disclaimer:
        "Disclaimer: herramienta informativa basada en fuentes públicas. No es asesoría legal o migratoria.",
    },
  }[lang];

  const examples =
    lang === "en"
      ? [
          {
            badge: "+50 pts",
            title: "IELTS jump to CLB 9",
            desc: "For many profiles, hitting CLB 9 can unlock big transfers.",
          },
          {
            badge: "+62 pts",
            title: "French (B2 range)",
            desc: "French can be a game-changer depending on your baseline.",
          },
          {
            badge: "+600 pts",
            title: "PNP nomination",
            desc: "A nomination can dramatically change your invitation chances.",
          },
        ]
      : [
          {
            badge: "+50 pts",
            title: "IELTS subir a CLB 9",
            desc: "Para muchos perfiles, CLB 9 desbloquea transferencias fuertes.",
          },
          {
            badge: "+62 pts",
            title: "Francés (rango B2)",
            desc: "El francés puede cambiar todo según tu base actual.",
          },
          {
            badge: "+600 pts",
            title: "Nominación PNP",
            desc: "Una nominación puede disparar tus posibilidades de invitación.",
          },
        ];

  return (
    <main className="min-h-screen bg-white">
      {/* Premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-slate-50 via-white to-white" />
        <div className="absolute -top-40 left-1/2 h-80 w-208 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

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

          <a
            href="#access"
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur hover:bg-white"
          >
            {ui.navCta}
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-800 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {ui.statusPill}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              {APP.tagline[lang]}
            </h1>

            <p className="mt-4 text-lg text-gray-800">{APP.subtagline[lang]}</p>

            {/* Pain box */}
            <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-gray-900">{ui.painTitle}</div>
              <p className="mt-1 text-sm text-gray-700">{ui.painBody}</p>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#access"
                className="rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:opacity-95"
              >
                {ui.ctaPrimary}
              </a>

              <a
                href="#how"
                className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-gray-900 shadow-sm backdrop-blur hover:bg-white"
              >
                {ui.ctaSecondary}
              </a>

              <span className="text-sm text-gray-600">{ui.micro}</span>
            </div>

            <p className="mt-4 text-sm text-gray-600">{ui.trust}</p>

            {/* Trust strip */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: ui.trustStripA },
                { label: ui.trustStripB },
                { label: ui.trustStripC },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-gray-800 shadow-sm backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                      ✓
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Value */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-gray-900">{ui.sectionValue}</h2>

              <ul className="mt-4 space-y-3">
                {bullets[lang].map((b) => (
                  <li
                    key={b.title}
                    className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur"
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

            {/* Examples */}
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{ui.examplesTitle}</h2>
                  <p className="mt-2 text-sm text-gray-600">{ui.examplesSub}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {examples.map((ex) => (
                  <div
                    key={ex.title}
                    className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur"
                  >
                    <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-xs font-semibold text-indigo-900">
                      {ex.badge}
                    </div>
                    <div className="mt-3 font-semibold text-gray-900">{ex.title}</div>
                    <p className="mt-2 text-sm text-gray-700">{ex.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How it works */}
            <div
              id="how"
              className="mt-12 rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur"
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
            <div className="rounded-3xl border border-black/10 bg-white/60 p-3 shadow-lg backdrop-blur">
              <LeadForm lang={lang} />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900">{ui.faqTitle}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {faqs[lang].map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur"
              >
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
