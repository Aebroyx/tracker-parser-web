/**
 * JSON format detection and normalization.
 * See: docs/features/01_file_processing.md §4.2, §5.1, §5.2
 */

import type { InstagramAccount } from '@/types/instagram';
import type { JsonFormatVersion, ContentType } from '@/types/parser';
import {
  currentFollowersSchema,
  currentFollowingSchema,
  legacyFollowersSchema,
  legacyFollowingSchema,
} from './schemas';
import { INSTAGRAM_BASE_URL } from '@/lib/utils/constants';

// ─── Content Type Detection ──────────────────────────────────────────────────

/**
 * Detect whether a file contains JSON, HTML, or unknown content.
 * See: docs/features/01_file_processing.md §4.1
 */
export function detectContentType(fileName: string, content: string): ContentType {
  const ext = fileName.toLowerCase().split('.').pop();

  // 1. Check file extension first
  if (ext === 'json') return 'json';
  if (ext === 'html' || ext === 'htm') return 'html';

  // 2. Content sniffing fallback (for files extracted from ZIP without extension)
  try {
    JSON.parse(content);
    return 'json';
  } catch {
    // Not JSON
  }

  const trimmed = content.trimStart().toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    return 'html';
  }

  return 'unknown';
}

// ─── JSON Format Version Detection ──────────────────────────────────────────

/**
 * Detect whether parsed JSON is in current or legacy Instagram format.
 * See: docs/features/01_file_processing.md §4.2
 */
export function detectJsonFormat(data: unknown): JsonFormatVersion {
  if (Array.isArray(data)) {
    // Current format followers: top-level array with string_list_data
    const first = data[0];
    if (first && typeof first === 'object' && first !== null && 'string_list_data' in first) {
      return 'current-json';
    }
    return 'unknown';
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    // Current format following: object with relationships_following containing string_list_data
    if (Array.isArray(obj.relationships_following)) {
      const first = obj.relationships_following[0];
      if (first && typeof first === 'object' && first !== null && 'string_list_data' in first) {
        return 'current-json';
      }
      // Legacy following: has relationships_following with value field
      if (first && typeof first === 'object' && first !== null && 'value' in first) {
        return 'legacy-json';
      }
    }

    // Legacy followers: object with relationships_followers
    if (Array.isArray(obj.relationships_followers)) {
      const first = obj.relationships_followers[0];
      if (first && typeof first === 'object' && first !== null && 'value' in first) {
        return 'legacy-json';
      }
    }
  }

  return 'unknown';
}

// ─── Normalization ───────────────────────────────────────────────────────────

/**
 * Normalize a username: trim whitespace, convert to lowercase.
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Validate and normalize a profile URL.
 * Returns [normalizedUrl, warning?]
 */
export function validateProfileUrl(
  url: string | undefined,
  username: string
): [string | null, string | null] {
  const constructed = `${INSTAGRAM_BASE_URL}${username}`;

  if (!url || url.trim() === '') {
    return [constructed, null];
  }

  // Check if valid URL
  try {
    const parsed = new URL(url);
    if (!parsed.href.startsWith(INSTAGRAM_BASE_URL)) {
      return [constructed, `Unexpected profile URL domain for @${username}`];
    }
    if (!parsed.pathname.toLowerCase().includes(username)) {
      return [url, `Profile URL doesn't match username for @${username}`];
    }
    return [url, null];
  } catch {
    return [constructed, `Malformed profile URL for @${username}, using constructed URL`];
  }
}

/**
 * Deduplicate accounts by username, keeping the one with the latest timestamp.
 */
export function deduplicateAccounts(accounts: InstagramAccount[]): InstagramAccount[] {
  const map = new Map<string, InstagramAccount>();

  for (const account of accounts) {
    const existing = map.get(account.username);
    if (!existing || account.timestamp > existing.timestamp) {
      map.set(account.username, account);
    }
  }

  return Array.from(map.values());
}

// ─── Current Format Parsing ──────────────────────────────────────────────────

/**
 * Resolve username from a current-format entry.
 * Instagram puts the username in different places depending on file type:
 *   - followers: string_list_data[0].value
 *   - following: title
 */
function resolveUsername(entry: import('./schemas').CurrentFormatEntry): string {
  // Try string_list_data[0].value first
  if (entry.string_list_data && entry.string_list_data.length > 0) {
    const val = entry.string_list_data[0].value;
    if (val && val.trim()) return val;
  }
  // Fall back to title
  if (entry.title && entry.title.trim()) return entry.title;
  return '';
}

/**
 * Resolve href from a current-format entry.
 */
function resolveHref(entry: import('./schemas').CurrentFormatEntry): string {
  if (entry.string_list_data && entry.string_list_data.length > 0) {
    return entry.string_list_data[0].href || '';
  }
  return '';
}

/**
 * Resolve timestamp from a current-format entry.
 */
