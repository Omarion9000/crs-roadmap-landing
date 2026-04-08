import Link from "next/link";
import { cookies } from "next/headers";

export default async function NotFound() {
  let isES = false;
  try {
    const cookieStore = await cookies();
    isES = cookieStore.get("crs_lang")?.value === "es";
  } catch {
    // cookie access may be unavailable in some contexts
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070A12] px-6 text-white">
      <div className="mx-auto max-w-lg text-center">
        {/* Big ghost number */}
        <div
          aria-hidden="true"
          className="select-none text-[9rem] font-bold leading-none tracking-tight text-white/[0.04] sm:text-[12rem]"
        >
          404
        </div>

        <div className="-mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
            {isES ? "Página no encontrada" : "Page not found"}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {isES
              ? "Ups, esta página no existe."
              : "This page doesn't exist."}
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            {isES
              ? "La página que buscas fue movida, eliminada, o nunca existió. Vuelve al inicio o prueba el simulador."
              : "The page you're looking for was moved, deleted, or never existed. Head back home or try the simulator."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              {isES ? "Ir al inicio" : "Go home"}
            </Link>
            <Link
              href="/simulator"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {isES ? "Ir al simulador" : "Try the simulator"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
