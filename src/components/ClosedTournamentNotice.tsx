export function ClosedTournamentNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "max-w-sm text-xs leading-5 text-[var(--muted)]" : "panel-muted rounded-lg p-4 text-sm leading-6 text-[var(--muted)]"}>
      <p>Турнир закрытый. Доступ к прогнозам есть только у участников, которых добавил админ.</p>
      <p className="mt-1 text-[var(--text)]">Если ты уже участник, открой бота и используй /matches.</p>
    </div>
  );
}
