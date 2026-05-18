/**
 * Diff computation hook — wraps diff.service + reactive snapshots.
 * See: docs/features/03_diff_engine.md, docs/ARCHITECTURE.md §6
 */

'use client';

import { useMemo } from 'react';
import { useSnapshots } from '@/hooks/use-snapshots';
import { analyzeSnapshot, compareSnapshots } from '@/services/diff/diff.service';
import type { Snapshot, SnapshotAnalysis, SnapshotDiff } from '@/types/snapshot';

export interface UseDiffOptions {
  olderId?: number;
  newerId?: number;
}

function isChronologicallyOrdered(older: Snapshot, newer: Snapshot): boolean {
  return new Date(older.savedAt).getTime() < new Date(newer.savedAt).getTime();
}

export function useDiff(opts?: UseDiffOptions) {
  const { snapshots, latestSnapshot } = useSnapshots();

  const { resolvedOlder, resolvedNewer } = useMemo(() => {
    if (!snapshots.length) {
      return { resolvedOlder: null as Snapshot | null, resolvedNewer: null as Snapshot | null };
    }

    const latest = snapshots[snapshots.length - 1]!;
    const previous =
      snapshots.length >= 2 ? snapshots[snapshots.length - 2]! : null;

    const hasPicker =
      opts?.olderId != null &&
      opts?.newerId != null &&
      Number.isFinite(opts.olderId) &&
      Number.isFinite(opts.newerId);

    if (hasPicker) {
      const o = snapshots.find((s) => s.id === opts!.olderId) ?? null;
      const n = snapshots.find((s) => s.id === opts!.newerId) ?? null;
      if (o && n) {
        return { resolvedOlder: o, resolvedNewer: n };
      }
      return { resolvedOlder: previous, resolvedNewer: latest };
    }

    return { resolvedOlder: previous, resolvedNewer: latest };
  }, [snapshots, opts]);

  const analysis: SnapshotAnalysis | null = useMemo(() => {
    if (!resolvedNewer) return null;
    return analyzeSnapshot(resolvedNewer);
  }, [resolvedNewer]);

  const diff: SnapshotDiff | null = useMemo(() => {
    if (!resolvedOlder || !resolvedNewer) return null;
    if (resolvedOlder.id == null || resolvedNewer.id == null) return null;
    if (resolvedOlder.id === resolvedNewer.id) return null;
    if (!isChronologicallyOrdered(resolvedOlder, resolvedNewer)) return null;
    return compareSnapshots(resolvedOlder, resolvedNewer);
  }, [resolvedOlder, resolvedNewer]);

  return {
    latest: latestSnapshot,
    older: resolvedOlder,
    newer: resolvedNewer,
    analysis,
    diff,
  };
}
