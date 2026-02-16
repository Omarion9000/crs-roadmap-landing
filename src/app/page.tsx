import LeadForm from "@/components/LeadForm";
import { APP } from "@/lib/config";

type Lang = "en" | "es";

// Idioma por defecto (para validación):
const DEFAULT_LANG: Lang = "en"; // cámbialo a "es" si prefieres español hoy

const bullets: Record<Lang, string[]> = {
  en: [
    "1-click scenario simulator",
    "Recommendations by real ROI",
    "Save your profile and progress",
  ],
  es: [
    "Simulador de escenarios en 1 click",
    "Recomendaciones por ROI real",
    "Guarda tu perfil y tu progreso",
  ],
};

const faqs: Record<Lang, { q: string; a: string }[]> = {
  en: [
    {
      q: "Is this the official CRS calculator?",
      a: "No. The official calculator gives you a number. This helps you compare scenarios and prioritize what to improve first.",
    },
    {
      q: "Who is this for?",
      a: "International students on PGWP targeting CEC and Express Entry.",
    },
    {
      q: "Is this immigration advice?",
      a: "No. Informational tool based on public sources. Not legal or immigration advice.",
    },
  ],
  es: [
    {
      q: "¿Esto es la calculadora oficial?",
      a: "No. La calculadora oficial te da un número. Esto te ayuda a comparar escenarios y priorizar qué mejorar primero.",
    },
    {
      q: "¿Para quién es?",
      a: "Estudiantes internacionales con PGWP que apuntan a CEC y Express Entry.",
    },
    {
      q: "¿Es asesoría migratoria?",
      a: "No. Es una herramienta informativa basada en fuentes públicas. No reemplaza asesoría profesional.",
    },
  ],
};

export default function Page() {
  const lang = DEFAULT_LANG;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{APP.name}</div>
          <a
            href="#access"
            className="rounded-xl border bg-white px-3 py-2 text-sm shadow-sm"
          >
            {lang === "en" ? "Early access" : "Acceso anticipado"}
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {APP.tagline[lang]}
            </h1>
            <p className="mt-4 text-lg text-gray-700">{APP.subtagline[lang]}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#access"
                className="rounded-xl bg-black px-4 py-2 text-white"
              >
                {lang === "en" ? "Get access" : "Quiero acceso"}
              </a>
              <a href="#how" className="rounded-xl border bg-white px-4 py-2">
                {lang === "en" ? "How it works" : "Cómo funciona"}
              </a>
            </div>

            <ul className="mt-8 space-y-3">
              {bullets[lang].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-xl border bg-white p-3"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-sm text-white">
                    ✓
                  </span>
                  <span className="text-gray-800">{b}</span>
                </li>
              ))}
            </ul>

            <div id="how" className="mt-10 rounded-2xl border bg-white p-6">
              <h2 className="text-xl font-semibold">
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

          <div id="access" className="md:sticky md:top-6">
            <LeadForm lang={lang} />
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            {lang === "en" ? "Quick FAQ" : "Preguntas rápidas"}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {faqs[lang].map((f) => (
              <div key={f.q} className="rounded-2xl border bg-white p-5">
                <div className="font-semibold">{f.q}</div>
                <p className="mt-2 text-sm text-gray-700">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t py-8 text-sm text-gray-600">
          <p>
            {lang === "en"
              ? "Disclaimer: informational tool based on public sources. Not legal or immigration advice."
              : "Disclaimer: herramienta informativa basada en fuentes públicas. No es asesoría legal o migratoria."}
          </p>
        </footer>
      </section>
    </main>
  );
}
