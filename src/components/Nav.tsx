"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  ["/", "Таблица"],
  ["/matches", "Матчи"],
  ["/bracket", "Плей-офф"],
  ["/players", "Игроки"],
  ["/rules", "Правила"],
  ["/stats", "О турнире"]
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="mobile-scroll -mx-4 flex items-stretch gap-1 px-4 sm:mx-0 sm:gap-5 sm:px-0">
      {nav.map(([href, label]) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "focus-ring relative flex min-h-11 shrink-0 items-center px-3 py-3 text-sm font-semibold transition-colors duration-150 sm:px-2",
              active
                ? "text-[var(--text)] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-[var(--gold)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
