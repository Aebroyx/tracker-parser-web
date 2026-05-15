/**
 * Dexie.js database definition.
 * Schema only — no business logic.
 * See: docs/ARCHITECTURE.md §5
 */

import Dexie, { type Table } from 'dexie';
import type { Snapshot } from '@/types/snapshot';
import { DB_NAME } from '@/lib/utils/constants';

class TrackerDatabase extends Dexie {
  snapshots!: Table<Snapshot>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      // Indexed fields only — Dexie stores the full object regardless
      snapshots: '++id, savedAt',
    });
  }
}

/** Singleton database instance */
export const db = new TrackerDatabase();
