// src/app/api/simulate/route.ts
import { NextResponse } from "next/server";
import type { Lang, ProfileDraft } from "@/lib/crs/types";
import { buildProfile } from "@/lib/crs/profile";
import { simulateTop } from "@/lib/crs/optimize";

type Body = {
  lang?: Lang;
  profile?: ProfileDraft;
  topN?: number;
};

function isLang(x: unknown): x is Lang {
  return x === "en" || x === "es";
}

function parseBody(x: unknown): Body {
  if (typeof x !== "object" || x === null) return {};
  const o = x as Record<string, unknown>;
  return {
    lang: isLang(o.lang) ? o.lang : undefined,
    profile: (typeof o.profile === "object" && o.profile !== null ? (o.profile as ProfileDraft) : undefined),
    topN: typeof o.topN === "number" ? o.topN : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    const body = parseBody(raw);

    const lang: Lang = body.lang ?? "en";
    const topN = Number.isFinite(body.topN ?? NaN) ? Math.max(1, Math.min(10, Number(body.topN))) : 5;

    const profile = buildProfile(body.profile ?? {});
    const result = simulateTop(profile, lang, topN);

    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}