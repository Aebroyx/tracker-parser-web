/**
 * Approximate browser storage usage (navigator.storage.estimate).
 */

'use client';

import { formatBytes } from '@/lib/utils/formatters';

interface StorageUsageProps {
  usage: number | null;
  quota: number | null;
}

export function StorageUsage({ usage, quota }: StorageUsageProps) {
  if (usage == null || quota == null) return null;

  return (
    <p className="text-xs text-text-muted text-center">
      Browser storage: ~{formatBytes(usage)} used
      {quota > 0 ? ` of ${formatBytes(quota)} available` : ''}
    </p>
  );
}
