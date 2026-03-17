// src/app/api/insights/benchmark/route.ts
import { NextResponse } from "next/server";
import { CATEGORY_DRAWS_REAL, GENERAL_DRAWS_REAL } from "@/lib/insights/data/general-draws.real";

export const dynamic = "force-dynamic";

type Program = "general" | "category";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const program = (searchParams.get("program") ?? "general").toLowerCase() as Program;

    const draws = program === "category" ? CATEGORY_DRAWS_REAL : GENERAL_DRAWS_REAL;

    if (!Array.isArray(draws) || draws.length === 0) {
      return NextResponse.json({ ok: false, error: "No draw data available" }, { status: 500 });
    }

    // ✅ dataset is latest-first
    const latest = draws[0];
    const prev = draws.length >= 2 ? draws[1] : undefined;
    const trend = prev ? latest.cutoff - prev.cutoff : 0;

    return NextResponse.json({
      ok: true,
      data: {
        program,
        latest: { cutoff: latest.cutoff, date: latest.date },
        trend,
        source: "real",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[benchmark route] error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}