/**
 * Cross-snapshot diff summary (minimal Phase 3 diff card).
 */

'use client';

import type { ReactNode } from 'react';
import { AccountList } from '@/components/dashboard/AccountList';
import { formatChange, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import type { SnapshotDiff } from '@/types/snapshot';

export interface DiffSummaryProps {
  diff: SnapshotDiff;
  olderLabel: string;
  newerLabel: string;
  className?: string;
}

export function DiffSummary({
  diff,
  olderLabel,
  newerLabel,
  className,
}: DiffSummaryProps) {
  const { stats } = diff;

  return (
    <section
      className={cn(
        'w-full rounded-xl border border-border-subtle bg-bg-secondary/50 p-4 flex flex-col gap-4',
        className
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Changes between backups</h2>
        <p className="text-xs text-text-secondary mt-1">
          Comparing{' '}
          <span className="font-medium text-text-primary">{olderLabel}</span>
          {' → '}
          <span className="font-medium text-text-primary">{newerLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-baseline gap-2 rounded-lg border border-border-subtle bg-bg-primary/50 px-3 py-2">
          <span className="text-text-secondary">Followers</span>
          <span
            className={cn(
              'font-mono tabular-nums',
              stats.followerChange > 0 && 'text-accent-green',
              stats.followerChange < 0 && 'text-accent-red',
              stats.followerChange === 0 && 'text-text-primary'
            )}
          >
            {formatChange(stats.followerChange)}
          </span>
          <span className="text-xs text-text-muted">
            ({formatNumber(diff.gainedFollowers.length)} gained ·{' '}
            {formatNumber(diff.lostFollowers.length)} lost)
          </span>
        </div>
        <div className="flex items-baseline gap-2 rounded-lg border border-border-subtle bg-bg-primary/50 px-3 py-2">
          <span className="text-text-secondary">Following</span>
          <span
            className={cn(
              'font-mono tabular-nums',
              stats.followingChange > 0 && 'text-accent-green',
              stats.followingChange < 0 && 'text-accent-red',
              stats.followingChange === 0 && 'text-text-primary'
            )}
          >
            {formatChange(stats.followingChange)}
          </span>
          <span className="text-xs text-text-muted">
            ({formatNumber(diff.newFollowing.length)} new ·{' '}
            {formatNumber(diff.removedFollowing.length)} removed)
          </span>
        </div>
      </div>

      <p className="text-xs text-text-secondary">
        <span className="text-accent-green font-medium">
          +{formatNumber(stats.gainedCount)}
        </span>{' '}
        new followers,{' '}
        <span className="text-accent-red font-medium">
          −{formatNumber(stats.lostCount)}
        </span>{' '}
        unfollowers (by list difference)
      </p>

      <div className="flex flex-col gap-2">
        <DiffFold title={`Gained followers (${formatNumber(diff.gainedFollowers.length)})`}>
          <AccountList
            accounts={diff.gainedFollowers}
            emptyMessage="No new followers in this range."
            maxVisible={30}
            exportContext={{
              listType: 'gained-followers',
              snapshotLabel: olderLabel,
              comparisonLabel: newerLabel,
            }}
          />
        </DiffFold>
        <DiffFold title={`Lost followers (${formatNumber(diff.lostFollowers.length)})`}>
          <AccountList
            accounts={diff.lostFollowers}
            emptyMessage="No one unfollowed in this range."
            maxVisible={30}
            exportContext={{
              listType: 'lost-followers',
              snapshotLabel: olderLabel,
              comparisonLabel: newerLabel,
            }}
          />
        </DiffFold>
        <DiffFold title={`New following (${formatNumber(diff.newFollowing.length)})`}>
          <AccountList
            accounts={diff.newFollowing}
            emptyMessage="You didn’t follow anyone new in this range."
            maxVisible={30}
            exportContext={{
              listType: 'new-following',
              snapshotLabel: olderLabel,
              comparisonLabel: newerLabel,
            }}
          />
        </DiffFold>
        <DiffFold title={`Removed following (${formatNumber(diff.removedFollowing.length)})`}>
          <AccountList
            accounts={diff.removedFollowing}
            emptyMessage="You didn’t unfollow anyone in this range."
            maxVisible={30}
            exportContext={{
              listType: 'removed-following',
              snapshotLabel: olderLabel,
              comparisonLabel: newerLabel,
            }}
          />
        </DiffFold>
      </div>
    </section>
  );
}

function DiffFold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-border-subtle bg-bg-primary/30 open:bg-bg-primary/50">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-text-primary flex items-center justify-between gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-xs text-text-muted group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="px-3 pb-3 pt-1 border-t border-border-subtle">{children}</div>
    </details>
  );
}
