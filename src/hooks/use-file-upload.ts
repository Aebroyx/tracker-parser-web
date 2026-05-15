/**
 * Hook for managing file upload state, mode selection, and replace logic.
 * See: docs/features/01_file_processing.md §6
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { ParsedExport } from '@/types/instagram';
import type { UploadMode, DropZoneState, FileSlot } from '@/types/ui';
import type { ParseError } from '@/types/parser';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_EXTENSIONS } from '@/lib/utils/constants';
import { useParserWorker } from './use-parser-worker';

interface FileUploadState {
  mode: UploadMode;
  dropZoneState: DropZoneState;
  fileSlots: FileSlot[];
  /** In-memory accumulated parse results for non-ZIP modes */
  pendingFollowers: ParsedExport['followers'] | null;
  pendingFollowing: ParsedExport['following'] | null;
  /** The final merged ParsedExport, ready to save as snapshot */
  completedExport: ParsedExport | null;
}

export function useFileUpload() {
  const parser = useParserWorker();

  const [state, setState] = useState<FileUploadState>({
    mode: 'zip',
    dropZoneState: 'idle',
    fileSlots: [],
    pendingFollowers: null,
    pendingFollowing: null,
    completedExport: null,
  });

  const setMode = useCallback((mode: UploadMode) => {
    // Reset everything when switching modes
    parser.reset();
    setState({
      mode,
      dropZoneState: 'idle',
      fileSlots: [],
      pendingFollowers: null,
      pendingFollowing: null,
      completedExport: null,
    });
  }, [parser]);

  const validateFile = useCallback((file: File): string | null => {
    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'This file exceeds the 500MB limit.';
    }

    // Check extension matches selected mode
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const accepted = ACCEPTED_EXTENSIONS[state.mode] as readonly string[];

    if (!accepted.includes(ext)) {
      const modeLabel = state.mode === 'zip' ? '.zip' : state.mode === 'json' ? '.json' : '.html';
      return `Please upload ${modeLabel} files. Switch modes for other file types.`;
    }

    return null;
  }, [state.mode]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setState((prev) => ({ ...prev, dropZoneState: 'error' }));
        return;
      }
    }

    if (state.mode === 'zip') {
      // ZIP mode: single file, auto-save
      const file = fileArray[0];
      setState((prev) => ({ ...prev, dropZoneState: 'parsing' }));
      parser.parse(file, 'zip');
    } else {
      // JSON/HTML mode: process files individually
      for (const file of fileArray) {
        setState((prev) => ({ ...prev, dropZoneState: 'parsing' }));
        parser.parse(file, state.mode);
      }
    }
  }, [state.mode, parser, validateFile]);

  const reset = useCallback(() => {
    parser.reset();
    setState({
      mode: state.mode,
      dropZoneState: 'idle',
      fileSlots: [],
      pendingFollowers: null,
      pendingFollowing: null,
      completedExport: null,
    });
  }, [parser, state.mode]);

  // Compute derived dropZoneState based on parser status
  let derivedDropZoneState = state.dropZoneState;
  if (parser.status === 'loading') {
    derivedDropZoneState = 'parsing';
  } else if (parser.status === 'error') {
    derivedDropZoneState = 'error';
  } else if (parser.status === 'success' && parser.result) {
    if (state.mode === 'zip') {
      derivedDropZoneState = 'ready';
    } else {
      // Check if both followers and following are populated
      const hasFollowers = (state.pendingFollowers && state.pendingFollowers.length > 0) ||
        (parser.result.followers.length > 0);
      const hasFollowing = (state.pendingFollowing && state.pendingFollowing.length > 0) ||
        (parser.result.following.length > 0);

      if (hasFollowers && hasFollowing) {
        derivedDropZoneState = 'ready';
      } else {
        derivedDropZoneState = 'incomplete';
      }
    }
  }

  return {
    mode: state.mode,
    dropZoneState: derivedDropZoneState,
    fileSlots: state.fileSlots,
    pendingFollowers: state.pendingFollowers,
    pendingFollowing: state.pendingFollowing,
    completedExport: state.completedExport,
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
