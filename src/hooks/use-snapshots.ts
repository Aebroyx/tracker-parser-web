/**
 * Reactive snapshot queries and actions (Dexie liveQuery).
 * See: docs/features/02_snapshot_timeline.md §4.2
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-client';
import type { ParsedExport } from '@/types/instagram';
import type { Snapshot } from '@/types/snapshot';
import * as snapshotService from '@/services/snapshot/snapshot.service';

export function useSnapshots() {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('savedAt').toArray(),
    []
  ) as Snapshot[] | undefined;

  const snapshotCount = snapshots?.length ?? 0;
  const isLoading = snapshots === undefined;

  const latestSnapshot = useMemo(() => {
    if (!snapshots?.length) return null;
    return snapshots[snapshots.length - 1];
  }, [snapshots]);

  const [storage, setStorage] = useState<{
    usage: number;
    quota: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void snapshotService.getStorageEstimate().then((est) => {
      if (!cancelled) setStorage(est);
    });
    return () => {
      cancelled = true;
    };
  }, [snapshotCount]);

  const save = useCallback(async (data: ParsedExport) => {
    return snapshotService.saveSnapshot(data);
  }, []);

  const rename = useCallback(async (id: number, label: string) => {
    await snapshotService.updateLabel(id, label);
  }, []);

  const remove = useCallback(async (id: number) => {
    await snapshotService.deleteSnapshot(id);
  }, []);

  const clearAll = useCallback(async () => {
    await snapshotService.clearAllSnapshots();
  }, []);

  return {
    snapshots: snapshots ?? [],
    latestSnapshot,
    snapshotCount,
    isLoading,
    storage,
    save,
    rename,
    remove,
    clearAll,
    willExceedLimit: snapshotService.willExceedLimit,
  };
}
