/**
 * Smart landing: no snapshots → upload; 1 snapshot → overview + analysis; 2+ → full dashboard.
 * See: docs/ARCHITECTURE.md §8, docs/features/04_dashboard_ui.md §3.1
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UploadPanel } from '@/components/file-upload/UploadPanel';
import { SnapshotHistory } from '@/components/dashboard/SnapshotHistory';
import { StorageUsage } from '@/components/dashboard/StorageUsage';
import { AnalysisPanel } from '@/components/dashboard/AnalysisPanel';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { DiffCard } from '@/components/dashboard/DiffCard';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import {
  SnapshotPicker,
  type SnapshotPickerValue,
} from '@/components/dashboard/SnapshotPicker';
import { useSnapshots } from '@/hooks/use-snapshots';
import { useDiff } from '@/hooks/use-diff';
import { BarChart3, Upload } from 'lucide-react';

export default function HomePage() {
  const [pickerIds, setPickerIds] = useState<SnapshotPickerValue>({});

  const {
    snapshots,
    snapshotCount,
    isLoading,
    storage,
    rename,
    remove,
  } = useSnapshots();

  const { analysis, diff, older, newer } = useDiff(pickerIds);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (snapshotCount === 0) {
    return <UploadPanel showPrivacyBanner />;
  }

  const showFullDashboard = snapshotCount >= 2;

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Your backups
          </h1>
          <p className="text-sm text-text-secondary max-w-sm">
            Snapshots are stored only in this browser. Upload a new export anytime
            to grow your timeline.
          </p>
        </div>

        <Link
          href="/upload"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:brightness-110"
          style={{ background: 'var(--gradient-accent)' }}
        >
          <Upload className="w-4 h-4" />
          Upload new backup
        </Link>

        <StorageUsage usage={storage?.usage ?? null} quota={storage?.quota ?? null} />

        {showFullDashboard && (
          <SnapshotPicker
            snapshots={snapshots}
            value={pickerIds}
            onChange={setPickerIds}
          />
        )}

        {snapshotCount === 1 && (
          <p className="text-sm text-text-secondary text-center rounded-xl border border-border-subtle bg-bg-secondary/50 px-4 py-3">
            Upload another backup to compare changes over time (non-followers, fans, and
            gained / lost followers).
          </p>
        )}

        {analysis && diff && older && newer ? (
          <DiffCard
            analysis={analysis}
            diff={diff}
            olderLabel={older.label}
            newerLabel={newer.label}
          />
        ) : analysis ? (
          <StatsBar analysis={analysis} />
        ) : null}

        {showFullDashboard && <TimelineChart snapshots={snapshots} />}

        {analysis && (
          <AnalysisPanel
            analysis={analysis}
            snapshotLabel={newer?.label}
          />
        )}

        <SnapshotHistory
          snapshots={snapshots}
          onRename={rename}
          onDelete={remove}
        />
      </div>
    </div>
  );
}
