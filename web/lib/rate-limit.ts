type Window = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function createRateLimiter(limit: number, windowMs: number, maxKeys = 5_000) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isFinite(windowMs) ||
    windowMs < 1 ||
    !Number.isInteger(maxKeys) ||
    maxKeys < 1
  ) {
    throw new RangeError("Rate limit, window, and key capacity must be positive values.");
  }

  const windows = new Map<string, Window>();

  return function consume(key: string, now = Date.now()): RateLimitResult {
    const normalizedKey = key.trim() || "unknown";
    let entry = windows.get(normalizedKey);

    if (!entry || entry.resetAt <= now) {
      if (windows.size >= maxKeys) {
        for (const [storedKey, storedWindow] of windows) {
          if (storedWindow.resetAt <= now) windows.delete(storedKey);
        }
      }

      if (windows.size >= maxKeys) {
        return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      }

      entry = { count: 0, resetAt: now + windowMs };
      windows.set(normalizedKey, entry);
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}
