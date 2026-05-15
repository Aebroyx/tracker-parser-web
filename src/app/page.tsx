/**
 * Smart landing page.
 * - No snapshots: show upload zone (first-time experience)
 * - Has snapshots: show timeline dashboard (Phase 4)
 *
 * For Phase 1, this only shows the upload experience.
 * See: docs/ARCHITECTURE.md §8
 */

'use client';

import { ModeSelector } from '@/components/file-upload/ModeSelector';
import { DropZone } from '@/components/file-upload/DropZone';
import { HelpSection } from '@/components/file-upload/HelpSection';
import { PrivacyBanner } from '@/components/layout/PrivacyBanner';
import { useFileUpload } from '@/hooks/use-file-upload';
import { BarChart3 } from 'lucide-react';

export default function HomePage() {
  const upload = useFileUpload();

  const followerCount = upload.parserResult?.followers.length ?? 0;
  const followingCount = upload.parserResult?.following.length ?? 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Instagram Follower Tracker
          </h1>
          <p className="text-sm text-text-secondary max-w-sm">
            Upload your Instagram data export to track unfollowers, new followers, and analytics over time.
          </p>
        </div>

        {/* Privacy Banner */}
        <PrivacyBanner />

        {/* Mode Selector */}
        <div className="flex justify-center">
          <ModeSelector
            mode={upload.mode}
            onModeChange={upload.setMode}
            disabled={upload.parserStatus === 'loading'}
          />
        </div>

        {/* Drop Zone */}
        <DropZone
          mode={upload.mode}
          state={upload.dropZoneState}
          onFiles={upload.handleFiles}
          followerCount={followerCount}
          followingCount={followingCount}
          errorMessage={upload.parserError?.message}
          progress={upload.parserProgress}
          stageLabel={upload.parserStage ?? undefined}
          onCancel={upload.cancel}
          onSave={() => {
            // Phase 2: Save to IndexedDB
            // For now, log the result
            if (upload.parserResult) {
              console.log('Snapshot ready to save:', upload.parserResult);
              alert(
                `Parse complete!\n\n` +
                `Followers: ${upload.parserResult.followers.length}\n` +
                `Following: ${upload.parserResult.following.length}\n` +
                `Format: ${upload.parserResult.meta.formatVersion}\n` +
                `Duration: ${upload.parserResult.meta.parseDurationMs}ms\n` +
                `Warnings: ${upload.parserResult.meta.warnings.length}`
              );
            }
          }}
        />

        {/* Help Section */}
        <HelpSection />

        {/* Warnings (if any) */}
        {upload.parserResult && upload.parserResult.meta.warnings.length > 0 && (
          <div className="rounded-xl border border-accent-amber/20 bg-bg-secondary/50 p-4">
            <p className="text-sm font-medium text-accent-amber mb-2">
              ⚠️ {upload.parserResult.meta.warnings.length} warning{upload.parserResult.meta.warnings.length > 1 ? 's' : ''}
            </p>
            <ul className="space-y-1">
              {upload.parserResult.meta.warnings.slice(0, 5).map((w, i) => (
                <li key={i} className="text-xs text-text-secondary">{w}</li>
              ))}
              {upload.parserResult.meta.warnings.length > 5 && (
                <li className="text-xs text-text-muted">
                  and {upload.parserResult.meta.warnings.length - 5} more…
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
