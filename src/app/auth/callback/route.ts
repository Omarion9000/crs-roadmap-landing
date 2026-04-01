import { NextResponse } from "next/server";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const params = new URLSearchParams({ continue: "1" });
  params.set("returnTo", returnTo);

  const baseUrl = getAuthBaseUrl({ requestOrigin: origin });
  const finalDestination = `${baseUrl}/login?${params.toString()}`;

  console.log("[auth callback] returnTo:", returnTo);
  console.log("[auth callback] final destination:", finalDestination);

  return NextResponse.redirect(finalDestination);
}
