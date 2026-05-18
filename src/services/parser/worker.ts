/**
 * Web Worker entry point for parsing Instagram exports.
 * Runs in a background thread to keep the UI responsive.
 * See: docs/ARCHITECTURE.md §4
 */

import type { WorkerInboundMessage, WorkerOutboundMessage } from '@/types/parser';
import type { ParsedExport, ParseMeta } from '@/types/instagram';
import { v4 as uuidv4 } from 'uuid';
import { parseJsonFile, deduplicateAccounts } from './instagram-parser';
import { parseHtmlFile } from './html-parser';
import { extractZip } from './zip-handler';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendMessage(msg: WorkerOutboundMessage): void {
  self.postMessage(msg);
}

function sendProgress(fileId: string, stage: WorkerOutboundMessage extends { type: 'PROGRESS' } ? WorkerOutboundMessage['payload']['stage'] : string, percent: number): void {
  sendMessage({
    type: 'PROGRESS',
    payload: { fileId, stage: stage as import('@/types/parser').ParseStage, percent },
  });
}

function sendSuccess(fileId: string, result: ParsedExport): void {
  sendMessage({ type: 'SUCCESS', payload: { fileId, result } });
}

function sendError(fileId: string, code: string, message: string, details?: string, fileName?: string): void {
  sendMessage({
    type: 'ERROR',
    payload: {
      fileId,
      error: {
        code: code as import('@/types/parser').ParseErrorCode,
        message,
        details,
        fileName,
      },
    },
  });
}

function buildMeta(
  startTime: number,
  formatVersion: ParseMeta['formatVersion'],
  sourceFiles: string[],
  followerCount: number,
  followingCount: number,
  warnings: string[]
): ParseMeta {
  return {
    id: uuidv4(),
    parsedAt: new Date().toISOString(),
    formatVersion,
    sourceFiles,
    followerCount,
    followingCount,
    parseDurationMs: Date.now() - startTime,
    warnings,
  };
}

// ─── JSON Handler ────────────────────────────────────────────────────────────

async function handleParseJson(fileId: string, content: string, fileName: string): Promise<void> {
  const startTime = Date.now();

  sendProgress(fileId, 'detecting', 20);
  sendProgress(fileId, 'parsing', 40);

  const result = parseJsonFile(content, fileName);

  sendProgress(fileId, 'normalizing', 80);

  const meta = buildMeta(
    startTime,
    result.formatVersion,
    [fileName],
    result.followers.length,
    result.following.length,
    result.warnings
  );

  sendProgress(fileId, 'normalizing', 100);

  sendSuccess(fileId, {
    followers: result.followers,
    following: result.following,
    meta,
  });
}

// ─── HTML Handler ────────────────────────────────────────────────────────────

async function handleParseHtml(fileId: string, content: string, fileName: string): Promise<void> {
  const startTime = Date.now();

  sendProgress(fileId, 'detecting', 20);
  sendProgress(fileId, 'parsing', 40);

  const result = parseHtmlFile(content, fileName);

  sendProgress(fileId, 'normalizing', 80);

  const meta = buildMeta(
    startTime,
    'html',
    [fileName],
    result.followers.length,
    result.following.length,
    result.warnings
  );

  sendProgress(fileId, 'normalizing', 100);

  sendSuccess(fileId, {
    followers: result.followers,
    following: result.following,
    meta,
  });
}

// ─── ZIP Handler ─────────────────────────────────────────────────────────────

async function handleParseZip(fileId: string, arrayBuffer: ArrayBuffer): Promise<void> {
  const startTime = Date.now();
  const allWarnings: string[] = [];

  sendProgress(fileId, 'extracting', 10);

  const { followerFiles, followingFiles, warnings: extractWarnings } = await extractZip(
    arrayBuffer,
    (percent) => sendProgress(fileId, 'extracting', Math.round(percent * 0.3))
  );

  allWarnings.push(...extractWarnings);

  sendProgress(fileId, 'detecting', 35);

  sendProgress(fileId, 'parsing', 40);

  let allFollowers: import('@/types/instagram').InstagramAccount[] = [];
  let allFollowing: import('@/types/instagram').InstagramAccount[] = [];
  let detectedFormat: ParseMeta['formatVersion'] = 'unknown';
  const allSourceFiles: string[] = [];

  // Parse follower files
  const totalFiles = followerFiles.length + followingFiles.length;
  let filesProcessed = 0;

  for (const file of followerFiles) {
    allSourceFiles.push(file.name);

    if (file.type === 'html') {
      const result = parseHtmlFile(file.content, file.name);
      allFollowers.push(...result.followers);
      allWarnings.push(...result.warnings);
      detectedFormat = 'html';
    } else {
      const result = parseJsonFile(file.content, file.name);
      allFollowers.push(...result.followers);
      allWarnings.push(...result.warnings);
      if (detectedFormat === 'unknown') detectedFormat = result.formatVersion;
    }

    filesProcessed++;
    sendProgress(fileId, 'parsing', 40 + Math.round((filesProcessed / totalFiles) * 40));
  }

  // Parse following files
  for (const file of followingFiles) {
    allSourceFiles.push(file.name);

    if (file.type === 'html') {
      const result = parseHtmlFile(file.content, file.name);
      allFollowing.push(...result.following);
      allWarnings.push(...result.warnings);
      detectedFormat = 'html';
    } else {
      const result = parseJsonFile(file.content, file.name);
      allFollowing.push(...result.following);
      allWarnings.push(...result.warnings);
      if (detectedFormat === 'unknown') detectedFormat = result.formatVersion;
    }

    filesProcessed++;
    sendProgress(fileId, 'parsing', 40 + Math.round((filesProcessed / totalFiles) * 40));
  }

  sendProgress(fileId, 'normalizing', 85);

  // Deduplicate merged results
  allFollowers = deduplicateAccounts(allFollowers);
  allFollowing = deduplicateAccounts(allFollowing);

  const meta = buildMeta(
    startTime,
    detectedFormat,
    allSourceFiles,
    allFollowers.length,
    allFollowing.length,
    allWarnings
  );

  sendProgress(fileId, 'normalizing', 100);

  sendSuccess(fileId, {
    followers: allFollowers,
    following: allFollowing,
    meta,
  });
}

// ─── Message Router ──────────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'PARSE_JSON':
        await handleParseJson(payload.fileId, payload.content, payload.fileName);
        break;
      case 'PARSE_HTML':
        await handleParseHtml(payload.fileId, payload.content, payload.fileName);
        break;
      case 'PARSE_ZIP':
        await handleParseZip(
          payload.fileId,
          (payload as { fileId: string; arrayBuffer: ArrayBuffer; fileName: string }).arrayBuffer
        );
        break;
      case 'CANCEL':
        // Currently a no-op — Worker terminates from main thread
        break;
    }
  } catch (error: unknown) {
    const fileId = payload.fileId;
    if (error && typeof error === 'object' && 'code' in error) {
      const parseError = error as { code: string; message: string; details?: string };
      sendError(fileId, parseError.code, parseError.message, parseError.details);
    } else if (error instanceof Error) {
      sendError(fileId, 'UNKNOWN', error.message, error.stack);
    } else {
      sendError(fileId, 'UNKNOWN', 'An unexpected error occurred during parsing', String(error));
    }
  }
};
