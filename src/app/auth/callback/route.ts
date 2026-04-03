import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const baseUrl = getAuthBaseUrl({ requestOrigin: origin });
  let sessionEstablished = false;

  try {
    const supabase = await createSupabaseServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      sessionEstablished = !error;

      if (error) {
        console.log("[auth callback] session exchange error:", error.message);
      }
    } else if (tokenHash && otpType) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as EmailOtpType,
      });
      sessionEstablished = !error;

      if (error) {
        console.log("[auth callback] otp verification error:", error.message);
      }
    }
  } catch (error) {
    console.log(
      "[auth callback] session establishment error:",
      error instanceof Error ? error.message : "unknown"
    );
  }

  const fallbackParams = new URLSearchParams({ returnTo });
  const finalDestination = sessionEstablished
    ? `${baseUrl}${returnTo}`
    : `${baseUrl}/login?${fallbackParams.toString()}`;

  console.log("[auth callback] session established:", sessionEstablished);
  console.log("[auth callback] returnTo:", returnTo);
  console.log("[auth callback] redirect destination:", finalDestination);

  return NextResponse.redirect(finalDestination);
}
