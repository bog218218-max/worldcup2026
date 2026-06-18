import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TelegramCta } from "@/components/TelegramCta";
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
          <nav className="px-4 sm:px-5">
            <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-6">
              <Link href="/" className="focus-ring flex min-h-14 items-center gap-3 border-b border-[var(--line-soft)] py-3 sm:border-b-0 sm:border-r sm:pr-6">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--line-soft)] shadow-sm">
                  <img src="/icon.png" alt="Logo" className="h-full w-full object-cover" />
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
              <div className="flex flex-1 flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-0">
                <Nav />
                <div className="hidden shrink-0 items-center gap-3 lg:flex">
                  <TelegramCta compact />
                </div>
              </div>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
