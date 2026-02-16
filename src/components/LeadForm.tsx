"use client";

import { useMemo, useState } from "react";
import { LEAD_ENDPOINT } from "@/lib/config";

type Lang = "en" | "es";
type FormState = "idle" | "submitting" | "success" | "error";

const TEXT: Record<Lang, Record<string, string>> = {
  en: {
    title: "Early access",
    desc: "Leave your email and I’ll notify you when the private beta opens.",
    emailLabel: "Email (required)",
    crsLabel: "Approx CRS score (optional)",
    worryLabel: "What worries you most? (optional)",
    emailPh: "you@email.com",
    crsPh: "e.g., 472",
    worryPh: "e.g., Should I focus on French or wait for 1 year of CEC?",
    btnIdle: "Get access",
    btnSending: "Sending...",
    success: "Done ✅ I’ll email you when the beta is ready.",
    error: "Something failed. Try again.",
    legal:
      "Informational tool based on public sources. Not legal or immigration advice.",
    missingEndpoint:
      "Missing Google Sheets endpoint. Complete the Google Apps Script step and paste the URL into src/lib/config.ts",
  },
  es: {
    title: "Acceso anticipado",
    desc: "Déjame tu email y te aviso cuando abramos la beta privada.",
    emailLabel: "Email (obligatorio)",
    crsLabel: "CRS aproximado (opcional)",
    worryLabel: "¿Qué te preocupa más? (opcional)",
    emailPh: "tuemail@gmail.com",
    crsPh: "Ej: 472",
    worryPh: "Ej: ¿Me conviene francés o esperar 1 año CEC?",
    btnIdle: "Quiero acceso",
    btnSending: "Enviando...",
    success: "Listo ✅ Te avisaré cuando la beta esté lista.",
    error: "Algo falló. Intenta de nuevo.",
    legal:
      "Herramienta informativa basada en fuentes públicas. No es asesoría legal o migratoria.",
    missingEndpoint:
      "Falta configurar el endpoint de Google Sheets. Termina Apps Script y pega la URL en src/lib/config.ts",
  },
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LeadForm({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [crs, setCrs] = useState("");
  const [worry, setWorry] = useState("");

  const endpoint = LEAD_ENDPOINT.googleAppsScriptUrl?.trim();

  const canSubmit = useMemo(() => {
    if (state === "submitting") return false;
    if (!isValidEmail(email)) return false;
    return true;
  }, [email, state]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setState("error");
      return;
    }

    if (!endpoint) {
      alert(t.missingEndpoint);
      return;
    }

    setState("submitting");

    try {
      const payload = {
        email: email.trim(),
        crs: crs.trim(),
        worry: worry.trim(),
        source: "landing",
        lang,
        ts: new Date().toISOString(),
      };

      const res = await fetch(endpoint, {
        method: "POST",
        // Apps Script suele funcionar mejor con text/plain para evitar preflight CORS
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Bad response");

      setState("success");
      setEmail("");
      setCrs("");
      setWorry("");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{t.title}</h3>
      <p className="mt-1 text-sm text-gray-600">{t.desc}</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-medium" htmlFor="email">
            {t.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder={t.emailPh}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="crs">
            {t.crsLabel}
          </label>
          <input
            id="crs"
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder={t.crsPh}
            value={crs}
            onChange={(e) => setCrs(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="worry">
            {t.worryLabel}
          </label>
          <textarea
            id="worry"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder={t.worryPh}
            value={worry}
            onChange={(e) => setWorry(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {state === "submitting" ? t.btnSending : t.btnIdle}
        </button>

        {state === "success" && (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
            {t.success}
          </div>
        )}

        {state === "error" && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {t.error}
          </div>
        )}

        <p className="text-xs text-gray-500">{t.legal}</p>
      </form>
    </div>
  );
}
