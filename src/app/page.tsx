import { redirect } from "next/navigation";
import { AUTH_CALLBACK_PATH } from "@/lib/authRedirect";
import PremiumHome from "@/components/home/PremiumHome";

export const dynamic = "force-dynamic";

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const code = firstQueryValue(resolvedSearchParams?.code);
  const tokenHash = firstQueryValue(resolvedSearchParams?.token_hash);
  const otpType = firstQueryValue(resolvedSearchParams?.type);
  const hasAuthParams = Boolean(code || tokenHash || otpType);

  if (hasAuthParams) {
    const forwardedParams = new URLSearchParams();

    Object.entries(resolvedSearchParams ?? {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === "string") {
            forwardedParams.append(key, entry);
          }
        });
        return;
      }

      if (typeof value === "string") {
        forwardedParams.set(key, value);
      }
    });

    const callbackTarget = forwardedParams.toString()
      ? `${AUTH_CALLBACK_PATH}?${forwardedParams.toString()}`
      : AUTH_CALLBACK_PATH;

    console.log("[home] auth params detected at root, forwarding to:", callbackTarget);
    redirect(callbackTarget);
  }

  return <PremiumHome />;
}
