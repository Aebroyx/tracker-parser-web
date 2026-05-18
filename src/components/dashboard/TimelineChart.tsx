/**
 * Follower / following counts over time — Recharts line chart (Phase 4).
 */

'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Snapshot } from '@/types/snapshot';
import { formatNumber, formatSnapshotLabel } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

export interface TimelineChartProps {
  snapshots: Snapshot[];
  className?: string;
}

type Point = {
  id: number;
  label: string;
  savedAt: string;
  followers: number;
  following: number;
};

export function TimelineChart({ snapshots, className }: TimelineChartProps) {
  const data: Point[] = snapshots.map((s) => ({
    id: s.id ?? 0,
    label: formatSnapshotLabel(new Date(s.savedAt)),
    savedAt: s.savedAt,
    followers: s.data.meta.followerCount,
    following: s.data.meta.followingCount,
  }));

  if (data.length < 2) {
    return (
      <section className={cn('w-full', className)}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Timeline</h2>
        <p className="text-xs text-text-secondary mb-3">
          Follower and following counts across your saved backups.
        </p>
        <div className="rounded-xl border border-dashed border-border-subtle bg-bg-secondary/40 px-4 py-12 text-center text-sm text-text-muted">
          Upload at least 2 backups to see your trend.
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full', className)}>
      <h2 className="text-lg font-semibold text-text-primary mb-1">Timeline</h2>
      <p className="text-xs text-text-secondary mb-3">
        Follower and following counts across your saved backups.
      </p>
      <div
        className="w-full rounded-xl border border-border-subtle bg-bg-secondary/50 p-3 sm:p-4"
        style={{ minHeight: 220 }}
      >
        <div className="aspect-video min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke="hsl(228, 10%, 20%)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(220, 12%, 60%)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(228, 10%, 20%)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'hsl(220, 12%, 60%)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(228, 10%, 20%)' }}
                tickFormatter={(v) => formatNumber(Number(v))}
                width={48}
              />
              <Tooltip content={<TimelineTooltip />} />
              <Line
                type="monotone"
                dataKey="followers"
                name="Followers"
                stroke="hsl(250, 70%, 60%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(250, 70%, 60%)' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="following"
                name="Following"
                stroke="hsl(38, 80%, 55%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(38, 80%, 55%)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ background: 'hsl(250, 70%, 60%)' }}
              aria-hidden
            />
            Followers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ background: 'hsl(38, 80%, 55%)' }}
              aria-hidden
            />
            Following
          </span>
        </div>
      </div>
    </section>
  );
}

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload: Point; dataKey: string; value: number; color: string; name: string }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as Point | undefined;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2 text-xs shadow-lg min-w-40">
      <p className="font-medium text-text-primary mb-1">{row.label}</p>
      <p className="text-text-muted font-mono text-[11px] mb-2">
        {new Date(row.savedAt).toLocaleString()}
      </p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex justify-between gap-4">
            <span className="text-text-secondary">{p.name}</span>
            <span className="font-mono tabular-nums text-text-primary">
              {formatNumber(p.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
