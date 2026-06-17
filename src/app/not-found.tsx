import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8">
      <h1 className="text-3xl font-semibold">Не найдено</h1>
      <p className="mt-3 text-[var(--muted)]">Такой страницы, матча или игрока нет.</p>
      <Link href="/" className="mt-5 inline-flex rounded-md bg-[var(--green)] px-4 py-2 font-semibold text-[var(--bg)]">
        На главную
      </Link>
    </section>
  );
}
