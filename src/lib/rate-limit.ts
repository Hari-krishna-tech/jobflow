interface RateLimitTracker {
  timestamps: number[];
}

const trackers = new Map<string, RateLimitTracker>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupTrackers(now: number) {
  for (const [key, tracker] of trackers.entries()) {
    const latestRequest = tracker.timestamps[tracker.timestamps.length - 1];
    if (latestRequest && now - latestRequest > 10 * 60 * 1000) {
      trackers.delete(key);
    }
  }
}

/**
 * Checks if a given key has exceeded the allowed rate.
 *
 * @param key Unique identifier (e.g. user ID, IP address)
 * @param limit Maximum number of requests allowed in the interval
 * @param intervalMs Sliding window interval in milliseconds
 * @returns true if rate limited, false otherwise
 */
export function isRateLimited(
  key: string,
  limit: number,
  intervalMs: number
): boolean {
  const now = Date.now();

  // Periodic memory cleaning
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanupTrackers(now);
    lastCleanup = now;
  }

  const tracker = trackers.get(key) || { timestamps: [] };
  const windowStart = now - intervalMs;

  // Filter timestamps to only keep those within the sliding window
  const activeTimestamps = tracker.timestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= limit) {
    // Exceeded limit
    return true;
  }

  activeTimestamps.push(now);
  trackers.set(key, { timestamps: activeTimestamps });
  return false;
}
