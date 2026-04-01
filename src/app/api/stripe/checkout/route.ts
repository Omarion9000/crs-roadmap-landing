import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe";
import { buildPostUpgradeHref, type UpgradeUnlock } from "@/lib/upgrade";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_PRO;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const body = (await req.json().catch(() => null)) as
      | { returnTo?: string; unlock?: UpgradeUnlock }
      | null;
    const returnTo = typeof body?.returnTo === "string" ? body.returnTo : null;
    const unlock = body?.unlock ?? "pro";
    const successPath = buildPostUpgradeHref(returnTo, unlock);
    const cancelParams = new URLSearchParams({ canceled: "true" });

    if (returnTo) {
      cancelParams.set("returnTo", returnTo);
    }

    if (unlock) {
      cancelParams.set("unlock", unlock);
    }

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_PRICE_PRO" },
        { status: 500 }
      );
    }

    const stripe = getStripeServer();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}/billing?${cancelParams.toString()}`,
      metadata: {
        user_id: user.id,
        email: user.email,
        plan: "pro",
        unlock,
        return_to: returnTo ?? "",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: user.email,
          plan: "pro",
          unlock,
          return_to: returnTo ?? "",
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a URL");
    }

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
