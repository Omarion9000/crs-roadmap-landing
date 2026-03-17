import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe";

export async function POST() {
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

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_PRICE_PRO" },
        { status: 500 }
      );
    }

    const stripe = getStripeServer();
    console.log("CHECKOUT DEBUG");
    console.log("priceId =", priceId);
    console.log("user.email =", user.email);

    const account = await stripe.accounts.retrieve();
    console.log("stripe account id =", account.id);

    const prices = await stripe.prices.list({ limit: 10 });
    console.log(
      "available price ids =",
      prices.data.map((p) => p.id)
    );

    const debugPrice = await stripe.prices.retrieve(priceId);
    console.log("debugPrice.id =", debugPrice.id);
    console.log("debugPrice.product =", debugPrice.product);

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
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        email: user.email,
        plan: "pro",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: user.email,
          plan: "pro",
        },
      },
    });

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