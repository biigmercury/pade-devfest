import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Wordmark } from "@/components/Logo";
import { LiveCounters } from "@/components/LiveCounters";

export const metadata: Metadata = { title: "Live" };

async function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function LivePage() {
  const url = await appUrl();
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0a0a12", light: "#ffffff" } });
  const pretty = url.replace(/^https?:\/\//, "");

  return (
    <main className="flex min-h-dvh flex-col px-[4vw] py-[4vh]">
      <header className="flex items-center justify-between">
        <Wordmark size={64} />
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-6 py-3 text-2xl font-semibold text-muted">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green" />
          </span>
          Live at DevFest Ibadan
        </div>
      </header>

      <div className="grid flex-1 items-center gap-[4vw] py-[3vh] lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h1 className="font-display text-[clamp(3rem,7vw,8rem)] font-extrabold leading-[0.95] tracking-tight">
            Meet someone <br />
            <span className="text-grad">worth meeting.</span>
          </h1>
          <LiveCounters />
        </section>

        <aside className="flex flex-col items-center">
          <div className="rounded-[2.5rem] bg-white p-[2vw] shadow-2xl shadow-pink/20">
            <div className="aspect-square w-[min(30vw,60vh)] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
          <p className="mt-6 font-display text-[clamp(1.8rem,3vw,3.5rem)] font-extrabold">Scan to Pàdé 📱</p>
          <p className="mt-1 text-[clamp(1.2rem,1.8vw,2rem)] font-semibold text-muted">{pretty}</p>
        </aside>
      </div>
    </main>
  );
}
