import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["600", "800"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Pàdé: meet someone worth meeting", template: "%s · Pàdé" },
  description: "Scan, pick 3 interests, and Pàdé matches you with someone worth meeting at DevFest Ibadan, with an icebreaker to start the gist.",
  applicationName: "Pàdé",
  openGraph: {
    title: "Pàdé: meet someone worth meeting",
    description: "Instant matches and funny icebreakers for DevFest Ibadan.",
    siteName: "Pàdé",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Pàdé: meet someone worth meeting" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="aura min-h-dvh font-sans">{children}</body>
    </html>
  );
}
