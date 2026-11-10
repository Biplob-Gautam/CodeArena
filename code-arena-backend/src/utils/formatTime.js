function toSafeSeconds(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    throw new TypeError("seconds must be a finite number.");
  }

  return Math.max(0, Math.floor(seconds));
}

export function formatTime(seconds) {
  const safeSeconds = toSafeSeconds(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export function formatDuration(seconds) {
  const safeSeconds = toSafeSeconds(seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function getRemainingTime(startTime, durationSeconds, now = Date.now()) {
  const startTimestamp =
    startTime instanceof Date ? startTime.getTime() : startTime;

  if (typeof startTimestamp !== "number" || !Number.isFinite(startTimestamp)) {
    throw new TypeError("startTime must be a valid Date or millisecond timestamp.");
  }
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new TypeError("now must be a finite millisecond timestamp.");
  }

  const duration = toSafeSeconds(durationSeconds);
  const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);

  return Math.max(0, duration - Math.max(0, elapsedSeconds));
}