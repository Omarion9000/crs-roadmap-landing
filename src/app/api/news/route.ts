import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local (restart dev server after editing).",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false }) // <- cambia si tu columna se llama distinto
    .limit(30);

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Check table name/columns in Supabase." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { items: data ?? [], updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}