/**
 * Data export service — CSV generation and snapshot JSON backup.
 * Framework-agnostic; no React imports.
 * See: docs/features/05_data_management.md
 */

import { INSTAGRAM_BASE_URL } from '@/lib/utils/constants';
import { unixToISO } from '@/lib/utils/formatters';
import type { InstagramAccount } from '@/types/instagram';
import {
  isCrossSnapshotListType,
  type ExportFilenameOptions,
  type ExportListType,
} from '@/types/export';
import { analyzeSnapshot, compareSnapshots } from '@/services/diff/diff.service';
import type { Snapshot } from '@/types/snapshot';

const CSV_HEADER = ['username', 'profile_url', 'followed_since'] as const;

/** RFC-4180 field escaping */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build a single CSV row from fields */
function csvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Generate CSV string from rows (including header row if provided as first row).
 */
export function generateCsv(rows: string[][]): string {
  return rows.map(csvRow).join('\r\n');
}

function profileUrlForAccount(acc: InstagramAccount): string {
  if (acc.profileUrl?.trim()) return acc.profileUrl.trim();
  return `${INSTAGRAM_BASE_URL}${acc.username}/`;
}

/**
 * Convert accounts to CSV rows with standard header.
 */
export function accountsToCsvRows(accounts: InstagramAccount[]): string[][] {
  const dataRows = accounts.map((acc) => [
    acc.username,
    profileUrlForAccount(acc),
    acc.timestamp > 0 ? unixToISO(acc.timestamp) : '',
  ]);
  return [[...CSV_HEADER], ...dataRows];
}

/** Slug-safe segment for filenames */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a download filename for CSV or JSON exports.
 */
export function buildExportFilename(opts: ExportFilenameOptions): string {
  const ext = opts.format === 'csv' ? 'csv' : 'json';
  const date = dateStamp();

  if (opts.kind === 'snapshot') {
    const label = opts.snapshotLabel
      ? slugify(opts.snapshotLabel)
      : 'snapshot';
    return `instaghost_snapshot_${label}_${date}.${ext}`;
  }

  const listPart = opts.listType ?? 'export';
  const primary = opts.snapshotLabel ? slugify(opts.snapshotLabel) : 'data';
  const secondary = opts.comparisonLabel
    ? `_vs_${slugify(opts.comparisonLabel)}`
    : '';

  return `instaghost_${listPart}_${primary}${secondary}_${date}.${ext}`;
}

/** JSON snapshot backup envelope */
export interface SnapshotBackupEnvelope {
  schemaVersion: 1;
  exportedAt: string;
  snapshot: Snapshot;
}

/**
 * Serialize a snapshot as JSON backup (archival; no re-import in Phase 5).
 */
export function serializeSnapshot(snapshot: Snapshot): string {
  const envelope: SnapshotBackupEnvelope = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    snapshot,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Trigger a browser download for text content.
 */
export function downloadBlob(
  filename: string,
  content: string,
  mime: 'text/csv' | 'application/json'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export accounts as a downloadable CSV file.
 */
export function exportAccountsCsv(
  accounts: InstagramAccount[],
  filename: string
): void {
  const rows = accountsToCsvRows(accounts);
  const csv = generateCsv(rows);
  downloadBlob(filename, csv, 'text/csv');
}

/**
 * Export a snapshot as a downloadable JSON backup file.
 */
export function exportSnapshotJson(snapshot: Snapshot, filename: string): void {
  const json = serializeSnapshot(snapshot);
  downloadBlob(filename, json, 'application/json');
}

export interface ResolveExportAccountsInput {
  listType: ExportListType;
  snapshot: Snapshot;
  olderSnapshot?: Snapshot | null;
  newerSnapshot?: Snapshot | null;
}

/**
 * Resolve the account list for a given export type from snapshot(s).
 */
export function resolveExportAccounts(
  input: ResolveExportAccountsInput
): InstagramAccount[] {
  const { listType, snapshot } = input;

  if (listType === 'all-followers') {
    return snapshot.data.followers;
  }
  if (listType === 'all-following') {
    return snapshot.data.following;
  }

  if (isCrossSnapshotListType(listType)) {
    let older = input.olderSnapshot;
    let newer = input.newerSnapshot ?? snapshot;
    if (!older || !newer || older.id == null || newer.id == null) {
      return [];
    }
    if (older.id === newer.id) return [];
    // Ensure chronological order for diff engine
    if (new Date(older.savedAt).getTime() > new Date(newer.savedAt).getTime()) {
      [older, newer] = [newer, older];
    }
    const diff = compareSnapshots(older, newer);
    switch (listType) {
      case 'gained-followers':
        return diff.gainedFollowers;
      case 'lost-followers':
        return diff.lostFollowers;
      case 'new-following':
        return diff.newFollowing;
      case 'removed-following':
        return diff.removedFollowing;
      default:
        return [];
    }
  }

  const analysis = analyzeSnapshot(snapshot);
  switch (listType) {
    case 'non-followers':
      return analysis.nonFollowers;
    case 'fans':
      return analysis.fans;
    case 'mutuals':
      return analysis.mutuals;
    default:
      return [];
  }
}
