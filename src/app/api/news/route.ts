import { NextResponse } from "next/server";
import { MOCK_NEWS } from "@/lib/insights/mock";

export async function GET() {
  return NextResponse.json(
    { items: MOCK_NEWS, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}