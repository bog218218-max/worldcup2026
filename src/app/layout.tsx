import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Турнир прогнозов",
  description: "Публичный dashboard дружеского турнира прогнозов на матчи чемпионата мира"
};

const nav = [
  ["/", "Главная"],
  ["/leaderboard", "Лидеры"],
  ["/matches", "Матчи"],
  ["/players", "Игроки"],
  ["/stats", "Статистика"],
  ["/rules", "Правила"]
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[oklch(0.155_0.018_205/0.88)] backdrop-blur">
          <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <Link href="/" className="focus-ring flex items-center gap-3 rounded-sm">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--green)] text-lg text-[var(--bg)]">
                ⚽
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  World Cup
                </span>
                <span className="block text-lg font-semibold">Прогнозы друзей</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-1">
              {nav.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="focus-ring rounded-md px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
