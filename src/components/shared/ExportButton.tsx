/**
 * Inline CSV export button for account lists — Shadcn Button (outline, sm).
 * See: docs/DESIGN_LANGUAGE.md §5.2 (Button variants).
 */

'use client';

import { Download } from 'lucide-react';
import { useExport } from '@/hooks/use-export';
import { Button } from '@/components/ui/button';
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => exportAccountsAsCsv(accounts, exportContext)}
      title={disabled ? 'No accounts to export' : 'Download as CSV'}
      className={cn(className)}
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </Button>
  );
}
