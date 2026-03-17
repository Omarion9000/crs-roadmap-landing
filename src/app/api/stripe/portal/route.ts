import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe";

type SubscriptionRow = {
  stripe_customer_id: string | null;
  plan?: string | null;
  status?: string | null;
};

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, plan, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const subscription = data as SubscriptionRow | null;

    if (subscriptionError) {
      return NextResponse.json(
        { ok: false, error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { ok: false, error: "No Stripe customer found for this user" },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });

    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: "Stripe portal session did not return a URL" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to create portal session",
      },
      { status: 500 }
    );
  }
}