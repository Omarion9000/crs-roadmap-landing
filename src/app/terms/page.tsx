import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { t as tr, type Lang } from "@/lib/i18n/translations";

export const metadata: Metadata = {
  title: "Terms of Service — PRAVÉ",
  description: "Terms and conditions for using the PRAVÉ CRS Roadmap platform.",
};

export default async function TermsPage() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("crs_lang")?.value;
  const lang: Lang = langCookie === "es" ? "es" : "en";

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
          {tr("terms_legal", lang)}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr("terms_title", lang)}</h1>
        <p className="mt-3 text-sm text-white/50">{tr("terms_updated", lang)}</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/72">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_1_heading", lang)}</h2>
            <p>{tr("terms_1_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_2_heading", lang)}</h2>
            <p>{tr("terms_2_body", lang)}</p>
            <p className="mt-3">{tr("terms_2_body2", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_3_heading", lang)}</h2>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100/85">
              {tr("terms_3_disclaimer", lang)}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_4_heading", lang)}</h2>
            <p>{tr("terms_4_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_5_heading", lang)}</h2>
            <p>{tr("terms_5_body", lang)}</p>
            <p className="mt-3">{tr("terms_5_body2", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_6_heading", lang)}</h2>
            <p>{tr("terms_6_intro", lang)}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>{tr("terms_6_li1", lang)}</li>
              <li>{tr("terms_6_li2", lang)}</li>
              <li>{tr("terms_6_li3", lang)}</li>
              <li>{tr("terms_6_li4", lang)}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_7_heading", lang)}</h2>
            <p>{tr("terms_7_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_8_heading", lang)}</h2>
            <p>{tr("terms_8_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_9_heading", lang)}</h2>
            <p>{tr("terms_9_body", lang)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">{tr("terms_10_heading", lang)}</h2>
            <p>
              {tr("terms_10_body", lang)}{" "}
              <span className="text-white">{tr("terms_10_email", lang)}</span>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm text-white/45">
          <Link href="/privacy" className="transition hover:text-white">
            {tr("terms_link_privacy", lang)}
          </Link>
          <Link href="/" className="transition hover:text-white">
            {tr("terms_link_home", lang)}
          </Link>
        </div>
      </div>
    </main>
  );
}
