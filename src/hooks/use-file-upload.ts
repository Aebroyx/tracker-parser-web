/**
 * Hook for managing file upload state, mode selection, and replace logic.
 * See: docs/features/01_file_processing.md §6
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ParsedExport, ParseMeta, InstagramAccount } from '@/types/instagram';
import type {
  UploadMode,
  DropZoneState,
  FileSlotCategory,
  SlotVisualState,
} from '@/types/ui';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_EXTENSIONS } from '@/lib/utils/constants';
import { deduplicateAccounts } from '@/services/parser/instagram-parser';
import { useParserWorker } from './use-parser-worker';

interface FileUploadState {
  mode: UploadMode;
  dropZoneState: DropZoneState;
  validationError: string | null;
  pendingFollowers: ParsedExport['followers'] | null;
  pendingFollowing: ParsedExport['following'] | null;
  completedExport: ParsedExport | null;
  partialSourceFiles: string[];
  partialWarnings: string[];
  partialDurationMs: number;
  partialFormatVersion: ParseMeta['formatVersion'];
  followersFileNames: string[];
  followingFileName: string | null;
  followersError: string | null;
  followingError: string | null;
  parsingSlot: FileSlotCategory | null;
}

const initialPartial = {
  partialSourceFiles: [] as string[],
  partialWarnings: [] as string[],
  partialDurationMs: 0,
  partialFormatVersion: 'unknown' as ParseMeta['formatVersion'],
};

const slotResetFields = {
  followersFileNames: [] as string[],
  followingFileName: null as string | null,
  followersError: null as string | null,
  followingError: null as string | null,
  parsingSlot: null as FileSlotCategory | null,
};

function buildCompletedExport(
  pf: InstagramAccount[],
  pfo: InstagramAccount[],
  meta: Pick<
    FileUploadState,
    | 'partialSourceFiles'
    | 'partialWarnings'
    | 'partialDurationMs'
    | 'partialFormatVersion'
  >
): ParsedExport {
  return {
    followers: pf,
    following: pfo,
    meta: {
      id: uuidv4(),
      parsedAt: new Date().toISOString(),
      formatVersion: meta.partialFormatVersion,
      sourceFiles: [...new Set(meta.partialSourceFiles)],
      followerCount: pf.length,
      followingCount: pfo.length,
      parseDurationMs: meta.partialDurationMs,
      warnings: meta.partialWarnings,
    },
  };
}

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
    ...slotResetFields,
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
        ...slotResetFields,
      });
    },
    [parser]
  );

  const validateFile = useCallback(
    (file: File, mode: UploadMode): string | null => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return 'This file exceeds the 500MB limit.';
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const accepted = ACCEPTED_EXTENSIONS[mode] as readonly string[];

      if (!accepted.includes(ext)) {
        const modeLabel =
          mode === 'zip' ? '.zip' : mode === 'json' ? '.json' : '.html';
        return `Please upload ${modeLabel} files. Switch modes for other file types.`;
      }

      return null;
    },
    []
  );

  const mergeZipResult = useCallback(
    (prev: FileUploadState, result: ParsedExport): FileUploadState => ({
      ...prev,
      pendingFollowers: null,
      pendingFollowing: null,
      completedExport: result,
      partialSourceFiles: result.meta.sourceFiles,
      partialWarnings: [...result.meta.warnings],
      partialDurationMs: result.meta.parseDurationMs,
      partialFormatVersion: result.meta.formatVersion,
      validationError: null,
      ...slotResetFields,
    }),
    []
  );

  const applySlotParse = useCallback(
    (
      prev: FileUploadState,
      slot: FileSlotCategory,
      result: ParsedExport,
      uploadedNames: string[]
    ): { next: FileUploadState; slotError: string | null } => {
      const hasFollowers = result.followers.length > 0;
      const hasFollowing = result.following.length > 0;

      if (slot === 'followers') {
        if (hasFollowing && !hasFollowers) {
          return {
            next: prev,
            slotError:
              'This looks like a following file — use the Following slot.',
          };
        }
        if (!hasFollowers) {
          return {
            next: prev,
            slotError: "We couldn't find follower data in this file.",
          };
        }

        const mergedFollowers = deduplicateAccounts([
          ...(prev.pendingFollowers ?? []),
          ...result.followers,
        ]);
        const sourceFiles = [
          ...prev.partialSourceFiles,
          ...result.meta.sourceFiles,
        ];
        const warnings = [...prev.partialWarnings, ...result.meta.warnings];
        const duration = prev.partialDurationMs + result.meta.parseDurationMs;
        const formatVersion = result.meta.formatVersion;
        const pfo = prev.pendingFollowing;

        let completedExport: ParsedExport | null = null;
        if (mergedFollowers.length > 0 && pfo && pfo.length > 0) {
          completedExport = buildCompletedExport(mergedFollowers, pfo, {
            partialSourceFiles: sourceFiles,
            partialWarnings: warnings,
            partialDurationMs: duration,
            partialFormatVersion: formatVersion,
          });
        }

        return {
          next: {
            ...prev,
            pendingFollowers: mergedFollowers,
            completedExport,
            partialSourceFiles: sourceFiles,
            partialWarnings: warnings,
            partialDurationMs: duration,
            partialFormatVersion: formatVersion,
            followersFileNames: [
              ...new Set([...prev.followersFileNames, ...uploadedNames]),
            ],
            followersError: null,
            validationError: null,
          },
          slotError: null,
        };
      }

      if (hasFollowers && !hasFollowing) {
        return {
          next: prev,
          slotError:
            'This looks like a followers file — use the Followers slot.',
        };
      }
      if (!hasFollowing) {
        return {
          next: prev,
          slotError: "We couldn't find following data in this file.",
        };
      }

      const pfo = result.following;
      const pf = prev.pendingFollowers;
      const sourceFiles = [...prev.partialSourceFiles, ...result.meta.sourceFiles];
      const warnings = [...prev.partialWarnings, ...result.meta.warnings];
      const duration = prev.partialDurationMs + result.meta.parseDurationMs;
      const formatVersion = result.meta.formatVersion;

      let completedExport: ParsedExport | null = null;
      if (pf && pf.length > 0 && pfo.length > 0) {
        completedExport = buildCompletedExport(pf, pfo, {
          partialSourceFiles: sourceFiles,
          partialWarnings: warnings,
          partialDurationMs: duration,
          partialFormatVersion: formatVersion,
        });
      }

      return {
        next: {
          ...prev,
          pendingFollowing: pfo,
          completedExport,
          partialSourceFiles: sourceFiles,
          partialWarnings: warnings,
          partialDurationMs: duration,
          partialFormatVersion: formatVersion,
          followingFileName: uploadedNames[uploadedNames.length - 1] ?? null,
          followingError: null,
          validationError: null,
        },
        slotError: null,
      };
    },
    []
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0 || state.mode !== 'zip') return;

      for (const file of fileArray) {
        const error = validateFile(file, 'zip');
        if (error) {
          setState((prev) => ({
            ...prev,
            dropZoneState: 'error',
            validationError: error,
          }));
          return;
        }
      }

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
            ...mergeZipResult(prev, result),
            dropZoneState: 'ready',
          }));
        })
        .catch(() => {
          setState((prev) => ({ ...prev, dropZoneState: 'error' }));
        });
    },
    [state.mode, validateFile, parser, mergeZipResult]
  );

  const handleSlotFiles = useCallback(
    (files: FileList | File[], slot: FileSlotCategory) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;
      if (state.mode !== 'json' && state.mode !== 'html') return;

      const fileType = state.mode === 'json' ? 'json' : 'html';

      for (const file of fileArray) {
        const error = validateFile(file, state.mode);
        if (error) {
          setState((prev) => ({
            ...prev,
            ...(slot === 'followers'
              ? { followersError: error }
              : { followingError: error }),
          }));
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        parsingSlot: slot,
        ...(slot === 'followers'
          ? { followersError: null }
          : { followingError: null }),
        validationError: null,
      }));

      void (async () => {
        try {
          for (const file of fileArray) {
            const result = await parser.parseAsync(file, fileType);
            let stop = false;
            setState((prev) => {
              const { next, slotError } = applySlotParse(prev, slot, result, [
                file.name,
              ]);
              if (slotError) {
                stop = true;
                return {
                  ...prev,
                  parsingSlot: null,
                  ...(slot === 'followers'
                    ? { followersError: slotError }
                    : { followingError: slotError }),
                };
              }
              return { ...next, parsingSlot: slot };
            });
            if (stop) return;
          }
          setState((prev) => ({ ...prev, parsingSlot: null }));
        } catch {
          setState((prev) => ({
            ...prev,
            parsingSlot: null,
            ...(slot === 'followers'
              ? { followersError: 'Something went wrong during parsing.' }
              : { followingError: 'Something went wrong during parsing.' }),
          }));
        }
      })();
    },
    [state, validateFile, parser, applySlotParse]
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
      ...slotResetFields,
    });
  }, [parser, state.mode]);

  const cancel = useCallback(() => {
    parser.cancel();
    setState((prev) => ({
      ...prev,
      parsingSlot: null,
      dropZoneState: prev.mode === 'zip' ? 'idle' : prev.dropZoneState,
    }));
  }, [parser]);

  let derivedDropZoneState = state.dropZoneState;
  if (state.mode === 'zip') {
    if (parser.status === 'loading') {
      derivedDropZoneState = 'parsing';
    } else if (parser.status === 'error' || state.validationError) {
      derivedDropZoneState = 'error';
    } else if (state.completedExport) {
      derivedDropZoneState = 'ready';
    } else if (
      state.dropZoneState !== 'parsing' &&
      state.dropZoneState !== 'error'
    ) {
      derivedDropZoneState = 'idle';
    }
  }

  const getSlotVisualState = useCallback(
    (slot: FileSlotCategory): SlotVisualState => {
      if (state.parsingSlot === slot) return 'parsing';
      if (slot === 'followers' && state.followersError) return 'error';
      if (slot === 'following' && state.followingError) return 'error';

      const count =
        slot === 'followers'
          ? (state.pendingFollowers?.length ?? 0)
          : (state.pendingFollowing?.length ?? 0);
      if (count > 0) return 'loaded';
      return 'idle';
    },
    [state]
  );

  const followersSlotState = useMemo(
    () => getSlotVisualState('followers'),
    [getSlotVisualState]
  );
  const followingSlotState = useMemo(
    () => getSlotVisualState('following'),
    [getSlotVisualState]
  );

  const followersDisplayFileName = useMemo(() => {
    if (state.followersFileNames.length === 0) return undefined;
    if (state.followersFileNames.length === 1) return state.followersFileNames[0];
    return `${state.followersFileNames.length} files`;
  }, [state.followersFileNames]);

  const zipErrorMessage =
    state.validationError ?? parser.error?.message ?? undefined;

  return {
    mode: state.mode,
    dropZoneState: derivedDropZoneState,
    pendingFollowers: state.pendingFollowers,
    pendingFollowing: state.pendingFollowing,
    completedExport: state.completedExport,
    exportReady: state.completedExport,
    validationError: state.validationError,
    followersSlotState,
    followingSlotState,
    followersFileName: followersDisplayFileName,
    followingFileName: state.followingFileName ?? undefined,
    followersError: state.followersError,
    followingError: state.followingError,
    parsingSlot: state.parsingSlot,
    parserStatus: parser.status,
    parserStage: parser.stage,
    parserProgress: parser.progress,
    parserResult: parser.result,
    parserError: parser.error,
    zipErrorMessage,
    setMode,
    handleFiles,
    handleSlotFiles,
    reset,
    cancel,
  };
}
