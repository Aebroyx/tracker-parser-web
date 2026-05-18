/**
 * Snapshot diff engine — within-snapshot analysis and cross-snapshot comparison.
 * Pure business logic; no React. See: docs/features/03_diff_engine.md, docs/ARCHITECTURE.md §6
 */

import type { InstagramAccount } from '@/types/instagram';
import type { Snapshot, SnapshotAnalysis, SnapshotDiff } from '@/types/snapshot';

/** Build username → account map (later entry wins on duplicate username). */
function toUsernameMap(list: InstagramAccount[]): Map<string, InstagramAccount> {
  const m = new Map<string, InstagramAccount>();
  for (const acc of list) {
    m.set(acc.username, acc);
  }
  return m;
}

/**
 * Non-followers = following \ followers, fans = followers \ following, mutuals = F ∩ G.
 */
export function analyzeSnapshot(snapshot: Snapshot): SnapshotAnalysis {
  const F = toUsernameMap(snapshot.data.followers);
  const G = toUsernameMap(snapshot.data.following);

  const nonFollowers: InstagramAccount[] = [];
  for (const [u, acc] of G) {
    if (!F.has(u)) nonFollowers.push(acc);
  }

  const fans: InstagramAccount[] = [];
  const mutuals: InstagramAccount[] = [];
  for (const [u, acc] of F) {
    if (G.has(u)) {
      mutuals.push(acc);
    } else {
      fans.push(acc);
    }
  }

  return {
    nonFollowers,
    fans,
    mutuals,
    stats: {
      totalFollowers: F.size,
      totalFollowing: G.size,
      nonFollowerCount: nonFollowers.length,
      fanCount: fans.length,
      mutualCount: mutuals.length,
    },
  };
}

/**
 * Compare older vs newer snapshot (chronological: older.savedAt < newer.savedAt).
 * Requires both snapshots to have `id` set (IndexedDB rows).
 */
export function compareSnapshots(older: Snapshot, newer: Snapshot): SnapshotDiff {
  const olderId = older.id;
  const newerId = newer.id;
  if (olderId == null || newerId == null) {
    throw new Error('compareSnapshots requires snapshots with assigned ids');
  }

  const Fo = toUsernameMap(older.data.followers);
  const Fn = toUsernameMap(newer.data.followers);
  const Go = toUsernameMap(older.data.following);
  const Gn = toUsernameMap(newer.data.following);

  const gainedFollowers: InstagramAccount[] = [];
  for (const [u, acc] of Fn) {
    if (!Fo.has(u)) gainedFollowers.push(acc);
  }

  const lostFollowers: InstagramAccount[] = [];
  for (const [u, acc] of Fo) {
    if (!Fn.has(u)) lostFollowers.push(acc);
  }

  const newFollowing: InstagramAccount[] = [];
  for (const [u, acc] of Gn) {
    if (!Go.has(u)) newFollowing.push(acc);
  }

  const removedFollowing: InstagramAccount[] = [];
  for (const [u, acc] of Go) {
    if (!Gn.has(u)) removedFollowing.push(acc);
  }

  const followerChange =
    newer.data.meta.followerCount - older.data.meta.followerCount;
  const followingChange =
    newer.data.meta.followingCount - older.data.meta.followingCount;

  return {
    olderSnapshotId: olderId,
    newerSnapshotId: newerId,
    gainedFollowers,
    lostFollowers,
    newFollowing,
    removedFollowing,
    stats: {
      followerChange,
      followingChange,
      gainedCount: gainedFollowers.length,
      lostCount: lostFollowers.length,
    },
  };
}
