import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeadRow = {
  email: string;
  approx_crs: number | null;
  worries: string | null;
  created_at: string;
};

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Missing Supabase server env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from("leads")
    .select("email, approx_crs, worries, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leads: LeadRow[] = (data ?? []) as LeadRow[];

  const totalLeads = leads.length;

  const leadsWithCRS = leads.filter((lead: LeadRow) => lead.approx_crs !== null);

  const avgCRS =
    leadsWithCRS.length > 0
      ? Math.round(
          leadsWithCRS.reduce(
            (sum: number, lead: LeadRow) => sum + (lead.approx_crs ?? 0),
            0
          ) / leadsWithCRS.length
        )
      : 0;

  const today = new Date().toISOString().slice(0, 10);

  const leadsToday = leads.filter((lead: LeadRow) =>
    lead.created_at.startsWith(today)
  ).length;

  return NextResponse.json({
    totalLeads,
    leadsToday,
    avgCRS,
    leads,
  });
}