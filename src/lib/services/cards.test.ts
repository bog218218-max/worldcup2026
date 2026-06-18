import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCardsData } from './cards';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe('Cards Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes inactive users from cards', async () => {
    (prisma.user.findMany as any).mockResolvedValue([]);
    await getCardsData();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPaid: true })
      })
    );
  });

  it('empty state with no active users', async () => {
    (prisma.user.findMany as any).mockResolvedValue([]);
    const cards = await getCardsData();
    expect(cards.length).toBe(0);
  });

  it('novice archetype for low prediction count (<3 finished)', async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      {
        slug: 'novice-user',
        displayName: 'Novice',
        isPaid: true,
        predictions: [
          { points: 5, predHome: 1, predAway: 0, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date() } },
          { points: 2, predHome: 2, predAway: 1, resultType: 'difference', match: { status: 'finished', kickoffTime: new Date() } }
        ]
      }
    ]);
    const cards = await getCardsData();
    expect(cards[0].stats.archetypeCode).toBe('НОВ');
    expect(cards[0].stats.archetype).toBe('Новичок');
  });

  it('uses only finished matches and clamps stats within 0-99', async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      {
        slug: 'pro-user',
        displayName: 'Pro',
        isPaid: true,
        predictions: [
          { points: 1000, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date('2026-06-01') } },
          { points: 1000, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date('2026-06-02') } },
          { points: 1000, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date('2026-06-03') } },
          { points: 1000, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date('2026-06-04') } },
          { points: 1000, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'pending', kickoffTime: new Date('2026-06-05') } },
        ]
      }
    ]);

    const cards = await getCardsData();
    const stats = cards[0].stats;
    
    expect(stats.predictionCount).toBe(4);
    expect(stats.ovr).toBeLessThanOrEqual(99);
    expect(stats.ovr).toBeGreaterThanOrEqual(0);
    expect(stats.acc).toBeLessThanOrEqual(99);
    expect(stats.exa).toBeLessThanOrEqual(99);
    expect(stats.dif).toBeLessThanOrEqual(99);
    expect(stats.str).toBeLessThanOrEqual(99);
    expect(stats.rsk).toBeLessThanOrEqual(99);
    expect(stats.frm).toBeLessThanOrEqual(99);
  });
  
  it('deterministic OVR formula calculation', async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      {
        slug: 'calc-user',
        displayName: 'Calc',
        isPaid: true,
        predictions: Array(5).fill(null).map((_, i) => ({
          points: 5, predHome: 1, predAway: 1, resultType: 'exact', match: { status: 'finished', kickoffTime: new Date(`2026-06-0${i+1}`) }
        }))
      }
    ]);

    const cards = await getCardsData();
    const stats = cards[0].stats;
    
    expect(stats.ovr).toBe(99);
    expect(stats.acc).toBe(99);
    expect(stats.exa).toBe(99);
    expect(stats.dif).toBe(99);
    expect(stats.frm).toBe(99);
  });
});
