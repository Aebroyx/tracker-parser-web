/**
 * Phase 4: cross-snapshot changes — StatsBar (with deltas) + DiffSummary lists.
 */

'use client';

import { StatsBar } from '@/components/dashboard/StatsBar';
import { DiffSummary } from '@/components/dashboard/DiffSummary';
import type { SnapshotAnalysis, SnapshotDiff } from '@/types/snapshot';
import { cn } from '@/lib/utils/cn';

export interface DiffCardProps {
  analysis: SnapshotAnalysis;
  diff: SnapshotDiff;
  olderLabel: string;
  newerLabel: string;
  className?: string;
}

export function DiffCard({
  analysis,
  diff,
  olderLabel,
  newerLabel,
  className,
}: DiffCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border-subtle bg-bg-secondary/40 p-4 flex flex-col gap-6',
        className
      )}
    >
      <StatsBar
        analysis={analysis}
        diff={diff}
        olderLabel={olderLabel}
      />
      <DiffSummary
        diff={diff}
        olderLabel={olderLabel}
        newerLabel={newerLabel}
        className="border-0 bg-transparent p-0"
      />
    </div>
  );
}
