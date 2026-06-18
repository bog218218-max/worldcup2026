import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Nav } from "@/components/Nav";
import { AutoRefresh } from "@/components/AutoRefresh";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forecast Cup 26",
  description: "Публичный dashboard дружеского турнира прогнозов на матчи чемпионата мира",
  openGraph: {
    title: "Forecast Cup 26",
    description: "Публичный dashboard дружеского турнира прогнозов на матчи чемпионата мира",
    siteName: "Forecast Cup 26",
    locale: "ru_RU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Forecast Cup 26",
    description: "Публичный dashboard дружеского турнира прогнозов на матчи чемпионата мира"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="app-shell">
        <AutoRefresh />
        <header className="sticky top-0 z-20 border-b border-[var(--line-soft)] bg-[oklch(0.105_0.025_244/0.94)] backdrop-blur-md">
          <nav className="flex flex-col gap-3 px-5 sm:flex-row sm:items-stretch sm:justify-between">
            <div className="flex items-stretch gap-6">
              <Link href="/" className="focus-ring flex items-center gap-3 border-r border-[var(--line-soft)] py-3 pr-6">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-[oklch(0.82_0.14_84/0.35)] bg-[oklch(0.82_0.14_84/0.14)] text-[var(--gold)]">
                  <Trophy size={22} />
                </span>
                <span>
                  <span className="block text-base font-semibold text-[var(--text)]">
                    WC 2026
                  </span>
                  <span className="block text-sm text-[var(--muted)]">
                    Прогнозы
                  </span>
                </span>
              </Link>
              <Nav />
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
