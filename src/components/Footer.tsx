"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/8 bg-[#070A12] px-6 py-8 text-white/45">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-xs">
          © {new Date().getFullYear()} PRAVÉ. {t("footer_rights")}
        </div>

        <div className="flex flex-wrap justify-center gap-5 text-xs sm:justify-end">
          <Link href="/terms" className="transition hover:text-white">
            {t("footer_terms")}
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            {t("footer_privacy")}
          </Link>
          <Link href="/simulator" className="transition hover:text-white">
            {t("footer_simulator")}
          </Link>
        </div>

        <div className="text-center text-[11px] text-white/30 sm:text-right">
          {t("footer_disclaimer")}
        </div>
      </div>
    </footer>
  );
}
