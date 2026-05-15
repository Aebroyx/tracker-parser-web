/**
 * App-wide constants.
 * See: docs/features/01_file_processing.md §9
 */

// ─── File Constraints ────────────────────────────────────────────────────────

/** Max file size in bytes (500MB uncompressed) */
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Max individual JSON/HTML file size in bytes (100MB) */
export const MAX_SINGLE_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Max entries per followers/following list */
export const MAX_ENTRIES_PER_LIST = 1_000_000;

/** Max paginated files (followers_1 through followers_100) */
export const MAX_PAGINATED_FILES = 100;

/** Parse timeout in milliseconds (30 seconds) */
export const PARSE_TIMEOUT_MS = 30_000;

/** Max files allowed in a ZIP archive (ZIP bomb detection) */
export const MAX_ZIP_FILE_COUNT = 1000;

// ─── Storage ─────────────────────────────────────────────────────────────────

/** Max number of snapshots retained in IndexedDB */
export const MAX_SNAPSHOTS = 20;

/** LocalStorage key for privacy notice dismissal */
export const PRIVACY_NOTICE_KEY = 'privacy-notice-dismissed';

/** IndexedDB database name */
export const DB_NAME = 'instagram-tracker';

// ─── Accepted File Types ─────────────────────────────────────────────────────

export const ACCEPTED_EXTENSIONS = {
  zip: ['.zip'],
  json: ['.json'],
  html: ['.html', '.htm'],
} as const;

export const ALL_ACCEPTED_EXTENSIONS = [
  ...ACCEPTED_EXTENSIONS.zip,
  ...ACCEPTED_EXTENSIONS.json,
  ...ACCEPTED_EXTENSIONS.html,
];

// ─── Instagram Path Patterns ─────────────────────────────────────────────────

/** Regex patterns for identifying follower/following files in ZIP exports */
export const FILE_PATTERNS = {
  followers: /followers_and_following\/followers_?\d*\.(json|html)$/i,
  following: /followers_and_following\/following\.(json|html)$/i,
} as const;

// ─── Profile URL ─────────────────────────────────────────────────────────────

export const INSTAGRAM_BASE_URL = 'https://www.instagram.com/';

// ─── Warning Limits ──────────────────────────────────────────────────────────

export const MAX_DISPLAYED_WARNINGS = 50;
