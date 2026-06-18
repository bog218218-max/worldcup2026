"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-5 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--red)]/10 text-[var(--red)]">
        <AlertCircle size={32} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">Что-то пошло не так</h2>
      <p className="mt-2 text-[var(--muted)] max-w-md">
        Произошла непредвиденная ошибка при загрузке страницы. Пожалуйста, попробуйте снова.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="focus-ring rounded-md bg-[var(--green)] px-6 py-3 font-semibold text-[var(--surface)] transition-opacity hover:opacity-90"
        >
          Попробовать снова
        </button>
        <Link
          href="/"
          className="focus-ring rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--line-soft)]"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
