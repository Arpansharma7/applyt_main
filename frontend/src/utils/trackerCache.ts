import type { TrackedApplication } from '../pages/TrackerPage';

interface CacheData {
  userId: string;
  apps: TrackedApplication[];
  timestamp: number;
}

let trackerCache: CacheData | null = null;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Retrieves cached tracker list if it matches the current user ID and has not expired.
 */
export const getCachedTrackers = (userId: string): TrackedApplication[] | null => {
  if (!trackerCache) return null;
  if (trackerCache.userId !== userId) return null;
  
  const age = Date.now() - trackerCache.timestamp;
  if (age > CACHE_TTL) {
    trackerCache = null; // Expired
    return null;
  }
  
  return trackerCache.apps;
};

/**
 * Caches the tracker list for a specific user ID with the current timestamp.
 */
export const setCachedTrackers = (userId: string, apps: TrackedApplication[]): void => {
  trackerCache = {
    userId,
    apps,
    timestamp: Date.now()
  };
};

/**
 * Invalidates the tracker cache (e.g. when a new entry is added).
 */
export const invalidateTrackerCache = (): void => {
  trackerCache = null;
};
