/**
 * Within-snapshot analysis: non-followers, fans, mutuals (tabbed).
 */

'use client';

import { useState } from 'react';
import { AccountList } from '@/components/dashboard/AccountList';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import type { ExportListType } from '@/types/export';
import type { SnapshotAnalysis } from '@/types/snapshot';

export type AnalysisTab = 'nonFollowers' | 'fans' | 'mutuals';

function tabToListType(tab: AnalysisTab): ExportListType {
  switch (tab) {
    case 'nonFollowers':
      return 'non-followers';
    case 'fans':
      return 'fans';
    case 'mutuals':
      return 'mutuals';
  }
}

export interface AnalysisPanelProps {
  analysis: SnapshotAnalysis;
  /** Label for the snapshot shown (e.g. backup date label) */
  snapshotLabel?: string;
  className?: string;
}

const TABS: { id: AnalysisTab; label: string; count: (a: SnapshotAnalysis) => number }[] = [
  { id: 'nonFollowers', label: "Don't follow back", count: (a) => a.stats.nonFollowerCount },
  { id: 'fans', label: 'Fans', count: (a) => a.stats.fanCount },
  { id: 'mutuals', label: 'Mutuals', count: (a) => a.stats.mutualCount },
];

export function AnalysisPanel({
  analysis,
  snapshotLabel,
  className,
}: AnalysisPanelProps) {
  const [tab, setTab] = useState<AnalysisTab>('nonFollowers');

  const listForTab = () => {
    switch (tab) {
      case 'nonFollowers':
        return analysis.nonFollowers;
      case 'fans':
        return analysis.fans;
      case 'mutuals':
        return analysis.mutuals;
    }
  };

  const emptyForTab = () => {
    switch (tab) {
      case 'nonFollowers':
        return 'Everyone who follows you also follows back — or you follow no one outside your followers.';
      case 'fans':
        return 'No accounts follow you without you following back.';
      case 'mutuals':
        return 'No mutual follows found.';
    }
  };

  return (
    <section className={cn('flex flex-col gap-4 w-full', className)}>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          Current snapshot
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          {snapshotLabel ? (
            <>
              Based on{' '}
              <span className="font-medium text-text-primary">{snapshotLabel}</span>
              {' · '}
            </>
          ) : null}
          {formatNumber(analysis.stats.totalFollowers)} followers ·{' '}
          {formatNumber(analysis.stats.totalFollowing)} following
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analysis categories">
        {TABS.map((t) => {
          const active = tab === t.id;
          const c = t.count(analysis);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                active
                  ? 'border-accent-primary/50 bg-bg-tertiary text-text-primary'
                  : 'border-border-subtle text-text-secondary hover:border-border-default hover:bg-bg-tertiary/50'
              )}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums text-text-muted">({formatNumber(c)})</span>
            </button>
          );
        })}
      </div>

      <AccountList
        accounts={listForTab()}
        emptyMessage={emptyForTab()}
        maxVisible={50}
        exportContext={{
          listType: tabToListType(tab),
          snapshotLabel,
        }}
      />
    </section>
  );
}
