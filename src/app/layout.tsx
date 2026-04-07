import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prave.ca";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PRAVÉ — Your Roadmap to Canadian PR",
    template: "%s — PRAVÉ",
  },
  description:
    "Simulate your CRS score, discover your highest-impact moves, and get a prioritized roadmap to Canadian permanent residence through Express Entry.",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: APP_URL,
    siteName: "PRAVÉ",
    title: "PRAVÉ — Your Roadmap to Canadian PR",
    description:
      "Simulate your CRS score and get a personalized Express Entry roadmap. See exactly what moves your score and in what order.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PRAVÉ — CRS Roadmap for Express Entry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAVÉ — Your Roadmap to Canadian PR",
    description:
      "Simulate your CRS score and get a personalized Express Entry roadmap.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#070A12]">
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <div className="flex-1 pt-20 md:pt-24">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
