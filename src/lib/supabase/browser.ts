import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // flowType: 'implicit' avoids PKCE — magic links send token_hash instead of
  // a code that requires the original localStorage verifier. This is critical
  // on mobile where email apps open links in a new browser context (in-app
  // browser or default browser) that doesn't share localStorage with the tab
  // that requested the link, causing exchangeCodeForSession to fail.
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit" },
  });
}