/**
 * Chronological list of saved snapshots (oldest first).
 */

'use client';

import { useState } from 'react';
import type { Snapshot } from '@/types/snapshot';
import { formatNumber } from '@/lib/utils/formatters';
import { Pencil, Trash2, Check, X, Download } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ExportDialog } from '@/components/shared/ExportDialog';

export interface SnapshotHistoryProps {
  snapshots: Snapshot[];
  onRename: (id: number, label: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function SnapshotHistory({
  snapshots,
  onRename,
  onDelete,
}: SnapshotHistoryProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);
  const [exportSnapshotId, setExportSnapshotId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const startEdit = (s: Snapshot) => {
    if (s.id == null) return;
    setEditingId(s.id);
    setDraftLabel(s.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel('');
  };

  const commitEdit = async (id: number) => {
    await onRename(id, draftLabel);
    cancelEdit();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">Snapshot history</h2>
      <p className="text-xs text-text-secondary">
        {snapshots.length} backup{snapshots.length !== 1 ? 's' : ''} saved · oldest first
      </p>

      <ul className="flex flex-col gap-2">
        {snapshots.map((s) => {
          const id = s.id;
          if (id == null) return null;
          const f = s.data.meta.followerCount;
          const g = s.data.meta.followingCount;
          const isEditing = editingId === id;
          const isSelected = selectedId === id;

          return (
            <li
              key={id}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                isSelected
                  ? 'border-accent-primary/40 bg-bg-tertiary/50'
                  : 'border-border-subtle bg-bg-secondary/50 hover:border-border-default'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : id)}
                  className="flex-1 text-left min-w-0"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        className="flex-1 min-w-32 px-2 py-1 rounded-lg text-sm bg-bg-primary border border-border-default text-text-primary"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="p-1 rounded-lg text-accent-green hover:bg-bg-tertiary"
                        aria-label="Save label"
                        onClick={(e) => {
                          e.stopPropagation();
                          void commitEdit(id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded-lg text-text-muted hover:bg-bg-tertiary"
                        aria-label="Cancel edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-text-primary truncate">
                        {s.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Saved {new Date(s.savedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 font-mono">
                        {formatNumber(f)} followers · {formatNumber(g)} following
                      </p>
                    </>
                  )}
                </button>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-accent-primary hover:bg-bg-tertiary"
                      aria-label="Export snapshot data"
                      onClick={() => setExportSnapshotId(id)}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                      aria-label="Rename snapshot"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-accent-red hover:bg-bg-tertiary"
                      aria-label="Delete snapshot"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ExportDialog
        open={exportSnapshotId != null}
        snapshots={snapshots}
        initialSnapshotId={exportSnapshotId ?? undefined}
        onClose={() => setExportSnapshotId(null)}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete this snapshot?"
        description={
          deleteTarget
            ? `Remove “${deleteTarget.label}” from your browser. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.id != null) void onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
