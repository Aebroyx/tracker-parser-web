/**
 * Single-slot drop zone for JSON/HTML dual-upload (followers or following).
 * See: docs/features/01_file_processing.md §10.2
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import type { FileSlotCategory, SlotVisualState, UploadMode } from '@/types/ui';
import { cn } from '@/lib/utils/cn';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileSlotDropZoneProps {
  category: FileSlotCategory;
  mode: 'json' | 'html';
  state: SlotVisualState;
  onFiles: (files: FileList | File[]) => void;
  accountCount?: number;
  fileName?: string;
  errorMessage?: string;
  progress?: number;
  stageLabel?: string;
  onCancel?: () => void;
  /** Allow multiple files (followers pagination) */
  multiple?: boolean;
}

const slotLabels: Record<FileSlotCategory, string> = {
  followers: 'Followers',
  following: 'Following',
};

const slotHints: Record<FileSlotCategory, Record<'json' | 'html', string>> = {
  followers: {
    json: 'e.g. followers_1.json',
    html: 'e.g. followers_1.html',
  },
  following: {
    json: 'e.g. following.json',
    html: 'e.g. following.html',
  },
};

const modeAccept: Record<'json' | 'html', string> = {
  json: '.json',
  html: '.html,.htm',
};

function truncateFileName(name: string, max = 22): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function FileSlotDropZone({
  category,
  mode,
  state,
  onFiles,
  accountCount = 0,
  fileName,
  errorMessage,
  progress = 0,
  stageLabel,
  onCancel,
  multiple = false,
}: FileSlotDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const effectiveState = isDragOver ? 'drag-over' : state;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  const handleClick = useCallback(() => {
    if (state === 'parsing') return;
    inputRef.current?.click();
  }, [state]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(e.target.files);
      }
      e.target.value = '';
    },
    [onFiles]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-sm font-medium text-text-primary">
          {slotLabels[category]}
        </p>
        <p className="text-xs text-text-muted">{slotHints[category][mode]}</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-dashed transition-all duration-150 cursor-pointer min-h-[180px]',
          effectiveState === 'idle' &&
            'border-border-default hover:border-border-default/80 bg-bg-secondary/30',
          effectiveState === 'drag-over' &&
            'border-accent-primary bg-bg-tertiary/60 scale-[1.01]',
          effectiveState === 'parsing' &&
            'border-accent-primary/50 bg-bg-secondary/30 cursor-wait',
          effectiveState === 'loaded' &&
            'border-accent-green bg-bg-secondary/30',
          effectiveState === 'error' && 'border-accent-red bg-bg-secondary/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={modeAccept[mode]}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-tertiary">
          {effectiveState === 'error' && (
            <AlertCircle className="w-5 h-5 text-accent-red" />
          )}
          {effectiveState === 'loaded' && (
            <CheckCircle className="w-5 h-5 text-accent-green" />
          )}
          {effectiveState === 'parsing' && (
            <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
          )}
          {(effectiveState === 'idle' || effectiveState === 'drag-over') && (
            <Upload
              className={cn(
                'w-5 h-5 text-text-secondary',
                effectiveState === 'drag-over' && 'text-accent-primary'
              )}
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-center px-2">
          {effectiveState === 'idle' && (
            <>
              <p className="text-xs font-medium text-text-primary">
                Drop file here
              </p>
              <p className="text-xs text-text-secondary">or click to browse</p>
            </>
          )}

          {effectiveState === 'drag-over' && (
            <p className="text-xs font-medium text-accent-primary">Drop to upload</p>
          )}

          {effectiveState === 'parsing' && (
            <div className="flex flex-col items-center gap-2 w-full max-w-[140px]">
              <p className="text-xs text-text-secondary capitalize">
                {stageLabel || 'Processing'}…
              </p>
              <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--accent-primary)',
                  }}
                />
              </div>
              {onCancel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  className="text-xs text-text-secondary hover:text-text-primary underline transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {effectiveState === 'loaded' && (
            <>
              <p className="text-xs font-medium text-accent-green">
                {accountCount.toLocaleString()} accounts
              </p>
              {fileName && (
                <p className="text-xs text-text-muted truncate max-w-full">
                  {truncateFileName(fileName)}
                </p>
              )}
              <p className="text-xs text-text-secondary">Click to replace</p>
            </>
          )}

          {effectiveState === 'error' && (
            <>
              <p className="text-xs font-medium text-accent-red leading-snug">
                {errorMessage || 'Something went wrong'}
              </p>
              <p className="text-xs text-text-secondary">Click to try again</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
