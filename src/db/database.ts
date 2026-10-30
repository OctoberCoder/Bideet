import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { Auction } from '../types/auction';

/**
 * Local cache only — never the source of truth. Auctions, bids and funds
 * always come from the server; this exists purely so the auction list/detail
 * screens can render instantly and work offline-for-reading.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    throw new Error('SQLite cache is not available on web; caller should skip it there');
  }
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('bideet.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS auctions_cache (
          id TEXT PRIMARY KEY NOT NULL,
          category TEXT,
          status TEXT,
          start_time TEXT,
          cached_at INTEGER NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_auctions_cache_category ON auctions_cache(category);
        CREATE INDEX IF NOT EXISTS idx_auctions_cache_status ON auctions_cache(status);
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function cacheAuctions(auctions: Auction[]): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const auction of auctions) {
      await db.runAsync(
        `INSERT INTO auctions_cache (id, category, status, start_time, cached_at, payload)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           category = excluded.category,
           status = excluded.status,
           start_time = excluded.start_time,
           cached_at = excluded.cached_at,
           payload = excluded.payload`,
        [auction.id, auction.category, auction.status, auction.startTime, now, JSON.stringify(auction)],
      );
    }
  });
}

export async function cacheAuction(auction: Auction): Promise<void> {
  await cacheAuctions([auction]);
}

export async function getCachedAuctions(): Promise<Auction[]> {
  if (Platform.OS === 'web') return [];
  const db = await getDb();
  const rows = await db.getAllAsync<{ payload: string }>(
    'SELECT payload FROM auctions_cache ORDER BY start_time ASC',
  );
  return rows.map((row) => JSON.parse(row.payload) as Auction);
}

export async function getCachedAuction(id: string): Promise<Auction | null> {
  if (Platform.OS === 'web') return null;
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM auctions_cache WHERE id = ?',
    [id],
  );
  return row ? (JSON.parse(row.payload) as Auction) : null;
}

export async function clearStaleCache(olderThanMs: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getDb();
  await db.runAsync('DELETE FROM auctions_cache WHERE cached_at < ?', [Date.now() - olderThanMs]);
}
