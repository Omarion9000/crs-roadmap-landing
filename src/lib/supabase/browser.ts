import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // @supabase/ssr always forces flowType:'pkce' regardless of options passed here
  // (it spreads our auth options first, then hardcodes flowType:"pkce" after).
  // PKCE works correctly across tabs because @supabase/ssr stores the
  // code_verifier in a cookie (not localStorage), which persists after
  // navigation. iOS webview cross-browser failure is handled separately in
  // the /auth/callback page component via UA detection.
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}