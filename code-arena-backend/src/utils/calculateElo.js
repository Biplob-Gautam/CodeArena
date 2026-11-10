function assertFiniteNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
}

export function calculateElo(ratingA, ratingB, scoreA, kFactor = 32) {
  assertFiniteNumber(ratingA, "ratingA");
  assertFiniteNumber(ratingB, "ratingB");
  assertFiniteNumber(scoreA, "scoreA");
  assertFiniteNumber(kFactor, "kFactor");

  if (![0, 0.5, 1].includes(scoreA)) {
    throw new RangeError("scoreA must be 0 (loss), 0.5 (draw), or 1 (win).");
  }
  if (kFactor <= 0) {
    throw new RangeError("kFactor must be greater than zero.");
  }

  const expectedScoreA =
    1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const expectedScoreB = 1 - expectedScoreA;
  const changeA = kFactor * (scoreA - expectedScoreA);
  const changeB = -changeA;

  return {
    ratingA: ratingA + changeA,
    ratingB: ratingB + changeB,
    expectedScoreA,
    expectedScoreB,
    changeA,
    changeB,
  };
}

export default calculateElo;