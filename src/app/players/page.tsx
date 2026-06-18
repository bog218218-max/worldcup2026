import { getCardsData } from "@/lib/services/cards";
import { PlayerFantasyCard } from "@/components/PlayerFantasyCard";

export const revalidate = 15;

export default async function PlayersPage() {
  const cards = await getCardsData();

  if (cards.length === 0) {
    return (
      <div className="page-shell space-y-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Игроки</h1>
          <p className="text-[var(--muted)] text-lg">
            Карточки появятся после добавления участников.
          </p>
        </div>
      </div>
    );
  }

  // Check if any player has finished predictions
  const hasFinishedPredictions = cards.some(c => c.stats.predictionCount > 0);

  return (
    <div className="page-shell space-y-6">
      <div className="mb-4 border-b border-[var(--line-soft)] pb-4">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Игроки</h1>
        <p className="mt-2 text-[var(--muted)]">
          Игровые профили, статистика и достижения участников турнира
        </p>
      </div>

      {!hasFinishedPredictions && (
        <div className="bg-[var(--panel)] border border-[var(--line-soft)] rounded-lg p-6 mb-8 text-center">
          <p className="text-[var(--muted)]">
            Статистика появится после первых завершённых матчей.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 justify-items-center mt-6">
        {cards.map((card) => (
          <PlayerFantasyCard key={card.user.slug} card={card} />
        ))}
      </div>
    </div>
  );
}
