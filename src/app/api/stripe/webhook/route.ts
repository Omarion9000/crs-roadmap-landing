import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type SubscriptionUpsertPayload = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
};

type SubscriptionCancelPayload = {
  status: string;
  current_period_end: string | null;
};

type SubscriptionUpdateByIdTable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
};

type SubscriptionInsertTable = {
  insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
};

type SubscriptionCancelTable = {
  update: (values: Record<string, unknown>) => {
    or: (filters: string) => Promise<{ error: Error | null }>;
  };
};

function toIsoFromUnix(value?: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  return typeof customer === "string" ? customer : customer?.id ?? null;
}

function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice & {
    subscription?: string | { id?: string } | null;
  }
) {
  return typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;
}

function getSubscriptionsUpdateTable(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  return (supabase.from("subscriptions") as unknown) as SubscriptionUpdateByIdTable;
}

function getSubscriptionsInsertTable(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  return (supabase.from("subscriptions") as unknown) as SubscriptionInsertTable;
}

function getSubscriptionsCancelTable(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  return (supabase.from("subscriptions") as unknown) as SubscriptionCancelTable;
}

async function syncSubscriptionToSupabase(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();

  const customerId = getStripeCustomerId(subscription.customer);

  const subscriptionId = subscription.id;
  const metadataUserId = subscription.metadata.user_id || null;
  const plan = subscription.metadata.plan || "pro";

  const currentPeriodEnd = toIsoFromUnix(
    (subscription as Stripe.Subscription & {
      current_period_end?: number | null;
    }).current_period_end ?? null
  );

  const { data: existingBySubscription } = await supabase
    .from("subscriptions")
    .select("id, user_id, stripe_customer_id, stripe_subscription_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle<SubscriptionRow>();

  const { data: existingByCustomer } = customerId
    ? await supabase
        .from("subscriptions")
        .select("id, user_id, stripe_customer_id, stripe_subscription_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle<SubscriptionRow>()
    : { data: null as SubscriptionRow | null };

  const resolvedUserId =
    metadataUserId ||
    existingBySubscription?.user_id ||
    existingByCustomer?.user_id;

  if (!resolvedUserId) {
    console.warn("Webhook sync skipped: no resolved user_id", {
      subscriptionId,
      customerId,
      metadata: subscription.metadata,
    });
    return;
  }

  const payload: SubscriptionUpsertPayload = {
    user_id: resolvedUserId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan,
    status: subscription.status,
    current_period_end: currentPeriodEnd,
  };

  if (existingBySubscription?.id) {
    const { error } = await getSubscriptionsUpdateTable(supabase)
      .update(payload)
      .eq("id", existingBySubscription.id);

    if (error) throw error;
    return;
  }

  if (existingByCustomer?.id) {
    const { error } = await getSubscriptionsUpdateTable(supabase)
      .update(payload)
      .eq("id", existingByCustomer.id);

    if (error) throw error;
    return;
  }

  const { error } = await getSubscriptionsInsertTable(supabase).insert(payload);

  if (error) throw error;
}

async function markSubscriptionCanceled(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();

  const customerId = getStripeCustomerId(subscription.customer);

  const payload: SubscriptionCancelPayload = {
    status: "canceled",
    current_period_end: toIsoFromUnix(
      (subscription as Stripe.Subscription & {
        current_period_end?: number | null;
      }).current_period_end ?? null
    ),
  };

  const { error } = await getSubscriptionsCancelTable(supabase)
    .update(payload)
    .or(
      [
        `stripe_subscription_id.eq.${subscription.id}`,
        customerId ? `stripe_customer_id.eq.${customerId}` : null,
      ]
        .filter(Boolean)
        .join(",")
    );

  if (error) throw error;
}

export async function POST(req: Request) {
  try {
    const stripe = getStripeServer();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { ok: false, error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const body = await req.text();

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode === "subscription" &&
          session.subscription &&
          typeof session.subscription === "string"
        ) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          await syncSubscriptionToSupabase(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToSupabase(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await markSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id?: string } | null;
        };

        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          await syncSubscriptionToSupabase(subscription);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Stripe webhook error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Webhook failed",
      },
      { status: 400 }
    );
  }
}