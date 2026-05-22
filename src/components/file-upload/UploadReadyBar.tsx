/**
 * Shared ready state + Save Snapshot below dual file slots.
 * Uses the Shadcn Button primitive (variant="default" for primary CTA).
 * See: docs/DESIGN_LANGUAGE.md §5.2.
 */

'use client';

import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button type="button" variant="default" onClick={onSave}>
        Save Snapshot
      </Button>
    </div>
  );
}
