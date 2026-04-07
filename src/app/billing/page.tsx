import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";
import { getStripeServer } from "@/lib/stripe";
import { t as tr, type Lang } from "@/lib/i18n/translations";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; canceled?: string }>;
}) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("crs_lang")?.value;
  const lang: Lang = langCookie === "es" ? "es" : "en";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userPlan = await getUserPlan(user.id);
  const normalizedPlan = userPlan.trim().toLowerCase();

  const resolvedSearchParams = await searchParams;
  const paymentSucceeded = resolvedSearchParams?.success === "true";
  const paymentCanceled = resolvedSearchParams?.canceled === "true";

  async function createCheckoutSession() {
    "use server";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      redirect("/login");
    }

    const priceId = process.env.STRIPE_PRICE_PRO;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!priceId) {
      throw new Error("Missing STRIPE_PRICE_PRO");
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

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a URL");
    }

    redirect(session.url);
  }

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
            {tr("billing_eyebrow", lang)}
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {tr("billing_title", lang)}
          </h1>

          <p className="mt-3 text-sm text-white/65">
            {tr("billing_logged_as", lang)} <span className="font-semibold text-white">{user.email}</span>
          </p>

          <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            {tr("billing_current_plan", lang)} {normalizedPlan}
          </div>

          {paymentSucceeded ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {tr("billing_payment_success", lang)}
            </div>
          ) : null}

          {paymentCanceled ? (
            <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              {tr("billing_payment_canceled", lang)}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {tr("billing_free_name", lang)}
              </div>
              <div className="mt-3 text-2xl font-bold">{tr("billing_free_price", lang)}</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• {tr("billing_free_f1", lang)}</li>
                <li>• {tr("billing_free_f2", lang)}</li>
                <li>• {tr("billing_free_f3", lang)}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                {tr("billing_pro_name", lang)}
              </div>
              <div className="mt-3 text-2xl font-bold">{tr("billing_pro_price", lang)}</div>
              <div className="mt-2 text-xs font-medium text-emerald-100/80">
                {tr("billing_pro_note", lang)}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li>• {tr("billing_pro_f1", lang)}</li>
                <li>• {tr("billing_pro_f2", lang)}</li>
                <li>• {tr("billing_pro_f3", lang)}</li>
                <li>• {tr("billing_pro_f4", lang)}</li>
              </ul>

              {normalizedPlan === "pro" ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                    {tr("billing_on_pro", lang)}
                  </div>

                  <form action="/api/stripe/portal" method="POST">
                    <button
                      type="submit"
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {tr("billing_manage", lang)}
                    </button>
                  </form>
                </div>
              ) : (
                <form action={createCheckoutSession}>
                  <button
                    type="submit"
                    className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    {tr("billing_upgrade", lang)}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tr("billing_back", lang)}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}