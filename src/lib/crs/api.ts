// src/lib/crs/api.ts
import type { SimulateInput, SimulateResponse } from "./types";

type ApiOk<T> = { ok: true; result: T };
type ApiErr = { ok: false; error: string };

function isApiErr(x: unknown): x is ApiErr {
  return typeof x === "object" && x !== null && (x as { ok?: unknown }).ok === false && typeof (x as { error?: unknown }).error === "string";
}

export async function simulate(input: SimulateInput): Promise<SimulateResponse> {
  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lang: input.lang,
      profile: input.profile,
      topN: input.topN,
    }),
    signal: input.signal,
  });

  const data: unknown = await res.json();

  if (!res.ok) {
    if (isApiErr(data)) throw new Error(data.error);
    throw new Error(`HTTP ${res.status}`);
  }

  const ok = data as ApiOk<SimulateResponse>;
  if (!ok || ok.ok !== true || !ok.result) throw new Error("Bad API response");
  return ok.result;
}