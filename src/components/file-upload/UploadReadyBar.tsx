/**
 * Shared ready state + Save Snapshot below dual file slots.
 */

'use client';

import { CheckCircle } from 'lucide-react';

interface UploadReadyBarProps {
  followerCount: number;
  followingCount: number;
  onSave: () => void;
}

export function UploadReadyBar({
  followerCount,
  followingCount,
  onSave,
}: UploadReadyBarProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-accent-green/30 bg-bg-secondary/50">
      <div className="flex items-center gap-2 text-accent-green">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          Ready! {followerCount.toLocaleString()} followers,{' '}
          {followingCount.toLocaleString()} following
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
      >
        Save Snapshot
      </button>
    </div>
  );
}
