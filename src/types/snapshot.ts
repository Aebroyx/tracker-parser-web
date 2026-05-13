/**
 * Snapshot and diff result types.
 * See: docs/ARCHITECTURE.md §5, §6
 */

import type { InstagramAccount, ParsedExport } from './instagram';

// ─── Snapshot (IndexedDB Record) ─────────────────────────────────────────────

export interface Snapshot {
  /** Auto-incremented primary key */
  id?: number;
  /** The parsed export data */
  data: ParsedExport;
  /** ISO 8601 timestamp when the snapshot was saved */
  savedAt: string;
  /** Auto-generated label from save date (e.g., "May 13, 2026"). User can edit later. */
  label: string;
}

// ─── Within-Snapshot Analysis ────────────────────────────────────────────────

/** Analysis of a single snapshot */
export interface SnapshotAnalysis {
  /** Accounts you follow that don't follow you back */
  nonFollowers: InstagramAccount[];
  /** Accounts that follow you but you don't follow back */
  fans: InstagramAccount[];
  /** Accounts in both followers and following */
  mutuals: InstagramAccount[];

  stats: {
    totalFollowers: number;
    totalFollowing: number;
    nonFollowerCount: number;
    fanCount: number;
    mutualCount: number;
  };
}

// ─── Cross-Snapshot Diff ─────────────────────────────────────────────────────

/** Comparison between two snapshots (older vs newer) */
export interface SnapshotDiff {
  /** Snapshot IDs being compared */
  olderSnapshotId: number;
  newerSnapshotId: number;
  /** New followers since older snapshot */
  gainedFollowers: InstagramAccount[];
  /** Lost followers since older snapshot (unfollowers) */
  lostFollowers: InstagramAccount[];
  /** New accounts you started following */
  newFollowing: InstagramAccount[];
  /** Accounts you unfollowed */
  removedFollowing: InstagramAccount[];

  stats: {
    followerChange: number;   // positive = gained, negative = lost
    followingChange: number;
    gainedCount: number;
    lostCount: number;
  };
}
