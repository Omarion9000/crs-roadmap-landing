import Stripe from "stripe";

let stripeInstance: Stripe | null = null;
let stripeSecretSuffix: string | null = null;

export function getStripeServer() {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const nextSuffix = secret.slice(-6);

  // TEMP DEBUG: verify which runtime secret is being used on the server.
  console.log("[stripe] runtime secret suffix:", nextSuffix);

  if (!stripeInstance || stripeSecretSuffix !== nextSuffix) {
    stripeInstance = new Stripe(secret, {
      apiVersion: "2026-02-25.clover",
    });
    stripeSecretSuffix = nextSuffix;
  }

  return stripeInstance;
}
