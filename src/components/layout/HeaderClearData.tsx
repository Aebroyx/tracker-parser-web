/**
 * Clear-all-data control when snapshots exist (client-only).
 */

'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-client';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import * as snapshotService from '@/services/snapshot/snapshot.service';

export function HeaderClearData() {
  const count = useLiveQuery(() => db.snapshots.count(), []) ?? 0;
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-accent-red transition-colors rounded-lg hover:bg-bg-tertiary"
        title="Clear all stored snapshots"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Clear data
      </button>

      <ConfirmDialog
        open={open}
        title="Clear all data?"
        description="This removes every saved snapshot from this browser. This cannot be undone."
        confirmLabel="Clear everything"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          void snapshotService.clearAllSnapshots().then(() => setOpen(false));
        }}
      />
    </>
  );
}
