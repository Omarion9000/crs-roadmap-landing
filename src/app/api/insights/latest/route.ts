import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ProgramKey = "general" | "cec" | "french" | "pnp";

const MOCK_CUTOFFS: Record<ProgramKey, number> = {
  general: 491,
  cec: 480,
  french: 470,
  pnp: 720,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const program = (searchParams.get("program") || "general") as ProgramKey;

  const cutoff = MOCK_CUTOFFS[program] ?? MOCK_CUTOFFS.general;

  return NextResponse.json(
    {
      ok: true,
      data: {
        cutoff,
        date: new Date().toISOString(),
        program,
        source: "mock",
      },
    },
    { status: 200 }
  );
}