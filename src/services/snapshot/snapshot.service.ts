/**
 * Snapshot persistence — IndexedDB via Dexie.
 * Framework-agnostic; no React imports.
 * See: docs/features/02_snapshot_timeline.md
 */

import { db } from '@/lib/db/dexie-client';
import { MAX_SNAPSHOTS } from '@/lib/utils/constants';
import { formatSnapshotLabel } from '@/lib/utils/formatters';
import type { ParsedExport } from '@/types/instagram';
import type { Snapshot } from '@/types/snapshot';

export async function saveSnapshot(data: ParsedExport): Promise<number> {
  const now = new Date();
  const savedAt = now.toISOString();
  const label = formatSnapshotLabel(now);

  const id = await db.snapshots.add({
    data,
    savedAt,
    label,
  });

  await enforceLimit();

  return id as number;
}

export async function getAllSnapshots(): Promise<Snapshot[]> {
  return db.snapshots.orderBy('savedAt').toArray();
}

export async function getLatestSnapshot(): Promise<Snapshot | null> {
  const count = await db.snapshots.count();
  if (count === 0) return null;
  const last = await db.snapshots.orderBy('savedAt').last();
  return last ?? null;
}

export async function getSnapshotById(id: number): Promise<Snapshot | null> {
  const row = await db.snapshots.get(id);
  return row ?? null;
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.snapshots.delete(id);
}

export async function updateLabel(id: number, label: string): Promise<void> {
  const snap = await db.snapshots.get(id);
  if (!snap) return;

  const trimmed = label.trim();
  const nextLabel =
    trimmed.length > 0
      ? trimmed
      : formatSnapshotLabel(new Date(snap.savedAt));

  await db.snapshots.update(id, { label: nextLabel });
}

export async function clearAllSnapshots(): Promise<void> {
  await db.snapshots.clear();
}

export async function getSnapshotCount(): Promise<number> {
  return db.snapshots.count();
}

/**
 * If snapshot count exceeds MAX_SNAPSHOTS, delete the oldest by `savedAt`.
 * Returns the deleted snapshot, or null if no prune was needed.
 */
export async function enforceLimit(): Promise<Snapshot | null> {
  let pruned: Snapshot | null = null;

  while ((await db.snapshots.count()) > MAX_SNAPSHOTS) {
    const oldest = await db.snapshots.orderBy('savedAt').first();
    if (!oldest?.id) break;
    await db.snapshots.delete(oldest.id);
    pruned = oldest;
  }

  return pruned;
}

/**
 * True when the next save would exceed the limit (requires pruning the oldest).
 */
export async function willExceedLimit(): Promise<{
  exceeds: boolean;
  oldest: Snapshot | null;
}> {
  const count = await db.snapshots.count();
  if (count < MAX_SNAPSHOTS) {
    return { exceeds: false, oldest: null };
  }

  const oldest = await db.snapshots.orderBy('savedAt').first();
  return { exceeds: true, oldest: oldest ?? null };
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  const est = await navigator.storage.estimate();
  if (est.usage === undefined || est.quota === undefined) {
    return null;
  }
  return { usage: est.usage, quota: est.quota };
}
