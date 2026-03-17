import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type LeadPayload = {
  email?: string;
  crs?: string | number | null;
  approxCrs?: string | number | null;
  worries?: string | null;
  worry?: string | null;
  source?: string | null;
  lang?: "en" | "es" | string | null;
};

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIntOrNull(v: unknown) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as LeadPayload;

    const emailRaw = body.email ?? "";
    const email = cleanEmail(emailRaw);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    const approx_crs = toIntOrNull(body.approxCrs ?? body.crs);
    const worries = (body.worries ?? body.worry ?? "").trim() || null;
    const source = String(body.source ?? "landing").trim() || "landing";
    const lang = String(body.lang ?? "en").trim() || "en";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: insertError } = await supabase.from("leads").insert([
      {
        email,
        approx_crs,
        worries,
        source,
        lang,
      },
    ]);

    const insertCode =
      (insertError as { code?: string | null } | null)?.code ?? null;

    if (insertError && insertCode !== "23505") {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);

      const isES = lang.toLowerCase().startsWith("es");

      const subject = isES
        ? "✅ CRS Roadmap — ya estás en la lista"
        : "✅ CRS Roadmap — you're on the list";

      const html = isES
        ? `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
            <h2>¡Listo! ✅</h2>
            <p>Gracias por registrarte en <b>CRS Roadmap</b>.</p>
            <p>Te avisaré por email cuando abra la beta privada.</p>
            <p style="color:#666;font-size:12px;margin-top:24px">
              Herramienta informativa — no es asesoría legal o migratoria.
            </p>
          </div>
        `
        : `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
            <h2>You’re in ✅</h2>
            <p>Thanks for joining <b>CRS Roadmap</b>.</p>
            <p>I’ll email you when the private beta opens.</p>
            <p style="color:#666;font-size:12px;margin-top:24px">
              Informational tool — not legal or immigration advice.
            </p>
          </div>
        `;

      await resend.emails.send({
        from: "CRS Roadmap <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      });
    }

    return NextResponse.json({
      ok: true,
      duplicate: insertCode === "23505",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}