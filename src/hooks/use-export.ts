/**
 * Export actions hook — bridges export.service to components.
 * See: docs/features/05_data_management.md
 */

'use client';

import { useCallback } from 'react';
import {
  buildExportFilename,
  exportAccountsCsv,
  exportSnapshotJson,
  resolveExportAccounts,
  type ResolveExportAccountsInput,
} from '@/services/export/export.service';
import type { InstagramAccount } from '@/types/instagram';
import type { ExportContext } from '@/types/export';
import type { Snapshot } from '@/types/snapshot';

export type { ResolveExportAccountsInput };

export function useExport() {
  const exportAccountsAsCsv = useCallback(
    (accounts: InstagramAccount[], ctx: ExportContext) => {
      const filename = buildExportFilename({
        kind: 'list',
        format: 'csv',
        listType: ctx.listType,
        snapshotLabel: ctx.snapshotLabel,
        comparisonLabel: ctx.comparisonLabel,
      });
      exportAccountsCsv(accounts, filename);
    },
    []
  );

  const exportSnapshotAsJson = useCallback((snapshot: Snapshot) => {
    const filename = buildExportFilename({
      kind: 'snapshot',
      format: 'json',
      snapshotLabel: snapshot.label,
    });
    exportSnapshotJson(snapshot, filename);
  }, []);

  const resolveAccounts = useCallback(
    (input: ResolveExportAccountsInput) => resolveExportAccounts(input),
    []
  );

  return {
    exportAccountsAsCsv,
    exportSnapshotAsJson,
    resolveAccounts,
  };
}
