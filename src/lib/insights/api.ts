// src/lib/insights/api.ts

export type ProgramKey = "general" | "cec" | "fsw" | "category" | "pnp";

// ✅ Esto refleja EXACTAMENTE lo que tu route devuelve hoy
export type BenchmarkData = {
  program: ProgramKey;
  latest: { cutoff: number; date: string };
  trend: number; // cutoff(latest) - cutoff(prev)
  source: "mock" | "real";
};

type BenchmarkResponse =
  | { ok: true; data: BenchmarkData }
  | { ok: false; error: string };

export async function getBenchmark(program: ProgramKey, signal?: AbortSignal): Promise<BenchmarkData> {
  const res = await fetch(`/api/insights/benchmark?program=${program}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Insights error (${res.status})`);

  const json = (await res.json()) as BenchmarkResponse;
  if (!json.ok) throw new Error(json.error || "Insights error");

  return json.data;
}