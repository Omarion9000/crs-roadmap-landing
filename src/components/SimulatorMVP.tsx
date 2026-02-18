"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  applySelected,
  type Baseline,
  type ImprovementKey,
} from "@/lib/sim/roi";

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

type SavedScenario = {
  id: string;
  createdAt: number;
  baseline: Baseline;
  selected: Partial<Record<ImprovementKey, boolean>>;
};

const STORAGE_KEY = "crs_scenarios";

/* ---------------------------------- */
/* Improvements */
/* ---------------------------------- */

const improvements: { key: ImprovementKey; label: string }[] = [
  { key: "ielts_clb9", label: "IELTS → CLB 9" },
  { key: "ielts_clb10", label: "IELTS → CLB 10" },
  { key: "french_b1", label: "French → B1" },
  { key: "french_b2", label: "French → B2" },
  { key: "cec_12m", label: "CEC → 12 months" },
  { key: "job_offer", label: "Valid Job Offer" },
  { key: "pnp", label: "PNP Nomination" },
];

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function SimulatorMVP() {
  const [baseline] = useState<Baseline>({
    crs: 472,
    clb: 8,
    cecMonths: 10,
    hasFrench: "none",
    hasPNP: false,
    hasJobOffer: false,
  });

  const [selected, setSelected] = useState<
    Partial<Record<ImprovementKey, boolean>>
  >({
    ielts_clb9: true,
  });

  // ✅ Lazy initialization (no useEffect needed)
  const [saved, setSaved] = useState<SavedScenario[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const projected = useMemo(
    () => applySelected(baseline, selected),
    [baseline, selected]
  );

  /* ---------------------------------- */
  /* Actions */
  /* ---------------------------------- */

  function toggle(k: ImprovementKey) {
    setSelected((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function saveScenario() {
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      baseline,
      selected,
    };

    const updated = [scenario, ...saved];
    setSaved(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function loadScenario(s: SavedScenario) {
    setSelected(s.selected);
  }

  function deleteScenario(id: string) {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">
            Simulator PRO
          </div>
          <div className="text-xs text-white/60">
            Save & compare CRS scenarios
          </div>
        </div>

        <button
          onClick={saveScenario}
          className="rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save Scenario
        </button>
      </div>

      {/* Improvements */}
      <div className="mt-6 space-y-2">
        {improvements.map((imp) => {
          const active = !!selected[imp.key];

          return (
            <button
              key={imp.key}
              onClick={() => toggle(imp.key)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-indigo-400/40 bg-indigo-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {imp.label}
                </span>
                <span className="text-xs text-white/60">
                  {active ? "Selected" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Projected */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6 rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 p-5 text-white"
      >
        <div className="text-xs opacity-80">Projected CRS</div>
        <div className="text-2xl font-semibold">
          {projected.min} – {projected.max}
        </div>
      </motion.div>

      {/* Saved Scenarios */}
      {saved.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="text-sm font-semibold text-white">
            Saved Scenarios
          </div>

          {saved.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  {new Date(s.createdAt).toLocaleString()}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => loadScenario(s)}
                    className="text-xs text-indigo-300 hover:text-indigo-200"
                  >
                    Load
                  </button>

                  <button
                    onClick={() => deleteScenario(s.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
