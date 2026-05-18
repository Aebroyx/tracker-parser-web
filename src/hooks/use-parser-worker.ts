/**
 * Hook for managing Web Worker lifecycle and parse communication.
 * Bridge between parser.service and React components.
 */

'use client';

import { useRef, useCallback, useState } from 'react';
import type { ParsedExport } from '@/types/instagram';
import type { ParseStage, ParseError } from '@/types/parser';
import { createParserWorker, parseFile } from '@/services/parser/parser.service';

interface ParserWorkerState {
  status: 'idle' | 'loading' | 'success' | 'error';
  stage: ParseStage | null;
  progress: number;
  result: ParsedExport | null;
  error: ParseError | null;
}

export function useParserWorker() {
  const workerRef = useRef<Worker | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<ParserWorkerState>({
    status: 'idle',
    stage: null,
    progress: 0,
    result: null,
    error: null,
  });

  const ensureWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = createParserWorker();
    }
    return workerRef.current;
  }, []);

  const parse = useCallback((file: File, fileType: 'json' | 'html' | 'zip') => {
    // Cancel any in-progress parse
    if (cancelRef.current) {
      cancelRef.current();
    }

    setState({
      status: 'loading',
      stage: null,
      progress: 0,
      result: null,
      error: null,
    });

    const worker = ensureWorker();

    const { cancel } = parseFile(worker, file, fileType, {
      onProgress: (stage, percent) => {
        setState((prev) => ({
          ...prev,
          stage,
          progress: percent,
        }));
      },
      onSuccess: (result) => {
        setState({
          status: 'success',
          stage: null,
          progress: 100,
          result,
          error: null,
        });
        cancelRef.current = null;
      },
      onError: (error) => {
        setState({
          status: 'error',
          stage: null,
          progress: 0,
          result: null,
          error,
        });
        cancelRef.current = null;
      },
    });

    cancelRef.current = cancel;
  }, [ensureWorker]);

  /**
   * Parse a single file and return the result as a Promise.
   * Used for sequential multi-file uploads (JSON/HTML modes).
   */
  const parseAsync = useCallback(
    (file: File, fileType: 'json' | 'html' | 'zip'): Promise<ParsedExport> => {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }

      setState({
        status: 'loading',
        stage: null,
        progress: 0,
        result: null,
        error: null,
      });

      const worker = ensureWorker();

      return new Promise((resolve, reject) => {
        const { cancel } = parseFile(worker, file, fileType, {
          onProgress: (stage, percent) => {
            setState((prev) => ({
              ...prev,
              stage,
              progress: percent,
            }));
          },
          onSuccess: (result) => {
            setState({
              status: 'success',
              stage: null,
              progress: 100,
              result,
              error: null,
            });
            cancelRef.current = null;
            resolve(result);
          },
          onError: (error) => {
            setState({
              status: 'error',
              stage: null,
              progress: 0,
              result: null,
              error,
            });
            cancelRef.current = null;
            reject(error);
          },
        });
        cancelRef.current = cancel;
      });
    },
    [ensureWorker]
  );

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    // Terminate and recreate the worker for a clean state
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState({
      status: 'idle',
      stage: null,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    ...state,
    parse,
    parseAsync,
    cancel,
    reset,
  };
}
