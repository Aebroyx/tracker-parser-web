/**
 * ZIP extraction and file discovery for Instagram exports.
 * See: docs/features/01_file_processing.md §3.2
 */

import JSZip from 'jszip';
import {
  MAX_ZIP_FILE_COUNT,
  MAX_SINGLE_FILE_SIZE_BYTES,
  FILE_PATTERNS,
} from '@/lib/utils/constants';

export interface ZipExtractedFile {
  name: string;
  content: string;
  type: 'json' | 'html';
}

export interface ZipExtractionResult {
  followerFiles: ZipExtractedFile[];
  followingFiles: ZipExtractedFile[];
  warnings: string[];
}

/**
 * Extract and discover Instagram follower/following files from a ZIP archive.
 *
 * Rules:
 * - Only .json and .html files are extracted
 * - Path traversal entries (../) are rejected
 * - Max 1000 files allowed (ZIP bomb detection)
 * - Files are matched against known Instagram path patterns
 * - Mixed JSON+HTML in same ZIP is rejected
 */
export async function extractZip(
  arrayBuffer: ArrayBuffer,
  onProgress?: (percent: number) => void
): Promise<ZipExtractionResult> {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    throw {
      code: 'ZIP_EXTRACTION_FAILED',
      message: 'Failed to open ZIP file. It may be corrupted.',
    };
  }

  // ZIP bomb detection
  const fileCount = Object.keys(zip.files).length;
  if (fileCount > MAX_ZIP_FILE_COUNT) {
    throw {
      code: 'ZIP_EXTRACTION_FAILED',
      message: `ZIP contains ${fileCount} files (max: ${MAX_ZIP_FILE_COUNT}). Possibly a ZIP bomb.`,
    };
  }

  const warnings: string[] = [];
  const followerFiles: ZipExtractedFile[] = [];
  const followingFiles: ZipExtractedFile[] = [];
  let jsonFound = false;
  let htmlFound = false;

  const entries = Object.entries(zip.files);
  let processed = 0;

  for (const [path, file] of entries) {
    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / entries.length) * 100));
    }

    // Skip directories
    if (file.dir) continue;

    // Block path traversal
    if (path.includes('../') || path.includes('..\\')) {
      warnings.push(`Skipped suspicious path: ${path}`);
      continue;
    }

    // Only process .json and .html files
    const lowerPath = path.toLowerCase();
    const isJson = lowerPath.endsWith('.json');
    const isHtml = lowerPath.endsWith('.html') || lowerPath.endsWith('.htm');

    if (!isJson && !isHtml) continue;

    // Track format types for mixed format detection
    if (isJson) jsonFound = true;
    if (isHtml) htmlFound = true;

    // Check file size
    const content = await file.async('string');
    if (content.length > MAX_SINGLE_FILE_SIZE_BYTES) {
      warnings.push(`Skipped ${path}: file exceeds 100MB limit`);
      continue;
    }

    const type = isJson ? 'json' : 'html';
    const extracted: ZipExtractedFile = { name: path, content, type };

    // Match against known patterns
    if (FILE_PATTERNS.followers.test(path)) {
      followerFiles.push(extracted);
    } else if (FILE_PATTERNS.following.test(path)) {
      followingFiles.push(extracted);
    }
    // Files not matching known patterns are silently ignored
  }

  // Reject mixed formats in same ZIP
  if (jsonFound && htmlFound) {
    // Check if the MATCHED files are mixed (not just random files in the ZIP)
    const matchedJsonCount = [...followerFiles, ...followingFiles].filter(f => f.type === 'json').length;
    const matchedHtmlCount = [...followerFiles, ...followingFiles].filter(f => f.type === 'html').length;

    if (matchedJsonCount > 0 && matchedHtmlCount > 0) {
      throw {
        code: 'MIXED_FORMATS',
        message: 'This ZIP contains both JSON and HTML Instagram export files. Please re-download your data in a single format.',
      };
    }
  }

  if (followerFiles.length === 0 && followingFiles.length === 0) {
    throw {
      code: 'MISSING_FILES',
      message: 'No follower/following files found in the ZIP. Make sure you selected "Followers and Following" when requesting your data.',
    };
  }

  return { followerFiles, followingFiles, warnings };
}
