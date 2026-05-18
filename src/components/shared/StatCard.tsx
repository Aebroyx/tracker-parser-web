/**
 * Single metric card — per docs/DESIGN_LANGUAGE.md §5.5, docs/ARCHITECTURE.md §2
 */

'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatChange, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  label: string;
  value: number;
  /** Optional delta vs comparison snapshot (followers / following only in Phase 4) */
  delta?: number;
  /** e.g. "since May 10" */
  deltaSuffix?: string;
  tone?: 'default' | 'positive' | 'negative';
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix,
  tone = 'default',
  className,
}: StatCardProps) {
  const showDelta = delta !== undefined && Number.isFinite(delta);
  const deltaPositive = showDelta && delta > 0;
  const deltaNegative = showDelta && delta < 0;
  const effectiveTone =
    tone === 'default' && showDelta
      ? deltaPositive
        ? 'positive'
        : deltaNegative
          ? 'negative'
          : 'default'
      : tone;

  return (
    <div
      className={cn(
        'rounded-xl border border-border-subtle p-4 min-w-0',
        'bg-bg-secondary/80',
        '[background-image:var(--gradient-stat)]',
        className
      )}
    >
      <p className="text-xs text-text-secondary font-medium leading-tight">{label}</p>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums font-mono text-text-primary tracking-tight"
        aria-label={`${label}: ${formatNumber(value)}`}
      >
        {formatNumber(value)}
      </p>
      {showDelta && (
        <p
          className={cn(
            'mt-2 flex items-center gap-1.5 text-xs font-medium',
            effectiveTone === 'positive' && 'text-accent-green',
            effectiveTone === 'negative' && 'text-accent-red',
            effectiveTone === 'default' && 'text-text-muted'
          )}
        >
          {deltaPositive ? (
            <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : deltaNegative ? (
            <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden />
          )}
          <span className="tabular-nums">{formatChange(delta!)}</span>
          {deltaSuffix ? (
            <span className="font-normal text-text-muted truncate">{deltaSuffix}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}