function resolveTimestamp(entry: import('./schemas').CurrentFormatEntry): number {
  if (entry.string_list_data && entry.string_list_data.length > 0) {
    return entry.string_list_data[0].timestamp ?? 0;
  }
  return 0;
}

/**
 * Parse current-format followers (top-level JSON array).
 */
export function parseCurrentFollowers(
  data: unknown,
  warnings: string[]
): InstagramAccount[] {
  const parsed = currentFollowersSchema.parse(data);
  const accounts: InstagramAccount[] = [];

  for (const entry of parsed) {
    const rawUsername = resolveUsername(entry);
    if (!rawUsername) {
      warnings.push('Skipped entry with no username (empty title and string_list_data)');
      continue;
    }

    const username = normalizeUsername(rawUsername);
    const href = resolveHref(entry);
    const [profileUrl, warning] = validateProfileUrl(href || undefined, username);
    if (warning) warnings.push(warning);

    accounts.push({
      username,
      profileUrl,
      timestamp: resolveTimestamp(entry),
    });
  }

  return deduplicateAccounts(accounts);
}

/**
 * Parse current-format following (object with relationships_following).
 */
export function parseCurrentFollowing(
  data: unknown,
  warnings: string[]
): InstagramAccount[] {
  const parsed = currentFollowingSchema.parse(data);
  const accounts: InstagramAccount[] = [];

  for (const entry of parsed.relationships_following) {
    const rawUsername = resolveUsername(entry);
    if (!rawUsername) {
      warnings.push('Skipped following entry with no username (empty title and string_list_data)');
      continue;
    }

    const username = normalizeUsername(rawUsername);
    const href = resolveHref(entry);
    const [profileUrl, warning] = validateProfileUrl(href || undefined, username);
    if (warning) warnings.push(warning);

    accounts.push({
      username,
      profileUrl,
      timestamp: resolveTimestamp(entry),
    });
  }

  return deduplicateAccounts(accounts);
}

// ─── Legacy Format Parsing ───────────────────────────────────────────────────

/**
 * Parse legacy followers (object with relationships_followers).
 */
export function parseLegacyFollowers(
  data: unknown,
  warnings: string[]
): InstagramAccount[] {
  const parsed = legacyFollowersSchema.parse(data);
  return parsed.relationships_followers.map((entry) => {
    const username = normalizeUsername(entry.value);
    const [profileUrl, warning] = validateProfileUrl(undefined, username);
    if (warning) warnings.push(warning);

    return {
      username,
      profileUrl,
      timestamp: entry.timestamp ?? 0,
    };
  });
}

/**
 * Parse legacy following (object with relationships_following).
 */
export function parseLegacyFollowing(
  data: unknown,
  warnings: string[]
): InstagramAccount[] {
  const parsed = legacyFollowingSchema.parse(data);
  return parsed.relationships_following.map((entry) => {
    const username = normalizeUsername(entry.value);
    const [profileUrl, warning] = validateProfileUrl(undefined, username);
    if (warning) warnings.push(warning);

    return {
      username,
      profileUrl,
      timestamp: entry.timestamp ?? 0,
    };
  });
}

// ─── Unified JSON Parser ─────────────────────────────────────────────────────

export interface JsonParseResult {
  followers: InstagramAccount[];
  following: InstagramAccount[];
  formatVersion: JsonFormatVersion;
  warnings: string[];
}

/**
 * Parse a JSON string as an Instagram export file.
 * Auto-detects format version and extracts followers/following.
 */
export function parseJsonFile(
  content: string,
  fileName: string
): JsonParseResult {
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw { code: 'INVALID_JSON', message: `Invalid JSON in ${fileName}` };
  }

  const format = detectJsonFormat(data);

  if (format === 'unknown') {
    throw {
      code: 'UNSUPPORTED_FORMAT',
      message: `Unrecognized Instagram JSON format in ${fileName}`,
    };
  }

  let followers: InstagramAccount[] = [];
  let following: InstagramAccount[] = [];

  // Determine if this is a followers or following file based on structure
  const isFollowersFile = /followers/i.test(fileName);
  const isFollowingFile = /following/i.test(fileName);

  if (format === 'current-json') {
    if (Array.isArray(data)) {
      // Top-level array = followers file
      followers = parseCurrentFollowers(data, warnings);
    } else {
      // Object with relationships_following = following file
      following = parseCurrentFollowing(data, warnings);
    }
  } else if (format === 'legacy-json') {
    const obj = data as Record<string, unknown>;
    if (obj.relationships_followers) {
      followers = parseLegacyFollowers(data, warnings);
    }
    if (obj.relationships_following) {
      // Could be both in legacy format
      if (isFollowersFile && !obj.relationships_followers) {
        followers = parseLegacyFollowing(data, warnings);
      } else {
        following = parseLegacyFollowing(data, warnings);
      }
    }
  }

  return { followers, following, formatVersion: format, warnings };
}
