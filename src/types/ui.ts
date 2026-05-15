/**
 * UI-specific enums and types.
 * These types are only used by components and hooks — never by services.
 */

/** Upload mode selection — determines which file types the drop zone accepts */
export type UploadMode = 'zip' | 'json' | 'html';

/** Visual state of the drop zone component */
export type DropZoneState =
  | 'idle'
  | 'drag-over'
  | 'uploading'
  | 'parsing'
  | 'incomplete'
  | 'ready'
  | 'error';

/** File status for individual file tracking in non-ZIP modes */
export interface FileSlot {
  /** Which category this file fills */
  category: 'followers' | 'following';
  /** Original filename */
  fileName: string;
  /** Number of accounts parsed from this file */
  accountCount: number;
}
