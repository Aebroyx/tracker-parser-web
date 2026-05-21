/**
 * Header export control — opens global ExportDialog when snapshots exist.
 */

'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download } from 'lucide-react';
import { db } from '@/lib/db/dexie-client';
import { ExportDialog } from '@/components/shared/ExportDialog';
import type { Snapshot } from '@/types/snapshot';

export function HeaderExportData() {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('savedAt').toArray(),
    []
  ) as Snapshot[] | undefined;

  const count = snapshots?.length ?? 0;
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-accent-primary transition-colors rounded-lg hover:bg-bg-tertiary"
        title="Export lists or snapshot backup"
      >
        <Download className="w-3.5 h-3.5" />
        Export data
      </button>

      <ExportDialog
        open={open}
        snapshots={snapshots ?? []}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
