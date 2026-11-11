import { randomInt } from "node:crypto";
import { prisma } from "../config/database.js";
import { selectProblem } from "../ml/mlService.js";
import ApiError from "../utils/ApiError.js";

const matchmakingLockId = 817263;
const problemShortlistSize = 30;
const maxMatchRetries = 3;

const mlTopicByProblemTag = Object.freeze({
  array: { topic: "Arrays", specificity: 0 },
  "hash-table": { topic: "Hashing", specificity: 1 },
  string: { topic: "Strings", specificity: 0 },
  stack: { topic: "Stack", specificity: 1 },
  "binary-search": { topic: "Binary Search", specificity: 1 },
  "dynamic-programming": { topic: "Dynamic Programming", specificity: 1 },
});

const matchmakingBattleInclude = {
  problem: { select: { id: true, slug: true, title: true, difficulty: true } },
  participants: {
    include: {
      user: {
        select: { id: true, username: true, displayName: true, rating: true, ratingDeviation: true },
      },
    },
  },
};

function getMlTopic(tags) {
  let selected = null;
  for (const tag of tags ?? []) {
    const mapped = mlTopicByProblemTag[tag.trim().toLowerCase()];
    if (mapped && (!selected || mapped.specificity > selected.specificity)) {
      selected = mapped;
    }
  }
  return selected?.topic ?? null;
}

function isWithinRatingRange(user, battle) {
  const opponentRating = battle.participants[0].user.rating;
  const allowedGap =
    100 +
    Math.min(
      1000,
      Math.floor((Date.now() - battle.createdAt.getTime()) / 60_000) * 25,
    ) +
    Math.min(150, Math.round(user.ratingDeviation * 0.25));
  return Math.abs(opponentRating - user.rating) <= allowedGap;
}

async function findExistingBattle(tx, userId) {
  const existing = await tx.battleParticipant.findFirst({
    where: {
      userId,
      battle: { status: { in: ["WAITING", "IN_PROGRESS"] } },
    },
    include: { battle: { include: matchmakingBattleInclude } },
  });
  if (!existing) return null;

  return {
    status: existing.battle.status === "IN_PROGRESS" ? "MATCHED" : "WAITING",
    battle: existing.battle,
  };
}

async function createWaitingBattle(tx, userId) {
  const problems = await tx.problem.findMany({
    where: { isPublished: true },
    select: { id: true, battleDurationSeconds: true },
  });
  if (!problems.length) {
    throw new ApiError(503, "No published problems are available for matchmaking.");
  }

  const problem = problems[randomInt(problems.length)];
  const battle = await tx.battle.create({
    data: {
      problemId: problem.id,
      durationSeconds: problem.battleDurationSeconds,
      participants: { create: { userId } },
    },
    include: matchmakingBattleInclude,
  });
  return { status: "WAITING", battle };
}

