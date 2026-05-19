/**
 * Full upload experience: mode selector, drop zone, help, warnings, save.
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ModeSelector } from '@/components/file-upload/ModeSelector';
import { DropZone } from '@/components/file-upload/DropZone';
import { HelpSection } from '@/components/file-upload/HelpSection';
import { PrivacyBanner } from '@/components/layout/PrivacyBanner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useSnapshots } from '@/hooks/use-snapshots';
import type { ParsedExport } from '@/types/instagram';
import { APP_NAME, APP_TAGLINE } from '@/lib/utils/constants';
import { BarChart3 } from 'lucide-react';

export interface UploadPanelProps {
  /** Called after a successful save (e.g. redirect from `/upload`) */
  afterSave?: () => void;
  /** When true, shows the privacy banner */
  showPrivacyBanner?: boolean;
  /** When true, renders a “Back” link to `/` */
  showBackLink?: boolean;
}

export function UploadPanel({
  afterSave,
  showPrivacyBanner = true,
  showBackLink = false,
}: UploadPanelProps) {
  const upload = useFileUpload();
  const snapshots = useSnapshots();

  const [pruneDialogOpen, setPruneDialogOpen] = useState(false);
  const [pendingExport, setPendingExport] = useState<ParsedExport | null>(null);
  const [oldestLabel, setOldestLabel] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const followerCount =
    upload.exportReady?.followers.length ??
    upload.pendingFollowers?.length ??
    0;
  const followingCount =
    upload.exportReady?.following.length ??
    upload.pendingFollowing?.length ??
    0;

  const errorMessage =
    upload.validationError ?? upload.parserError?.message ?? saveError ?? undefined;

  const performSave = useCallback(
    async (data: ParsedExport) => {
      setSaveError(null);
      try {
        await snapshots.save(data);
        upload.reset();
        setPendingExport(null);
        afterSave?.();
      } catch {
        setSaveError(
          "We couldn't save your data. Your browser storage may be full — try deleting old snapshots or clearing site data."
        );
      }
    },
    [snapshots, upload, afterSave]
  );

  const onSaveClick = useCallback(async () => {
    const data = upload.exportReady;
    if (!data) return;

    const { exceeds, oldest } = await snapshots.willExceedLimit();
    if (exceeds && oldest) {
      setPendingExport(data);
      setOldestLabel(oldest.label);
      setPruneDialogOpen(true);
      return;
    }

    await performSave(data);
  }, [upload.exportReady, snapshots, performSave]);

  const confirmPruneAndSave = useCallback(() => {
    setPruneDialogOpen(false);
    if (pendingExport) void performSave(pendingExport);
    setPendingExport(null);
  }, [pendingExport, performSave]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {showBackLink && (
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-accent-primary transition-colors self-start"
          >
            ← Back to dashboard
          </Link>
        )}

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="spectral-icon-wrap flex items-center justify-center w-14 h-14 rounded-2xl mb-1">
            <BarChart3 className="w-7 h-7 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {APP_NAME}
          </h1>
          <p className="text-sm text-text-secondary max-w-sm">
            {APP_TAGLINE}
          </p>
        </div>

        {showPrivacyBanner && <PrivacyBanner />}

        <div className="flex justify-center">
          <ModeSelector
            mode={upload.mode}
            onModeChange={upload.setMode}
            disabled={upload.parserStatus === 'loading'}
          />
        </div>

        <DropZone
          mode={upload.mode}
          state={upload.dropZoneState}
          onFiles={upload.handleFiles}
          followerCount={followerCount}
          followingCount={followingCount}
          errorMessage={errorMessage}
          progress={upload.parserProgress}
          stageLabel={upload.parserStage ?? undefined}
          onCancel={upload.cancel}
          onSave={onSaveClick}
        />

        <HelpSection />

        {upload.exportReady &&
          upload.exportReady.meta.warnings.length > 0 && (
            <div className="rounded-xl border border-accent-amber/20 bg-bg-secondary/50 p-4">
              <p className="text-sm font-medium text-accent-amber mb-2">
                ⚠️ {upload.exportReady.meta.warnings.length} warning
                {upload.exportReady.meta.warnings.length > 1 ? 's' : ''}
              </p>
              <ul className="space-y-1">
                {upload.exportReady.meta.warnings.slice(0, 5).map((w, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    {w}
                  </li>
                ))}
                {upload.exportReady.meta.warnings.length > 5 && (
                  <li className="text-xs text-text-muted">
                    and {upload.exportReady.meta.warnings.length - 5} more…
                  </li>
                )}
              </ul>
            </div>
          )}

        <ConfirmDialog
          open={pruneDialogOpen}
          title="Storage limit reached"
          description={`You already have 20 snapshots. Saving will remove your oldest backup (“${oldestLabel}”). Continue?`}
          confirmLabel="Save and remove oldest"
          cancelLabel="Cancel"
          destructive
          onCancel={() => {
            setPruneDialogOpen(false);
            setPendingExport(null);
          }}
          onConfirm={confirmPruneAndSave}
        />
      </div>
    </div>
  );
}
