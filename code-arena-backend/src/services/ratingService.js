import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const SCALE = 173.7178;
const TAU = 0.5;
const EPSILON = 0.000001;
const DEFAULT_RATING = 1500;
function assertPositive(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive finite number.`);
  }
}

function g(phi) {
  return 1 / Math.sqrt(1 + (3 * phi ** 2) / Math.PI ** 2);
}

function expectedScore(mu, opponentMu, opponentPhi) {
  return 1 / (1 + Math.exp(-g(opponentPhi) * (mu - opponentMu)));
}

function updateVolatility(phi, sigma, variance, delta) {
  const a = Math.log(sigma ** 2);
  const f = (x) => {
    const expX = Math.exp(x);
    const numerator = expX * (delta ** 2 - phi ** 2 - variance - expX);
    const denominator = 2 * (phi ** 2 + variance + expX) ** 2;
    return numerator / denominator - (x - a) / TAU ** 2;
  };

  let left = a;
  let right;
  if (delta ** 2 > phi ** 2 + variance) {
    right = Math.log(delta ** 2 - phi ** 2 - variance);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k += 1;
    right = a - k * TAU;
  }

  let fLeft = f(left);
  let fRight = f(right);
  let iterations = 0;
  while (Math.abs(right - left) > EPSILON && iterations < 100) {
    const next = left + ((left - right) * fLeft) / (fRight - fLeft);
    const fNext = f(next);
    if (fNext * fRight < 0) {
      left = right;
      fLeft = fRight;
    } else {
      fLeft /= 2;
    }
    right = next;
    fRight = fNext;
    iterations += 1;
  }
  if (iterations === 100) {
    throw new Error("Glicko-2 volatility calculation did not converge.");
  }
  return Math.exp(left / 2);
}

export function calculateGlicko2(player, opponent, score) {
  assertPositive(player.rating, "player.rating");
  assertPositive(player.ratingDeviation, "player.ratingDeviation");
  assertPositive(player.ratingVolatility, "player.ratingVolatility");
  assertPositive(opponent.rating, "opponent.rating");
  assertPositive(opponent.ratingDeviation, "opponent.ratingDeviation");
  assertPositive(opponent.ratingVolatility, "opponent.ratingVolatility");
  if (![0, 0.5, 1].includes(score)) {
    throw new RangeError("score must be 0 (loss), 0.5 (draw), or 1 (win).");
  }

  const mu = (player.rating - DEFAULT_RATING) / SCALE;
  const phi = player.ratingDeviation / SCALE;
  const opponentMu = (opponent.rating - DEFAULT_RATING) / SCALE;
  const opponentPhi = opponent.ratingDeviation / SCALE;
  const gOpponent = g(opponentPhi);
  const expected = expectedScore(mu, opponentMu, opponentPhi);
  const variance = 1 / (gOpponent ** 2 * expected * (1 - expected));
  const delta = variance * gOpponent * (score - expected);
  const volatility = updateVolatility(phi, player.ratingVolatility, variance, delta);
  const phiStar = Math.sqrt(phi ** 2 + volatility ** 2);
  const newPhi = 1 / Math.sqrt(1 / phiStar ** 2 + 1 / variance);
  const newMu = mu + newPhi ** 2 * gOpponent * (score - expected);

  return {
    rating: DEFAULT_RATING + SCALE * newMu,
    ratingDeviation: SCALE * newPhi,
    ratingVolatility: volatility,
    expectedScore: expected,
  };
}

export async function applyBattleRating(battleId) {
  return prisma.$transaction(
    async (tx) => {
      const battle = await tx.battle.findUnique({
        where: { id: battleId },
        include: {
          participants: { include: { user: true } },
        },
      });
      if (!battle) throw new ApiError(404, "Battle not found.");
      if (battle.status !== "COMPLETED") {
        throw new ApiError(409, "Ratings can only be updated after a battle completes.");
      }
      if (battle.participants.length !== 2) {
        throw new ApiError(409, "A rated battle must have exactly two participants.");
      }

      const [first, second] = battle.participants;
      const scoreFirst =
        first.result === "WIN" ? 1 : first.result === "LOSS" ? 0 : first.result === "DRAW" ? 0.5 : null;
      if (scoreFirst === null || !["WIN", "LOSS", "DRAW"].includes(second.result)) {
        throw new ApiError(409, "Battle participant results are incomplete.");
      }

      const existing = await tx.ratingHistory.findMany({
        where: { battleId },
        select: {
          userId: true,
          ratingBefore: true,
          ratingAfter: true,
          ratingDeviationAfter: true,
          volatilityAfter: true,
        },
      });
      if (existing.length) {
        if (existing.length !== 2) {
          throw new ApiError(409, "Battle has incomplete rating history.");
        }
        return existing.map((entry) => ({
          userId: entry.userId,
          ratingBefore: entry.ratingBefore,
          rating: entry.ratingAfter,
          ratingDeviation: entry.ratingDeviationAfter,
          ratingVolatility: entry.volatilityAfter,
          ratingChange: entry.ratingAfter - entry.ratingBefore,
        }));
      }

      const firstUpdate = calculateGlicko2(
        {
          rating: first.user.rating,
          ratingDeviation: first.user.ratingDeviation,
          ratingVolatility: first.user.ratingVolatility,
        },
        {
          rating: second.user.rating,
          ratingDeviation: second.user.ratingDeviation,
          ratingVolatility: second.user.ratingVolatility,
        },
        scoreFirst,
      );
      const secondUpdate = calculateGlicko2(
        {
          rating: second.user.rating,
          ratingDeviation: second.user.ratingDeviation,
          ratingVolatility: second.user.ratingVolatility,
        },
        {
          rating: first.user.rating,
          ratingDeviation: first.user.ratingDeviation,
          ratingVolatility: first.user.ratingVolatility,
        },
        1 - scoreFirst,
      );

      const updates = [
        { participant: first, next: firstUpdate },
        { participant: second, next: secondUpdate },
      ];
      for (const { participant, next } of updates) {
        const before = participant.user;
        const userUpdate = {
          rating: next.rating,
          ratingDeviation: next.ratingDeviation,
          ratingVolatility: next.ratingVolatility,
          bestRating: Math.max(before.bestRating, next.rating),
        };
        if (before.placementMatchesPlayed < 5) {
          userUpdate.placementMatchesPlayed = { increment: 1 };
        }
        await tx.user.update({
          where: { id: before.id },
          data: userUpdate,
        });
        await tx.battleParticipant.update({
          where: { id: participant.id },
          data: {
            ratingBefore: before.rating,
            ratingAfter: next.rating,
            ratingChange: next.rating - before.rating,
          },
        });
        await tx.ratingHistory.create({
          data: {
            userId: before.id,
            battleId,
            reason: "BATTLE_RESULT",
            ratingBefore: before.rating,
            ratingAfter: next.rating,
            ratingDeviationBefore: before.ratingDeviation,
            ratingDeviationAfter: next.ratingDeviation,
            volatilityBefore: before.ratingVolatility,
            volatilityAfter: next.ratingVolatility,
          },
        });
      }

      return updates.map(({ participant, next }) => ({
        userId: participant.userId,
        ratingBefore: participant.user.rating,
        ...next,
        ratingChange: next.rating - participant.user.rating,
      }));
    },
    { isolationLevel: "Serializable" },
  );
}

export async function getRatingHistory(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const where = { userId };
  const [total, entries] = await Promise.all([
    prisma.ratingHistory.count({ where }),
    prisma.ratingHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);
  return {
    entries,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

export default { calculateGlicko2, applyBattleRating, getRatingHistory };