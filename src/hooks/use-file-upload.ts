/**
 * Hook for managing file upload state, mode selection, and replace logic.
 * See: docs/features/01_file_processing.md §6
 */

'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ParsedExport, ParseMeta } from '@/types/instagram';
import type { UploadMode, DropZoneState } from '@/types/ui';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_EXTENSIONS } from '@/lib/utils/constants';
import { useParserWorker } from './use-parser-worker';

interface FileUploadState {
  mode: UploadMode;
  dropZoneState: DropZoneState;
  validationError: string | null;
  /** In-memory accumulated parse results for non-ZIP modes */
  pendingFollowers: ParsedExport['followers'] | null;
  pendingFollowing: ParsedExport['following'] | null;
  /** Merged export ready to persist as a snapshot */
  completedExport: ParsedExport | null;
  /** Accumulative parse meta for multi-file JSON/HTML uploads */
  partialSourceFiles: string[];
  partialWarnings: string[];
  partialDurationMs: number;
  partialFormatVersion: ParseMeta['formatVersion'];
}

const initialPartial = {
  partialSourceFiles: [] as string[],
  partialWarnings: [] as string[],
  partialDurationMs: 0,
  partialFormatVersion: 'unknown' as ParseMeta['formatVersion'],
};

export function useFileUpload() {
  const parser = useParserWorker();

  const [state, setState] = useState<FileUploadState>({
    mode: 'zip',
    dropZoneState: 'idle',
    validationError: null,
    pendingFollowers: null,
    pendingFollowing: null,
    completedExport: null,
    ...initialPartial,
  });

  const setMode = useCallback(
    (mode: UploadMode) => {
      parser.reset();
      setState({
        mode,
        dropZoneState: 'idle',
        validationError: null,
        pendingFollowers: null,
        pendingFollowing: null,
        completedExport: null,
        ...initialPartial,
      });
    },
    [parser]
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return 'This file exceeds the 500MB limit.';
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const accepted = ACCEPTED_EXTENSIONS[state.mode] as readonly string[];

      if (!accepted.includes(ext)) {
        const modeLabel =
          state.mode === 'zip'
            ? '.zip'
            : state.mode === 'json'
              ? '.json'
              : '.html';
        return `Please upload ${modeLabel} files. Switch modes for other file types.`;
      }

      return null;
    },
    [state.mode]
  );

  const mergeFileIntoState = useCallback(
    (prev: FileUploadState, result: ParsedExport, mode: UploadMode): FileUploadState => {
      if (mode === 'zip') {
        return {
          ...prev,
          pendingFollowers: null,
          pendingFollowing: null,
          completedExport: result,
          partialSourceFiles: result.meta.sourceFiles,
          partialWarnings: [...result.meta.warnings],
          partialDurationMs: result.meta.parseDurationMs,
          partialFormatVersion: result.meta.formatVersion,
          validationError: null,
        };
      }

      let pf = prev.pendingFollowers;
      let pfo = prev.pendingFollowing;
      if (result.followers.length > 0) pf = result.followers;
      if (result.following.length > 0) pfo = result.following;

      const sourceFiles = [...prev.partialSourceFiles, ...result.meta.sourceFiles];
      const warnings = [...prev.partialWarnings, ...result.meta.warnings];
      const duration = prev.partialDurationMs + result.meta.parseDurationMs;
      const formatVersion = result.meta.formatVersion;

      let completedExport: ParsedExport | null = null;
      if (pf && pf.length > 0 && pfo && pfo.length > 0) {
        completedExport = {
          followers: pf,
          following: pfo,
          meta: {
            id: uuidv4(),
            parsedAt: new Date().toISOString(),
            formatVersion,
            sourceFiles: [...new Set(sourceFiles)],
            followerCount: pf.length,
            followingCount: pfo.length,
            parseDurationMs: duration,
            warnings,
          },
        };
      }

      return {
        ...prev,
        pendingFollowers: pf ?? null,
        pendingFollowing: pfo ?? null,
        completedExport,
        partialSourceFiles: sourceFiles,
        partialWarnings: warnings,
        partialDurationMs: duration,
        partialFormatVersion: formatVersion,
        validationError: null,
      };
    },
    []
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setState((prev) => ({
            ...prev,
            dropZoneState: 'error',
            validationError: error,
          }));
          return;
        }
      }

      if (state.mode === 'zip') {
        const file = fileArray[0];
        setState((prev) => ({
          ...prev,
          dropZoneState: 'parsing',
          validationError: null,
        }));
        void parser
          .parseAsync(file, 'zip')
          .then((result) => {
            setState((prev) => ({
              ...mergeFileIntoState(prev, result, 'zip'),
              dropZoneState: 'ready',
            }));
          })
          .catch(() => {
            setState((prev) => ({ ...prev, dropZoneState: 'error' }));
          });
        return;
      }

      const fileType = state.mode === 'json' ? 'json' : 'html';
      setState((prev) => ({
        ...prev,
        dropZoneState: 'parsing',
        validationError: null,
      }));

      void (async () => {
        try {
          for (const file of fileArray) {
            const result = await parser.parseAsync(file, fileType);
            setState((prev) => mergeFileIntoState(prev, result, state.mode));
          }
          setState((prev) => {
            const ready = prev.completedExport != null;
            const hasPartial =
              (prev.pendingFollowers?.length ?? 0) > 0 ||
              (prev.pendingFollowing?.length ?? 0) > 0;
            let nextState: DropZoneState = 'idle';
            if (ready) nextState = 'ready';
            else if (hasPartial) nextState = 'incomplete';
            return { ...prev, dropZoneState: nextState };
          });
        } catch {
          setState((prev) => ({ ...prev, dropZoneState: 'error' }));
        }
      })();
    },
    [state.mode, validateFile, parser, mergeFileIntoState]
  );

  const reset = useCallback(() => {
    parser.reset();
    setState({
      mode: state.mode,
      dropZoneState: 'idle',
      validationError: null,
      pendingFollowers: null,
      pendingFollowing: null,
      completedExport: null,
      ...initialPartial,
    });
  }, [parser, state.mode]);

  let derivedDropZoneState = state.dropZoneState;
  if (parser.status === 'loading') {
    derivedDropZoneState = 'parsing';
  } else if (parser.status === 'error') {
    derivedDropZoneState = 'error';
  } else if (state.validationError) {
    derivedDropZoneState = 'error';
  } else if (state.completedExport) {
    derivedDropZoneState = 'ready';
  } else if (
    state.mode !== 'zip' &&
    ((state.pendingFollowers?.length ?? 0) > 0 ||
      (state.pendingFollowing?.length ?? 0) > 0)
  ) {
    derivedDropZoneState = 'incomplete';
  } else if (
    state.dropZoneState !== 'parsing' &&
    state.dropZoneState !== 'error'
  ) {
    derivedDropZoneState = 'idle';
  }

  return {
    mode: state.mode,
    dropZoneState: derivedDropZoneState,
    pendingFollowers: state.pendingFollowers,
    pendingFollowing: state.pendingFollowing,
    completedExport: state.completedExport,
    exportReady: state.completedExport,
    validationError: state.validationError,
    parserStatus: parser.status,
    parserStage: parser.stage,
    parserProgress: parser.progress,
    parserResult: parser.result,
    parserError: parser.error,
    setMode,
    handleFiles,
    reset,
    cancel: parser.cancel,
  };
}
