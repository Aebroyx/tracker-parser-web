/**
 * Select two snapshots to compare (older → newer). Validates chronological order.
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Snapshot } from '@/types/snapshot';

export interface SnapshotPickerValue {
  olderId?: number;
  newerId?: number;
}

export interface SnapshotPickerProps {
  snapshots: Snapshot[];
  value: SnapshotPickerValue;
  onChange: (next: SnapshotPickerValue) => void;
  className?: string;
}

function snapshotOptionLabel(s: Snapshot, index: number): string {
  const n = index + 1;
  const date = new Date(s.savedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${s.label} (${date}) [#${n}]`;
}

export function SnapshotPicker({
  snapshots,
  value,
  onChange,
  className,
}: SnapshotPickerProps) {
  const defaults = useMemo(() => {
    if (snapshots.length < 2) {
      return { olderId: undefined as number | undefined, newerId: undefined as number | undefined };
    }
    const newest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    return {
      olderId: previous?.id,
      newerId: newest?.id,
    };
  }, [snapshots]);

  const effectiveOlder = value.olderId ?? defaults.olderId;
  const effectiveNewer = value.newerId ?? defaults.newerId;

  const olderSnap = useMemo(
    () => snapshots.find((s) => s.id === effectiveOlder) ?? null,
    [snapshots, effectiveOlder]
  );
  const newerSnap = useMemo(
    () => snapshots.find((s) => s.id === effectiveNewer) ?? null,
    [snapshots, effectiveNewer]
  );

  const invalidOrder =
    olderSnap &&
    newerSnap &&
    new Date(olderSnap.savedAt).getTime() >= new Date(newerSnap.savedAt).getTime();

  const sameId =
    effectiveOlder != null &&
    effectiveNewer != null &&
    effectiveOlder === effectiveNewer;

  if (snapshots.length < 2) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Compare snapshots</h2>
        <p className="text-xs text-text-secondary mt-1">
          Default: previous backup vs latest. Choose any two backups (older → newer).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-medium text-text-secondary">Older snapshot</span>
          <Select
            value={effectiveOlder != null ? String(effectiveOlder) : undefined}
            onValueChange={(v) => {
              const id = Number(v);
              if (!Number.isFinite(id)) return;
              onChange({
                olderId: id,
                newerId: effectiveNewer ?? defaults.newerId,
              });
            }}
          >
            <SelectTrigger aria-label="Older snapshot">
              <SelectValue placeholder="Select older snapshot" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((s, i) => {
                if (s.id == null) return null;
                return (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {snapshotOptionLabel(s, i)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <span className="text-text-muted text-sm pb-2 hidden sm:inline" aria-hidden>
          →
        </span>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-medium text-text-secondary">Newer snapshot</span>
          <Select
            value={effectiveNewer != null ? String(effectiveNewer) : undefined}
            onValueChange={(v) => {
              const id = Number(v);
              if (!Number.isFinite(id)) return;
              onChange({
                newerId: id,
                olderId: effectiveOlder ?? defaults.olderId,
              });
            }}
          >
            <SelectTrigger aria-label="Newer snapshot">
              <SelectValue placeholder="Select newer snapshot" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((s, i) => {
                if (s.id == null) return null;
                return (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {snapshotOptionLabel(s, i)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(invalidOrder || sameId) && (
        <p className="text-xs text-accent-amber rounded-lg border border-accent-amber/30 bg-bg-secondary px-3 py-2">
          {sameId
            ? 'Pick two different snapshots to compare.'
            : 'The older snapshot must be saved before the newer one. Adjust your selection.'}
        </p>
      )}
    </div>
  );
}
