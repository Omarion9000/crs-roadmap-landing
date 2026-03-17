"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage("Check your email for the login link.");
      setEmail("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send login link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-black">Login to CRS Roadmap</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we’ll send you a magic login link.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-800">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}