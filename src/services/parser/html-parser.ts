/**
 * HTML export parser using DOMParser with structural heuristics.
 * Does NOT rely on CSS class names (Instagram changes them frequently).
 * See: docs/features/01_file_processing.md §5.3
 */

import type { InstagramAccount } from '@/types/instagram';
import { INSTAGRAM_BASE_URL } from '@/lib/utils/constants';
import { normalizeUsername, deduplicateAccounts, validateProfileUrl } from './instagram-parser';

/** ISO 8601 timestamp regex pattern */
const ISO_TIMESTAMP_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:?\d{2}/;

/**
 * Validate that an HTML document is a valid Instagram export.
 * Returns true if the document contains Instagram profile links.
 */
export function validateHtmlExport(doc: Document): boolean {
  const links = doc.querySelectorAll('a[href*="instagram.com/"]');
  return links.length > 0;
}

/**
 * Extract a timestamp from sibling/child text nodes near an anchor tag.
 * Walks up to parent/grandparent to find ISO 8601 timestamps.
 */
function extractTimestamp(anchor: Element): number {
  // Search parent and grandparent containers
  const containers = [anchor.parentElement, anchor.parentElement?.parentElement];

  for (const container of containers) {
    if (!container) continue;

    // Check all text content in the container's children
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Skip the anchor element itself
      if (child === anchor || child.contains(anchor)) continue;

      const text = child.textContent?.trim() || '';
      const match = text.match(ISO_TIMESTAMP_REGEX);
      if (match) {
        try {
          return Math.floor(new Date(match[0]).getTime() / 1000);
        } catch {
          // Invalid date, continue searching
        }
      }
    }
  }

  return 0; // Default timestamp if not found
}

/**
 * Determine if an HTML file contains followers or following data.
 * Uses filename first, then page title/heading as fallback.
 */
export function detectHtmlFileType(
  fileName: string,
  doc: Document
): 'followers' | 'following' | 'unknown' {
  // 1. Filename-based detection
  const lowerName = fileName.toLowerCase();
  if (/followers_?\d*\.html?$/i.test(lowerName)) return 'followers';
  if (/following\.html?$/i.test(lowerName)) return 'following';

  // 2. Title/heading fallback
  const title = doc.querySelector('title')?.textContent?.toLowerCase() || '';
  const h1 = doc.querySelector('h1')?.textContent?.toLowerCase() || '';
  const h2 = doc.querySelector('h2')?.textContent?.toLowerCase() || '';
  const headingText = `${title} ${h1} ${h2}`;

  if (headingText.includes('following')) return 'following';
  if (headingText.includes('follower')) return 'followers';

  return 'unknown';
}

/**
 * Parse Instagram accounts from an HTML export.
 * Uses structural heuristics — does NOT depend on CSS class names.
 */
export function parseHtmlAccounts(
  doc: Document,
  warnings: string[]
): InstagramAccount[] {
  const accounts: InstagramAccount[] = [];
  const links = doc.querySelectorAll(`a[href*="instagram.com/"]`);

  for (let i = 0; i < links.length; i++) {
    const anchor = links[i] as HTMLAnchorElement;
    const href = anchor.getAttribute('href') || '';
    const textContent = anchor.textContent?.trim() || '';

    // Skip navigation links (like "instagram.com" itself)
    if (!textContent || textContent.length === 0) continue;

    // Skip links that point to instagram.com root
    try {
      const url = new URL(href);
      const path = url.pathname.replace(/\/$/, '');
      if (path === '' || path === '/') continue;
    } catch {
      continue;
    }

    const username = normalizeUsername(textContent);
    if (!username) continue;

    const [profileUrl, warning] = validateProfileUrl(href, username);
    if (warning) warnings.push(warning);

    const timestamp = extractTimestamp(anchor);

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
 * Uses DOMParser (available in Web Workers on modern browsers).
 */
export function parseHtmlFile(
  content: string,
  fileName: string
): HtmlParseResult {
  const warnings: string[] = [];

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(content, 'text/html');

    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('DOMParser returned an error document');
    }
  } catch {
    throw {
      code: 'INVALID_HTML',
      message: `Failed to parse HTML in ${fileName}`,
    };
  }

  if (!validateHtmlExport(doc)) {
    throw {
      code: 'UNSUPPORTED_FORMAT',
      message: `${fileName} doesn't appear to be an Instagram export (no Instagram links found)`,
    };
  }

  const accounts = parseHtmlAccounts(doc, warnings);
  const fileType = detectHtmlFileType(fileName, doc);

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
