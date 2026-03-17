// src/app/api/draws/route.ts
import { NextResponse } from "next/server";
import type { Draw } from "@/lib/insights/types";

// ✅ Real datasets (latest-first, as you already have them)
import { GENERAL_DRAWS_REAL, CATEGORY_DRAWS_REAL } from "@/lib/insights/data/general-draws.real";

// If you still want mock fallback for non-live programs:
import { MOCK_DRAWS } from "@/lib/insights/mock";

export const dynamic = "force-dynamic";

type ProgramKey = "general" | "category" | "cec" | "fsw" | "pnp";

function normalizeProgram(raw: string | null): ProgramKey {
  const p = (raw ?? "general").toLowerCase();
  if (p === "general" || p === "category" || p === "cec" || p === "fsw" || p === "pnp") return p;
  return "general";
}

function byProgramLabel(program: ProgramKey) {
  // These are labels inside Draw.program
  if (program === "general") return "General";
  if (program === "category") return "Category";
  if (program === "cec") return "CEC";
  if (program === "fsw") return "FSW";
  return "PNP";
}

function pickDraws(program: ProgramKey): Draw[] {
  // ✅ Live sources
  if (program === "general") return GENERAL_DRAWS_REAL;
  if (program === "category") return CATEGORY_DRAWS_REAL;

  // ✅ Fallback sources for "soon" programs (keep if you want)
  const label = byProgramLabel(program);
  const filtered = (MOCK_DRAWS ?? []).filter((d) => (d.program ?? "").toLowerCase() === label.toLowerCase());
  return filtered;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const program = normalizeProgram(searchParams.get("program"));

    const draws = pickDraws(program);

    return NextResponse.json({
      items: draws,
      updatedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ items: [], updatedAt: new Date().toISOString(), error: msg }, { status: 500 });
  }
}