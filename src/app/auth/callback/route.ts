import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const baseUrl = getAuthBaseUrl({ requestOrigin: origin });
  const successDestination = `${baseUrl}${returnTo}`;
  const successResponse = NextResponse.redirect(successDestination);
  let sessionEstablished = false;
  const flowType = code ? "code" : tokenHash ? "token_hash" : "unknown";

  try {
    const supabase = createSupabaseRouteHandlerClient(request, successResponse);

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
  if (!sessionEstablished) {
    fallbackParams.set("authError", "magic_link_failed");
  }
  const finalDestination = sessionEstablished
    ? successDestination
    : `${baseUrl}/login?${fallbackParams.toString()}`;
  const cookiesAttached = successResponse.cookies.getAll().length > 0 ? "yes" : "no";

  console.log("[auth callback] flow type:", flowType);
  console.log("[auth callback] session established:", sessionEstablished);
  console.log("[auth callback] returnTo:", returnTo);
  console.log("[auth callback] cookies attached:", cookiesAttached);
  console.log("[auth callback] final redirect:", finalDestination);

  if (sessionEstablished) {
    return successResponse;
  }

  return NextResponse.redirect(finalDestination);
}
