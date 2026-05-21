/**
 * Data export types.
 * See: docs/features/05_data_management.md
 */

export type ExportListType =
  | 'non-followers'
  | 'fans'
  | 'mutuals'
  | 'gained-followers'
  | 'lost-followers'
  | 'new-following'
  | 'removed-following'
  | 'all-followers'
  | 'all-following';

export type ExportFormat = 'csv' | 'json';

export interface ExportContext {
  listType: ExportListType;
  /** Snapshot label or primary label for diff lists. Used in filename. */
  snapshotLabel?: string;
  /** Secondary label for cross-snapshot diff filenames (newer snapshot). */
  comparisonLabel?: string;
}

export interface ExportFilenameOptions {
  kind: 'list' | 'snapshot';
  format: ExportFormat;
  listType?: ExportListType;
  snapshotLabel?: string;
  comparisonLabel?: string;
}

/** Human-readable label for export list types */
export const EXPORT_LIST_LABELS: Record<ExportListType, string> = {
  'non-followers': 'Non-followers',
  fans: 'Fans',
  mutuals: 'Mutuals',
  'gained-followers': 'Gained followers',
  'lost-followers': 'Lost followers',
  'new-following': 'New following',
  'removed-following': 'Removed following',
  'all-followers': 'All followers',
  'all-following': 'All following',
};

export const CROSS_SNAPSHOT_LIST_TYPES: ExportListType[] = [
  'gained-followers',
  'lost-followers',
  'new-following',
  'removed-following',
];

export function isCrossSnapshotListType(type: ExportListType): boolean {
  return CROSS_SNAPSHOT_LIST_TYPES.includes(type);
}
