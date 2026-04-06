import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#070A12] px-6 py-8 text-white/45">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-xs">
          © {new Date().getFullYear()} PRAVÉ. All rights reserved.
        </div>

        <div className="flex flex-wrap justify-center gap-5 text-xs sm:justify-end">
          <Link href="/terms" className="transition hover:text-white">
            Terms of Service
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/simulator" className="transition hover:text-white">
            Simulator
          </Link>
        </div>

        <div className="text-center text-[11px] text-white/30 sm:text-right">
          For informational purposes only. Not immigration advice.{" "}
          <br className="hidden sm:block" />
          Verify requirements with IRCC or a licensed RCIC.
        </div>
      </div>
    </footer>
  );
}
