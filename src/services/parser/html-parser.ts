/**
 * HTML export parser using regex-based extraction.
 * Works in Web Workers (no DOMParser dependency).
 * Uses structural heuristics — does NOT rely on CSS class names.
 * See: docs/features/01_file_processing.md §5.3
 */

import type { InstagramAccount } from '@/types/instagram';
import { normalizeUsername, deduplicateAccounts, validateProfileUrl } from './instagram-parser';

/** ISO 8601 timestamp regex pattern */
const ISO_TIMESTAMP_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:?\d{2}/;

/**
 * Create a fresh anchor regex (avoids global lastIndex state issues).
 * Captures: [1] = full href, [2] = text content (username)
 */
function createAnchorRegex(): RegExp {
  return /<a\s[^>]*?href\s*=\s*["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
}

/**
 * Validate that HTML content is a valid Instagram export.
 * Returns true if the content contains Instagram profile links.
 */
export function validateHtmlExport(content: string): boolean {
  return createAnchorRegex().test(content);
}

/**
 * Extract a timestamp from the surrounding HTML context near an anchor match.
 * Looks for ISO 8601 timestamps in nearby text.
 */
function extractTimestampFromContext(html: string, matchIndex: number): number {
  // Look in a window around the match (500 chars before and after)
  const windowStart = Math.max(0, matchIndex - 300);
  const windowEnd = Math.min(html.length, matchIndex + 500);
  const window = html.slice(windowStart, windowEnd);

  // Find all timestamps in the window
  const timestamps: { value: number; distance: number }[] = [];
  let tsMatch: RegExpExecArray | null;
  const tsRegex = new RegExp(ISO_TIMESTAMP_REGEX.source, 'g');

  while ((tsMatch = tsRegex.exec(window)) !== null) {
    try {
      const ts = Math.floor(new Date(tsMatch[0]).getTime() / 1000);
      // Distance from the anchor match position (relative to window)
      const distance = Math.abs(tsMatch.index - (matchIndex - windowStart));
      timestamps.push({ value: ts, distance });
    } catch {
      // Invalid date, skip
    }
  }

  // Return the closest timestamp, or 0 if none found
  if (timestamps.length > 0) {
    timestamps.sort((a, b) => a.distance - b.distance);
    return timestamps[0].value;
  }

  return 0;
}

/**
 * Strip HTML tags from a string to get plain text.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Determine if an HTML file contains followers or following data.
 * Uses filename first, then content-based heuristics as fallback.
 */
export function detectHtmlFileType(
  fileName: string,
  content: string
): 'followers' | 'following' | 'unknown' {
  // 1. Filename-based detection
  const lowerName = fileName.toLowerCase();
  if (/followers_?\d*\.html?$/i.test(lowerName)) return 'followers';
  if (/following\.html?$/i.test(lowerName)) return 'following';

  // 2. Content-based fallback — look for title or heading
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);

  const headingText = [
    titleMatch?.[1] || '',
    h1Match?.[1] || '',
    h2Match?.[1] || '',
  ].join(' ').toLowerCase();

  if (headingText.includes('following')) return 'following';
  if (headingText.includes('follower')) return 'followers';

  return 'unknown';
}

/**
 * Parse Instagram accounts from HTML content using regex.
 * Works in Web Workers — no DOMParser needed.
 */
export function parseHtmlAccounts(
  content: string,
  warnings: string[]
): InstagramAccount[] {
  const accounts: InstagramAccount[] = [];
  const regex = createAnchorRegex(); // Fresh instance, no stale lastIndex

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const href = match[1];
    const rawTextContent = stripHtmlTags(match[2]);

    // Skip empty text content
    if (!rawTextContent || rawTextContent.length === 0) continue;

    // Skip links that point to instagram.com root
    try {
      const url = new URL(href);
      const path = url.pathname.replace(/\/$/, '');
      if (path === '' || path === '/') continue;
    } catch {
      continue;
    }

    const username = normalizeUsername(rawTextContent);
    if (!username) continue;

    const [profileUrl, warning] = validateProfileUrl(href, username);
    if (warning) warnings.push(warning);

    const timestamp = extractTimestampFromContext(content, match.index);

    accounts.push({
      username,
      profileUrl,
      timestamp,
    });
  }

  return deduplicateAccounts(accounts);
}

// ─── Unified HTML Parser ─────────────────────────────────────────────────────

export interface HtmlParseResult {
  followers: InstagramAccount[];
  following: InstagramAccount[];
  warnings: string[];
}

/**
 * Parse an HTML string as an Instagram export file.
 * Uses regex-based extraction (works in Web Workers — no DOMParser).
 */
export function parseHtmlFile(
  content: string,
  fileName: string
): HtmlParseResult {
  const warnings: string[] = [];

  // Basic HTML validation
  const trimmed = content.trim();
  if (!trimmed.startsWith('<') && !trimmed.includes('<html') && !trimmed.includes('<!DOCTYPE')) {
    throw {
      code: 'INVALID_HTML',
      message: `Failed to parse HTML in ${fileName}`,
    };
  }

  if (!validateHtmlExport(content)) {
    throw {
      code: 'UNSUPPORTED_FORMAT',
      message: `${fileName} doesn't appear to be an Instagram export (no Instagram links found)`,
    };
  }

  const accounts = parseHtmlAccounts(content, warnings);
  const fileType = detectHtmlFileType(fileName, content);

  const result: HtmlParseResult = {
    followers: [],
    following: [],
    warnings,
  };

  if (fileType === 'followers') {
    result.followers = accounts;
  } else if (fileType === 'following') {
    result.following = accounts;
  } else {
    // Unknown file type — treat as followers with a warning
    warnings.push(
      `Could not determine if "${fileName}" contains followers or following data. ` +
      `Treating as followers. Rename the file to "followers_1.html" or "following.html" to fix this.`
    );
    result.followers = accounts;
  }

  return result;
}
