/**
 * Row of stat cards for the current (newer) snapshot, with optional follower/following deltas.
 * Non-follower / fan / mutual deltas are deferred — not in SnapshotDiff (see Phase 4 spec note).
 */

'use client';

import { StatCard } from '@/components/shared/StatCard';
import type { SnapshotAnalysis, SnapshotDiff } from '@/types/snapshot';
import { cn } from '@/lib/utils/cn';

export interface StatsBarProps {
  analysis: SnapshotAnalysis;
  diff?: SnapshotDiff | null;
  /** Label for the older snapshot (shown on delta rows) */
  olderLabel?: string;
  className?: string;
}

export function StatsBar({
  analysis,
  diff,
  olderLabel,
  className,
}: StatsBarProps) {
  const { stats } = analysis;
  const hasDeltas = Boolean(diff && olderLabel);
  const suffix = olderLabel ? `since ${olderLabel}` : undefined;

  return (
    <section className={cn('w-full', className)} aria-label="Snapshot overview">
      <h2 className="text-lg font-semibold text-text-primary mb-3">At a glance</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Followers"
          value={stats.totalFollowers}
          delta={hasDeltas ? diff!.stats.followerChange : undefined}
          deltaSuffix={hasDeltas ? suffix : undefined}
        />
        <StatCard
          label="Following"
          value={stats.totalFollowing}
          delta={hasDeltas ? diff!.stats.followingChange : undefined}
          deltaSuffix={hasDeltas ? suffix : undefined}
        />
        <StatCard label="Non-followers" value={stats.nonFollowerCount} />
        <StatCard label="Fans" value={stats.fanCount} />
        <StatCard label="Mutuals" value={stats.mutualCount} className="col-span-2 sm:col-span-1" />
      </div>
    </section>
  );
}
