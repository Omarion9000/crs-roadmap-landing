import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_CALLBACK_PATH } from "@/lib/authRedirect";

export async function proxy(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const pathname = requestUrl.pathname || "/";
  const hasAuthParams =
    requestUrl.searchParams.has("code") ||
    requestUrl.searchParams.has("token_hash") ||
    requestUrl.searchParams.has("type");

  if (pathname === "/" && hasAuthParams) {
    const callbackUrl = requestUrl.clone();
    callbackUrl.pathname = AUTH_CALLBACK_PATH;

    console.log(
      "[proxy] root auth params detected, forwarding to:",
      callbackUrl.toString()
    );

    const redirectResponse = NextResponse.redirect(callbackUrl, 307);
    redirectResponse.headers.set("x-auth-recovery-proxy", "root-to-callback");
    redirectResponse.headers.set("x-auth-recovery-target", callbackUrl.pathname);
    redirectResponse.headers.set("x-auth-recovery-has-auth-params", "yes");
    return redirectResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();
  response.headers.set("x-auth-recovery-proxy", "pass-through");

  return response;
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