async function discoverMatch(user) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;

      const existing = await findExistingBattle(tx, user.id);
      if (existing) return { result: existing };

      const candidates = await tx.battle.findMany({
        where: {
          status: "WAITING",
          participants: { none: { userId: user.id } },
        },
        include: {
          participants: {
            include: { user: { select: { id: true, rating: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      const candidate = candidates
        .filter(
          (battle) =>
            battle.participants.length === 1 && isWithinRatingRange(user, battle),
        )
        .reduce((closest, battle) => {
          if (!closest) return battle;
          const gap = Math.abs(battle.participants[0].user.rating - user.rating);
          const closestGap = Math.abs(
            closest.participants[0].user.rating - user.rating,
          );
          return gap < closestGap ? battle : closest;
        }, null);

      if (!candidate) {
        return { result: await createWaitingBattle(tx, user.id) };
      }

      return {
        candidate: {
          battleId: candidate.id,
          opponentId: candidate.participants[0].user.id,
          opponentRating: candidate.participants[0].user.rating,
        },
      };
    },
    { isolationLevel: "Serializable" },
  );
}

async function requestProblemRecommendation(user, candidate) {
  try {
    const where = {
      isPublished: true,
      tags: { hasSome: Object.keys(mlTopicByProblemTag) },
    };
    const problemCount = await prisma.problem.count({ where });
    const shortlistSize = Math.min(problemShortlistSize, problemCount);
    if (!shortlistSize) {
      console.warn(
        "No published problems have an ML topic mapping; retaining the assigned problem.",
      );
      return null;
    }

    const startOffset =
      problemCount > shortlistSize ? randomInt(problemCount) : 0;
    const query = {
      where,
      select: { id: true, difficulty: true, tags: true },
      orderBy: { id: "asc" },
      skip: startOffset,
      take: shortlistSize,
    };
    const problems = await prisma.problem.findMany(query);
    if (problems.length < shortlistSize && startOffset > 0) {
      const selectedIds = new Set(problems.map((problem) => problem.id));
      const wrappedProblems = await prisma.problem.findMany({
        ...query,
        skip: 0,
        take: shortlistSize - problems.length,
      });
      problems.push(
        ...wrappedProblems.filter((problem) => !selectedIds.has(problem.id)),
      );
    }

    const candidates = problems.flatMap((problem) => {
      const topic = getMlTopic(problem.tags);
      return topic
        ? [{
            problemId: problem.id,
            difficulty: problem.difficulty,
            topic,
            acceptanceRate: 0.5,
          }]
        : [];
    });
    if (!candidates.length) {
      console.warn(
        "No published problems have an ML topic mapping; retaining the assigned problem.",
      );
      return null;
    }

    const response = await selectProblem({
      playerA: { rating: user.rating },
      playerB: { rating: candidate.opponentRating },
      candidates,
    });
    const recommendedProblemId = response?.problem?.problemId;
    if (
      typeof recommendedProblemId !== "string" ||
      !candidates.some((problem) => problem.problemId === recommendedProblemId)
    ) {
      console.warn(
        "ML problem selection returned no eligible candidate; retaining the assigned problem.",
      );
      return null;
    }
    return recommendedProblemId;
  } catch (error) {
    console.warn("ML problem selection failed; retaining the assigned problem.", error);
    return null;
  }
}

async function finalizeMatch(user, candidate, recommendedProblemId) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;

      const existing = await findExistingBattle(tx, user.id);
      if (existing) return { result: existing };

      const battle = await tx.battle.findUnique({
        where: { id: candidate.battleId },
        include: {
          participants: {
            include: { user: { select: { id: true, rating: true } } },
          },
        },
      });
      if (
        !battle ||
        battle.status !== "WAITING" ||
        battle.participants.length !== 1 ||
        battle.participants[0].user.id !== candidate.opponentId ||
        !isWithinRatingRange(user, battle)
      ) {
        return { retry: true };
      }

      let selectedProblem = null;
      if (recommendedProblemId) {
        selectedProblem = await tx.problem.findFirst({
          where: { id: recommendedProblemId, isPublished: true },
          select: { id: true, battleDurationSeconds: true },
        });
        if (!selectedProblem) {
          console.warn(
            "ML problem selection returned an unpublished problem; retaining the assigned problem.",
          );
        }
      }

      if (selectedProblem) {
        await tx.battle.update({
          where: { id: battle.id },
          data: {
            problemId: selectedProblem.id,
            durationSeconds: selectedProblem.battleDurationSeconds,
          },
        });
      }
      await tx.battleParticipant.create({
        data: { battleId: battle.id, userId: user.id },
      });
      const matchedBattle = await tx.battle.update({
        where: { id: battle.id },
        data: { status: "IN_PROGRESS", startsAt: new Date() },
        include: matchmakingBattleInclude,
      });
      return { result: { status: "MATCHED", battle: matchedBattle } };
    },
    { isolationLevel: "Serializable" },
  );
}

async function retrySerializationConflict(operation, attempts = maxMatchRetries) {
  try {
    return await operation();
  } catch (error) {
    if (error?.code !== "P2034" || attempts <= 1) throw error;
    return retrySerializationConflict(operation, attempts - 1);
  }
}

export async function findMatch(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rating: true, ratingDeviation: true, isActive: true },
  });
  if (!user || !user.isActive) throw new ApiError(401, "User account is unavailable.");

  try {
    for (let attempt = 0; attempt < maxMatchRetries; attempt += 1) {
      const discovery = await retrySerializationConflict(() =>
        discoverMatch(user),
      );
      if (discovery.result) return discovery.result;

      const recommendedProblemId = await requestProblemRecommendation(
        user,
        discovery.candidate,
      );
      const finalized = await retrySerializationConflict(() =>
        finalizeMatch(user, discovery.candidate, recommendedProblemId),
      );
      if (finalized.result) return finalized.result;
    }

    return retrySerializationConflict(() =>
      prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;
          const existing = await findExistingBattle(tx, user.id);
          return existing ?? createWaitingBattle(tx, user.id);
        },
        { isolationLevel: "Serializable" },
      ),
    );
  } catch (error) {
    if (error?.code === "P2034") {
      throw new ApiError(409, "Matchmaking is busy. Please retry.");
    }
    throw error;
  }
}

export async function cancelMatch(userId) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;
    const participant = await tx.battleParticipant.findFirst({
      where: { userId, battle: { status: "WAITING" } },
      include: { battle: { include: { participants: true } } },
    });

    if (!participant) {
      const isInBattle = await tx.battleParticipant.findFirst({
        where: { userId, battle: { status: "IN_PROGRESS" } },
        select: { id: true },
      });
      if (isInBattle) {
        throw new ApiError(409, "A match cannot be cancelled after the battle starts.");
      }
      return false;
    }

    await tx.battleParticipant.delete({ where: { id: participant.id } });
    if (participant.battle.participants.length === 1) {
      await tx.battle.delete({ where: { id: participant.battleId } });
    }
    return true;
  });
}

export default { findMatch, cancelMatch };