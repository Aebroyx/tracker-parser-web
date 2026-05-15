/**
 * Web Worker communication protocol types.
 * See: docs/ARCHITECTURE.md §4
 */

import type { ParsedExport } from './instagram';

// ─── Main Thread → Worker Messages ───────────────────────────────────────────

export type WorkerInboundMessage =
  | { type: 'PARSE_JSON'; payload: { fileId: string; content: string; fileName: string } }
  | { type: 'PARSE_HTML'; payload: { fileId: string; content: string; fileName: string } }
  | { type: 'PARSE_ZIP'; payload: { fileId: string; arrayBuffer: ArrayBuffer; fileName: string } }
  | { type: 'CANCEL'; payload: { fileId: string } };

// ─── Worker → Main Thread Messages ──────────────────────────────────────────

export type WorkerOutboundMessage =
  | { type: 'PROGRESS'; payload: { fileId: string; stage: ParseStage; percent: number } }
  | { type: 'SUCCESS'; payload: { fileId: string; result: ParsedExport } }
  | { type: 'ERROR'; payload: { fileId: string; error: ParseError } };

// ─── Parse Stages ────────────────────────────────────────────────────────────

export type ParseStage =
  | 'extracting'     // Unzipping archive
  | 'detecting'      // Detecting format version (JSON vs HTML, current vs legacy)
  | 'parsing'        // Parsing JSON structures or HTML DOM
  | 'normalizing';   // Normalizing to canonical model

// ─── Parse Error ─────────────────────────────────────────────────────────────

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  details?: string;     // Technical details (for console, not user)
  fileName?: string;    // Which file caused the error
}

export type ParseErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_HTML'
  | 'UNSUPPORTED_FORMAT'
  | 'MISSING_FILES'
  | 'MIXED_FORMATS'
  | 'ZIP_EXTRACTION_FAILED'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_DATA'
  | 'PARSE_TIMEOUT'
  | 'UNKNOWN';

// ─── Content Type Detection ─────────────────────────────────────────────────

export type ContentType = 'json' | 'html' | 'unknown';
export type JsonFormatVersion = 'current-json' | 'legacy-json' | 'unknown';
