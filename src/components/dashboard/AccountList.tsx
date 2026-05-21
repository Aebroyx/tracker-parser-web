/**
 * Sortable account list (username + timestamp) with optional collapse for long lists.
 */

'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { INSTAGRAM_BASE_URL } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';
import { ExportButton } from '@/components/shared/ExportButton';
import type { InstagramAccount } from '@/types/instagram';
import type { ExportContext } from '@/types/export';

export type AccountSortMode = 'username-asc' | 'username-desc' | 'time-desc' | 'time-asc';

export interface AccountListProps {
  accounts: InstagramAccount[];
  /** Rows before "Show all" (default 50) */
  maxVisible?: number;
  emptyMessage?: string;
  /** When set, shows an inline Export CSV button */
  exportContext?: ExportContext;
  className?: string;
}

function profileHref(acc: InstagramAccount): string {
  if (acc.profileUrl?.trim()) return acc.profileUrl;
  return `${INSTAGRAM_BASE_URL}${acc.username}/`;
}

function formatTimestamp(ts: number): string {
  if (ts <= 0) return '—';
  return new Date(ts * 1000).toLocaleString();
}

function sortAccounts(
  list: InstagramAccount[],
  mode: AccountSortMode
): InstagramAccount[] {
  const copy = [...list];
  if (mode === 'username-asc') {
    copy.sort((a, b) => a.username.localeCompare(b.username));
  } else if (mode === 'username-desc') {
    copy.sort((a, b) => b.username.localeCompare(a.username));
  } else if (mode === 'time-desc') {
    copy.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    copy.sort((a, b) => a.timestamp - b.timestamp);
  }
  return copy;
}

const SORT_OPTIONS: { value: AccountSortMode; label: string }[] = [
  { value: 'username-asc', label: 'Username A–Z' },
  { value: 'username-desc', label: 'Username Z–A' },
  { value: 'time-desc', label: 'Newest first' },
  { value: 'time-asc', label: 'Oldest first' },
];

export function AccountList({
  accounts,
  maxVisible = 50,
  emptyMessage = 'No accounts in this list.',
  exportContext,
  className,
}: AccountListProps) {
  const [sort, setSort] = useState<AccountSortMode>('username-asc');
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => sortAccounts(accounts, sort),
    [accounts, sort]
  );

  const visible = expanded ? sorted : sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;

  if (accounts.length === 0) {
    return (
      <p className="text-xs text-text-muted py-2">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs text-text-secondary flex items-center gap-1.5">
          <span className="shrink-0">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as AccountSortMode)}
            className="text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary px-2 py-1.5 min-w-40"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          {exportContext && (
            <ExportButton accounts={accounts} exportContext={exportContext} />
          )}
          <p className="text-xs text-text-muted font-mono">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="flex justify-between text-xs text-text-muted px-3 py-2 bg-bg-tertiary/50 border-b border-border-subtle">
          <span>Username</span>
          <span>Since</span>
        </div>
        <ul className="divide-y divide-border-subtle max-h-[min(60vh,28rem)] overflow-y-auto">
          {visible.map((acc) => (
            <li
              key={acc.username}
              className="flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-bg-tertiary/40 transition-colors"
            >
              <a
                href={profileHref(acc)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-text-primary truncate min-w-0 hover:text-accent-primary shrink"
              >
                @{acc.username}
              </a>
              <span className="text-xs text-text-secondary tabular-nums shrink-0 text-right max-w-[45%] sm:max-w-none">
                {formatTimestamp(acc.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-accent-primary hover:underline self-start flex items-center gap-1"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show all {sorted.length} ({hiddenCount} more)
        </button>
      )}
      {expanded && sorted.length > maxVisible && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-text-secondary hover:text-text-primary self-start flex items-center gap-1"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          Show less
        </button>
      )}
    </div>
  );
}
