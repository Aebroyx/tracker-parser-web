/**
 * Inline CSV export button for account lists.
 */

'use client';

import { Download } from 'lucide-react';
import { useExport } from '@/hooks/use-export';
import { cn } from '@/lib/utils/cn';
import type { InstagramAccount } from '@/types/instagram';
import type { ExportContext } from '@/types/export';

export interface ExportButtonProps {
  accounts: InstagramAccount[];
  exportContext: ExportContext;
  className?: string;
}

export function ExportButton({
  accounts,
  exportContext,
  className,
}: ExportButtonProps) {
  const { exportAccountsAsCsv } = useExport();
  const disabled = accounts.length === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => exportAccountsAsCsv(accounts, exportContext)}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
        'border-border-default text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary',
        className
      )}
      title={disabled ? 'No accounts to export' : 'Download as CSV'}
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </button>
  );
}
