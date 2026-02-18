import { NextResponse } from "next/server";
import { MOCK_DRAWS } from "@/lib/insights/mock";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(
    { items: MOCK_DRAWS, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}