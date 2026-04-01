import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CRS Roadmap",
  description: "CRS optimization platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white">
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-1 pt-24">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
