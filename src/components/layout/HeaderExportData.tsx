/**
 * Desktop header "Export data" control — opens the global ExportDialog.
 * Hidden when no snapshots exist. Mobile equivalent lives inside the
 * Shadcn DropdownMenu in `Header.tsx`.
 */

'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download } from 'lucide-react';
import { db } from '@/lib/db/dexie-client';
import { ExportDialog } from '@/components/shared/ExportDialog';
import { Button } from '@/components/ui/button';
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Export lists or snapshot backup"
        className="text-text-secondary hover:text-accent-primary"
      >
        <Download className="w-3.5 h-3.5" />
        Export data
      </Button>

      <ExportDialog
        open={open}
        snapshots={snapshots ?? []}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
