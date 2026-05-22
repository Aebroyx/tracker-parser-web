/**
 * Global export dialog — pick snapshot(s), list type, and format.
 *
 * Built on the Shadcn Dialog + Select + Button primitives
 * (`src/components/ui/{dialog,select,button}.tsx`).
 *
 * See: docs/features/05_data_management.md and
 *      docs/DESIGN_LANGUAGE.md §5.2.1 (Dialog) / §5.3.1 (Select).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useExport } from '@/hooks/use-export';
import {
  EXPORT_LIST_LABELS,
  isCrossSnapshotListType,
} from '@/types/export';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Snapshot } from '@/types/snapshot';
import type { ExportFormat, ExportListType } from '@/types/export';

const ALL_LIST_TYPES = Object.keys(EXPORT_LIST_LABELS) as ExportListType[];

export interface ExportDialogProps {
  open: boolean;
  snapshots: Snapshot[];
  /** Pre-select snapshot id when opened from SnapshotHistory */
  initialSnapshotId?: number;
  onClose: () => void;
}

export function ExportDialog({
  open,
  snapshots,
  initialSnapshotId,
  onClose,
}: ExportDialogProps) {
  const { exportAccountsAsCsv, exportSnapshotAsJson, resolveAccounts } =
    useExport();

  const defaultSnapshotId = useMemo(() => {
    if (initialSnapshotId != null) {
      const found = snapshots.find((s) => s.id === initialSnapshotId);
      if (found?.id != null) return found.id;
    }
    const latest = snapshots[snapshots.length - 1];
    return latest?.id ?? null;
  }, [snapshots, initialSnapshotId]);

  const [snapshotId, setSnapshotId] = useState<number | null>(null);
  const [olderId, setOlderId] = useState<number | null>(null);
  const [newerId, setNewerId] = useState<number | null>(null);
  const [listType, setListType] = useState<ExportListType>('non-followers');
  const [format, setFormat] = useState<ExportFormat>('csv');

  useEffect(() => {
    if (!open) return;
    setSnapshotId(defaultSnapshotId);
    const idx = snapshots.findIndex((s) => s.id === defaultSnapshotId);
    const older =
      idx > 0
        ? (snapshots[idx - 1]?.id ?? null)
        : snapshots.length >= 2
          ? (snapshots[snapshots.length - 2]?.id ?? null)
          : null;
    setOlderId(older);
    setNewerId(defaultSnapshotId);
    setListType('non-followers');
    setFormat('csv');
  }, [open, defaultSnapshotId, snapshots]);

  const selectedSnapshot = useMemo(
    () => snapshots.find((s) => s.id === snapshotId) ?? null,
    [snapshots, snapshotId]
  );

  const olderSnapshot = useMemo(
    () => snapshots.find((s) => s.id === olderId) ?? null,
    [snapshots, olderId]
  );

  const newerSnapshot = useMemo(
    () => snapshots.find((s) => s.id === newerId) ?? null,
    [snapshots, newerId]
  );

  const needsComparison = isCrossSnapshotListType(listType);

  const accounts = useMemo(() => {
    if (!selectedSnapshot) return [];
    return resolveAccounts({
      listType,
      snapshot: selectedSnapshot,
      olderSnapshot: needsComparison ? olderSnapshot : null,
      newerSnapshot: needsComparison ? newerSnapshot : selectedSnapshot,
    });
  }, [
    listType,
    selectedSnapshot,
    olderSnapshot,
    newerSnapshot,
    needsComparison,
    resolveAccounts,
  ]);

  const handleExport = () => {
    if (!selectedSnapshot) return;

    if (format === 'json') {
      exportSnapshotAsJson(selectedSnapshot);
      onClose();
      return;
    }

    exportAccountsAsCsv(accounts, {
      listType,
      snapshotLabel: needsComparison
        ? olderSnapshot?.label
        : selectedSnapshot.label,
      comparisonLabel: needsComparison ? newerSnapshot?.label : undefined,
    });
    onClose();
  };

  const canExport =
    format === 'json'
      ? selectedSnapshot != null
      : accounts.length > 0 &&
        selectedSnapshot != null &&
        (!needsComparison || (olderSnapshot != null && newerSnapshot != null));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-accent-primary" />
            Export data
          </DialogTitle>
          <DialogDescription>
            Download lists as CSV or a full snapshot backup as JSON. Files stay
            on your device only.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary">Snapshot</span>
            <Select
              value={snapshotId != null ? String(snapshotId) : undefined}
              onValueChange={(v) => {
                const id = Number(v);
                if (!Number.isFinite(id)) return;
                setSnapshotId(id);
                if (!needsComparison) setNewerId(id);
              }}
            >
              <SelectTrigger aria-label="Snapshot">
                <SelectValue placeholder="Select snapshot" />
              </SelectTrigger>
              <SelectContent>
                {snapshots.map((s) =>
                  s.id != null ? (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ) : null
                )}
              </SelectContent>
            </Select>
          </div>

          {needsComparison && snapshots.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-text-secondary">Older backup</span>
                <Select
                  value={olderId != null ? String(olderId) : undefined}
                  onValueChange={(v) => setOlderId(Number(v) || null)}
                >
                  <SelectTrigger aria-label="Older backup">
                    <SelectValue placeholder="Select older backup" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.map((s) =>
                      s.id != null ? (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-text-secondary">Newer backup</span>
                <Select
                  value={newerId != null ? String(newerId) : undefined}
                  onValueChange={(v) => setNewerId(Number(v) || null)}
                >
                  <SelectTrigger aria-label="Newer backup">
                    <SelectValue placeholder="Select newer backup" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.map((s) =>
                      s.id != null ? (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs text-text-secondary mb-1">List to export</legend>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg border border-border-subtle p-2">
              {ALL_LIST_TYPES.map((type) => {
                const cross = isCrossSnapshotListType(type);
                const disabled = cross && snapshots.length < 2;
                return (
                  <label
                    key={type}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer',
                      disabled && 'opacity-40 cursor-not-allowed',
                      listType === type && 'bg-bg-tertiary'
                    )}
                  >
                    <input
                      type="radio"
                      name="export-list"
                      value={type}
                      checked={listType === type}
                      disabled={disabled}
                      onChange={() => {
                        setListType(type);
                        if (type === 'all-followers' || type === 'all-following') {
                          setFormat('csv');
                        }
                      }}
                      className="accent-accent-primary"
                    />
                    <span className="text-text-primary">
                      {EXPORT_LIST_LABELS[type]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs text-text-secondary mb-1">Format</legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="accent-accent-primary"
                />
                CSV (account list)
              </label>
              <label
                className={cn(
                  'flex items-center gap-2 text-sm',
                  listType !== 'all-followers' &&
                    listType !== 'all-following' &&
                    'opacity-60'
                )}
              >
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                  className="accent-accent-primary"
                />
                JSON (full snapshot backup)
              </label>
            </div>
            {format === 'json' && (
              <p className="text-xs text-text-muted">
                Exports the complete parsed snapshot for archival. Re-import is
                not supported yet.
              </p>
            )}
          </fieldset>

          {format === 'csv' && (
            <p className="text-xs text-text-muted font-mono">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} ready
              to export
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!canExport}
            onClick={handleExport}
          >
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
