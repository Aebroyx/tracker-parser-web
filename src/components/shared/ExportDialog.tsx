/**
 * Global export dialog — pick snapshot(s), list type, and format.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useExport } from '@/hooks/use-export';
import {
  EXPORT_LIST_LABELS,
  isCrossSnapshotListType,
} from '@/types/export';
import { cn } from '@/lib/utils/cn';
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
      idx > 0 ? (snapshots[idx - 1]?.id ?? null) : snapshots.length >= 2
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
  ]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

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

  if (!open) return null;

  const canExport =
    format === 'json'
      ? selectedSnapshot != null
      : accounts.length > 0 &&
        selectedSnapshot != null &&
        (!needsComparison || (olderSnapshot != null && newerSnapshot != null));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-border-subtle bg-bg-secondary p-6 shadow-lg max-h-[90vh] overflow-y-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="export-dialog-title"
          className="text-lg font-semibold text-text-primary flex items-center gap-2"
        >
          <Download className="w-5 h-5 text-accent-primary" />
          Export data
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Download lists as CSV or a full snapshot backup as JSON. Files stay on
          your device only.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary">Snapshot</span>
            <select
              value={snapshotId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSnapshotId(Number.isFinite(id) ? id : null);
                if (!needsComparison) setNewerId(id);
              }}
              className="text-sm rounded-lg border border-border-default bg-bg-primary text-text-primary px-3 py-2"
            >
              {snapshots.map((s) =>
                s.id != null ? (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ) : null
              )}
            </select>
          </label>

          {needsComparison && snapshots.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-text-secondary">Older backup</span>
                <select
                  value={olderId ?? ''}
                  onChange={(e) =>
                    setOlderId(Number(e.target.value) || null)
                  }
                  className="text-sm rounded-lg border border-border-default bg-bg-primary text-text-primary px-3 py-2"
                >
                  {snapshots.map((s) =>
                    s.id != null ? (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ) : null
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-text-secondary">Newer backup</span>
                <select
                  value={newerId ?? ''}
                  onChange={(e) =>
                    setNewerId(Number(e.target.value) || null)
                  }
                  className="text-sm rounded-lg border border-border-default bg-bg-primary text-text-primary px-3 py-2"
                >
                  {snapshots.map((s) =>
                    s.id != null ? (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ) : null
                  )}
                </select>
              </label>
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

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border-default text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canExport}
            onClick={handleExport}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
