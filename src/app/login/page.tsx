import { Suspense } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#060914] text-white">
          <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] px-6 py-5 text-sm text-white/64 backdrop-blur-xl">
              Loading secure access...
            </div>
          </div>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
