/**
 * High-level parser service API.
 * Orchestrates the Web Worker and provides a clean interface for hooks.
 * See: docs/ARCHITECTURE.md §2.1 (services layer)
 */

import type { ParsedExport } from '@/types/instagram';
import type { WorkerOutboundMessage, ParseStage, ParseError } from '@/types/parser';
import { v4 as uuidv4 } from 'uuid';
import { PARSE_TIMEOUT_MS } from '@/lib/utils/constants';

export interface ParseCallbacks {
  onProgress: (stage: ParseStage, percent: number) => void;
  onSuccess: (result: ParsedExport) => void;
  onError: (error: ParseError) => void;
}

/**
 * Create a parser Worker instance.
 * Returns a cleanup function to terminate the Worker.
 */
export function createParserWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url));
}

/**
 * Parse a file using the Web Worker.
 * Returns a cleanup function to cancel the operation.
 */
export function parseFile(
  worker: Worker,
  file: File,
  fileType: 'json' | 'html' | 'zip',
  callbacks: ParseCallbacks
): { cancel: () => void; fileId: string } {
  const fileId = uuidv4();

  // Set up timeout
  const timeoutId = setTimeout(() => {
    callbacks.onError({
      code: 'PARSE_TIMEOUT',
      message: 'Parsing timed out after 30 seconds. The file may be too large.',
      fileName: file.name,
    });
    worker.terminate();
  }, PARSE_TIMEOUT_MS);

  // Listen for worker messages
  const handleMessage = (event: MessageEvent<WorkerOutboundMessage>) => {
    const { type, payload } = event.data;

    // Only handle messages for this fileId
    if (payload.fileId !== fileId) return;

    switch (type) {
      case 'PROGRESS':
        callbacks.onProgress(payload.stage, payload.percent);
        break;
      case 'SUCCESS':
        clearTimeout(timeoutId);
        callbacks.onSuccess(payload.result);
        break;
      case 'ERROR':
        clearTimeout(timeoutId);
        callbacks.onError(payload.error);
        break;
    }
  };

  const handleError = () => {
    clearTimeout(timeoutId);
    callbacks.onError({
      code: 'UNKNOWN',
      message: 'The parser worker crashed unexpectedly.',
      fileName: file.name,
    });
  };

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);

  // Send the file to the worker
  if (fileType === 'zip') {
    file.arrayBuffer().then((buffer) => {
      worker.postMessage({
        type: 'PARSE_ZIP',
        payload: { fileId, arrayBuffer: buffer, fileName: file.name },
      }, [buffer]); // Transfer ownership for performance
    });
  } else {
    file.text().then((content) => {
      const messageType = fileType === 'json' ? 'PARSE_JSON' : 'PARSE_HTML';
      worker.postMessage({
        type: messageType,
        payload: { fileId, content, fileName: file.name },
      });
    });
  }

  return {
    fileId,
    cancel: () => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.postMessage({ type: 'CANCEL', payload: { fileId } });
    },
  };
}
