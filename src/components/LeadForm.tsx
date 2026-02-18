"use client";

import { useMemo, useState } from "react";
import { LEAD_ENDPOINT } from "@/lib/config";

type Lang = "en" | "es";

type Props = {
  lang?: Lang;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LeadForm({ lang = "en" }: Props) {
  const [email, setEmail] = useState("");
  const [crs, setCrs] = useState("");
  const [worry, setWorry] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  const copy = useMemo(() => {
    const en = {
      title: "Early access",
      subtitle: "Leave your email and I’ll notify you when the private beta opens.",
      email: "Email (required)",
      crs: "Approx CRS score (optional)",
      worry: "What worries you most? (optional)",
      btn: "Get access",
      sending: "Sending…",
      okTitle: "You’re in ✅",
      okBody: "Thanks! I’ll email you when the beta opens.",
      errTitle: "Something went wrong",
      errBody: "Please try again in a moment.",
      helper:
        "No spam. Unsubscribe anytime. Informational tool — not legal or immigration advice.",
    };

    const es = {
      title: "Acceso anticipado",
      subtitle: "Deja tu email y te aviso cuando abra la beta privada.",
      email: "Email (requerido)",
      crs: "CRS aproximado (opcional)",
      worry: "¿Qué te preocupa más? (opcional)",
      btn: "Quiero acceso",
      sending: "Enviando…",
      okTitle: "Listo ✅",
      okBody: "¡Gracias! Te aviso cuando abra la beta.",
      errTitle: "Ocurrió un error",
      errBody: "Intenta de nuevo en un momento.",
      helper:
        "Cero spam. Puedes salir cuando quieras. Herramienta informativa — no es asesoría legal o migratoria.",
    };

    return lang === "es" ? es : en;
  }, [lang]);

  const disabled = status === "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setErrorMsg(lang === "es" ? "Email inválido." : "Invalid email.");
      return;
    }

    if (!LEAD_ENDPOINT.googleAppsScriptUrl) {
      setStatus("error");
      setErrorMsg(
        lang === "es"
          ? "Falta configurar la URL del Google Script."
          : "Google Script URL is not configured."
      );
      return;
    }

    setStatus("loading");

    try {
      const payload = {
        email: trimmed,
        crs: crs.trim(),
        worry: worry.trim(),
        source: "landing",
        lang,
      };

      const res = await fetch(LEAD_ENDPOINT.googleAppsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text || "Request failed");

      try {
        const json = JSON.parse(text) as { ok?: boolean; error?: string };
        if (json?.ok === false) throw new Error(json?.error || "Server error");
      } catch {
        // ignore parse errors
      }

      setStatus("success");
      setEmail("");
      setCrs("");
      setWorry("");
    } catch (err: unknown) {
      setStatus("error");

      let msg = copy.errBody;
      if (err instanceof Error) msg = err.message || copy.errBody;
      else if (typeof err === "string") msg = err;

      setErrorMsg(msg);
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-xs font-medium text-indigo-900">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {copy.title}
          </div>

          <p className="mt-3 text-sm text-gray-700">{copy.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-800">{copy.email}</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={disabled}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">{copy.crs}</span>
            <input
              value={crs}
              onChange={(e) => setCrs(e.target.value)}
              placeholder="e.g., 472"
              disabled={disabled}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">{copy.worry}</span>
            <textarea
              value={worry}
              onChange={(e) => setWorry(e.target.value)}
              placeholder={
                lang === "es"
                  ? "Ej. ¿Me conviene francés o esperar 1 año de CEC?"
                  : "e.g., Should I focus on French or wait for 1 year of CEC?"
              }
              disabled={disabled}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </label>

          {/* ✅ back to Tailwind v3-friendly gradient */}
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {disabled ? copy.sending : copy.btn}
          </button>

          {status === "success" && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <div className="font-semibold">{copy.okTitle}</div>
              <div className="mt-1">{copy.okBody}</div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <div className="font-semibold">{copy.errTitle}</div>
              <div className="mt-1">{errorMsg || copy.errBody}</div>
            </div>
          )}

          <p className="pt-1 text-xs text-gray-600">{copy.helper}</p>
        </form>
      </div>
    </div>
  );
}