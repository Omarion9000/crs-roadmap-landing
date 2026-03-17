"use client";

import { useEffect, useState } from "react";

type LeadItem = {
  email: string;
  approx_crs: number | null;
  worries: string | null;
  created_at: string;
};

type AdminStats = {
  totalLeads: number;
  leadsToday: number;
  avgCRS: number;
  leads: LeadItem[];
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = (await res.json()) as AdminStats | { error?: string };

        if (!res.ok) {
          throw new Error("error" in data ? data.error || "Failed to load stats" : "Failed to load stats");
        }

        setStats(data as AdminStats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    }

    loadStats();
  }, []);

  if (error) {
    return <div className="p-10 text-red-600">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="p-10">Loading analytics...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-10">
      <h1 className="mb-8 text-3xl font-bold">CRS Roadmap Analytics</h1>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Leads Today</p>
          <p className="text-2xl font-bold">{stats.leadsToday}</p>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-gray-500">Avg CRS</p>
          <p className="text-2xl font-bold">{stats.avgCRS}</p>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Recent Leads</h2>

      <div className="space-y-4">
        {stats.leads.map((lead: LeadItem) => (
          <div key={`${lead.email}-${lead.created_at}`} className="rounded-lg border p-4">
            <p className="font-medium">{lead.email}</p>

            {lead.approx_crs !== null && (
              <p className="text-sm text-gray-500">CRS: {lead.approx_crs}</p>
            )}

            {lead.worries && <p className="mt-2 text-sm">{lead.worries}</p>}

            <p className="mt-2 text-xs text-gray-400">{lead.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}