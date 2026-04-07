import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { t as tr, type Lang } from "@/lib/i18n/translations";

export const metadata: Metadata = {
  title: "Privacy Policy — PRAVÉ",
  description: "How PRAVÉ collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("crs_lang")?.value;
  const lang: Lang = langCookie === "es" ? "es" : "en";

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
          {tr("privacy_legal", lang)}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr("privacy_title", lang)}</h1>
        <p className="mt-3 text-sm text-white/50">{tr("privacy_updated", lang)}</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/72">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_1_heading", lang)}</h2>
            <p>{tr("privacy_1_body", lang)}</p>
            <p className="mt-3">{tr("privacy_1_body2", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_2_heading", lang)}</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>{tr("privacy_2_li1", lang)}</li>
              <li>{tr("privacy_2_li2", lang)}</li>
              <li>{tr("privacy_2_li3", lang)}</li>
              <li>{tr("privacy_2_li4", lang)}</li>
              <li>{tr("privacy_2_li5", lang)}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_3_heading", lang)}</h2>
            <p>{tr("privacy_3_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_4_heading", lang)}</h2>
            <p>{tr("privacy_4_intro", lang)}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Supabase</strong> — {tr("privacy_4_supabase", lang)}
              </li>
              <li>
                <strong className="text-white">Stripe</strong> — {tr("privacy_4_stripe", lang)}
              </li>
              <li>
                <strong className="text-white">OpenAI</strong> — {tr("privacy_4_openai", lang)}
              </li>
              <li>
                <strong className="text-white">Resend</strong> — {tr("privacy_4_resend", lang)}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_5_heading", lang)}</h2>
            <p>{tr("privacy_5_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_6_heading", lang)}</h2>
            <p>{tr("privacy_6_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("privacy_7_heading", lang)}</h2>
            <p>
              {tr("privacy_7_body", lang)}{" "}
              <span className="text-white">{tr("privacy_7_email", lang)}</span>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm text-white/45">
          <Link href="/terms" className="transition hover:text-white">
            {tr("privacy_link_terms", lang)}
          </Link>
          <Link href="/" className="transition hover:text-white">
            {tr("privacy_link_home", lang)}
          </Link>
        </div>
      </div>
    </main>
  );
}
