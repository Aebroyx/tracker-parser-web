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

/** Which dual-upload slot a file belongs to (JSON/HTML modes) */
export type FileSlotCategory = 'followers' | 'following';

/** Per-slot visual state for FileSlotDropZone */
export type SlotVisualState =
  | 'idle'
  | 'drag-over'
  | 'parsing'
  | 'loaded'
  | 'error';

/** File status for individual file tracking in non-ZIP modes */
export interface FileSlot {
  /** Which category this file fills */
  category: FileSlotCategory;
  /** Original filename (or comma-separated for multiple) */
  fileName: string;
  /** Number of accounts parsed from this file */
  accountCount: number;
}
