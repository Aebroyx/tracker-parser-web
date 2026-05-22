/**
 * Desktop header "Clear data" control — opens the destructive ConfirmDialog.
 * Hidden when no snapshots exist. Mobile equivalent lives inside the
 * Shadcn DropdownMenu in `Header.tsx`.
 */

'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { db } from '@/lib/db/dexie-client';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import * as snapshotService from '@/services/snapshot/snapshot.service';

export function HeaderClearData() {
  const count = useLiveQuery(() => db.snapshots.count(), []) ?? 0;
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Clear all stored snapshots"
        className="text-text-secondary hover:text-accent-red"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Clear data
      </Button>

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
