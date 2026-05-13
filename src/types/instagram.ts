/**
 * Canonical Instagram data types.
 * All export formats (current JSON, legacy JSON, HTML) are normalized into these interfaces.
 * See: docs/ARCHITECTURE.md §3
 */

/** A single Instagram account extracted from an export file */
export interface InstagramAccount {
  /** The Instagram username (lowercase, trimmed) */
  username: string;
  /** Profile URL (if available from export) */
  profileUrl: string | null;
  /** Unix timestamp (seconds) when the follow relationship was created */
  timestamp: number;
}

/** The normalized result of parsing an Instagram export */
export interface ParsedExport {
  /** List of accounts that follow the user */
  followers: InstagramAccount[];
  /** List of accounts the user follows */
  following: InstagramAccount[];
  /** Metadata about the parse operation */
  meta: ParseMeta;
}

/** Metadata attached to every parsed export */
export interface ParseMeta {
  /** Unique ID for this parse operation (UUID v4) */
  id: string;
  /** ISO 8601 timestamp of when parsing completed */
  parsedAt: string;
  /** Detected format version */
  formatVersion: 'current-json' | 'legacy-json' | 'html' | 'unknown';
  /** Original filename(s) that were processed */
  sourceFiles: string[];
  /** Total number of followers parsed */
  followerCount: number;
  /** Total number of following parsed */
  followingCount: number;
  /** Duration of parse operation in milliseconds */
  parseDurationMs: number;
  /** Non-blocking warnings collected during parsing (e.g., URL validation issues) */
  warnings: string[];
}
