/**
 * Drag-and-drop upload zone with visual state feedback.
 * See: docs/features/01_file_processing.md §10.2
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import type { UploadMode, DropZoneState } from '@/types/ui';
import { cn } from '@/lib/utils/cn';
import { Upload, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface DropZoneProps {
  mode: UploadMode;
  state: DropZoneState;
  onFiles: (files: FileList | File[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  /** Number of followers parsed so far (for incomplete/ready states) */
  followerCount?: number;
  /** Number of following parsed so far */
  followingCount?: number;
  /** Error message to display */
  errorMessage?: string;
  /** Parse progress (0-100) */
  progress?: number;
  /** Current parse stage label */
  stageLabel?: string;
  /** Callback for cancel button */
  onCancel?: () => void;
  /** Callback for "Save Snapshot" */
  onSave?: () => void;
}

const modeAccept: Record<UploadMode, string> = {
  zip: '.zip',
  json: '.json',
  html: '.html,.htm',
};

const modeLabel: Record<UploadMode, string> = {
  zip: '.zip files',
  json: '.json files',
  html: '.html files',
};

export function DropZone({
  mode,
  state,
  onFiles,
  followerCount = 0,
  followingCount = 0,
  errorMessage,
  progress = 0,
  stageLabel,
  onCancel,
  onSave,
}: DropZoneProps) {
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
    if (state === 'parsing' || state === 'uploading') return;
    inputRef.current?.click();
  }, [state]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(e.target.files);
      }
      // Reset input so the same file can be re-uploaded
      e.target.value = '';
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed transition-all duration-150 cursor-pointer min-h-[220px]',
        effectiveState === 'idle' && 'border-border-default hover:border-border-default/80 bg-bg-secondary/30',
        effectiveState === 'drag-over' && 'border-accent-primary bg-bg-tertiary/60 scale-[1.01]',
        effectiveState === 'uploading' && 'border-border-default bg-bg-secondary/30 cursor-wait',
        effectiveState === 'parsing' && 'border-accent-primary/50 bg-bg-secondary/30 cursor-wait',
        effectiveState === 'incomplete' && 'border-accent-amber bg-bg-secondary/30',
        effectiveState === 'ready' && 'border-accent-green bg-bg-secondary/30',
        effectiveState === 'error' && 'border-accent-red bg-bg-secondary/30'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={modeAccept[mode]}
        multiple={mode !== 'zip'}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-bg-tertiary">
        {effectiveState === 'error' && <AlertCircle className="w-6 h-6 text-accent-red" />}
        {effectiveState === 'ready' && <CheckCircle className="w-6 h-6 text-accent-green" />}
        {effectiveState === 'incomplete' && <Info className="w-6 h-6 text-accent-amber" />}
        {(effectiveState === 'uploading' || effectiveState === 'parsing') && (
          <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
        )}
        {(effectiveState === 'idle' || effectiveState === 'drag-over') && (
          <Upload className={cn('w-6 h-6 text-text-secondary', effectiveState === 'drag-over' && 'text-accent-primary')} />
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center gap-1 text-center">
        {effectiveState === 'idle' && (
          <>
            <p className="text-sm font-medium text-text-primary">
              Drag & drop your Instagram export here
            </p>
            <p className="text-xs text-text-secondary">or click to browse files</p>
          </>
        )}

        {effectiveState === 'drag-over' && (
          <p className="text-sm font-medium text-accent-primary">Drop to upload</p>
        )}

        {effectiveState === 'uploading' && (
          <p className="text-sm text-text-secondary">Reading file…</p>
        )}

        {effectiveState === 'parsing' && (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <p className="text-sm text-text-secondary capitalize">
              {stageLabel || 'Processing'}…
            </p>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${progress}%`,
                  background: 'var(--accent-primary)',
                }}
              />
            </div>
            <p className="text-xs text-text-muted">{progress}%</p>
            {onCancel && (
              <button
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

        {effectiveState === 'incomplete' && (
          <>
            <p className="text-sm font-medium text-accent-amber">
              {followerCount > 0
                ? `Followers loaded (${followerCount.toLocaleString()} accounts)`
                : `Following loaded (${followingCount.toLocaleString()} accounts)`}
            </p>
            <p className="text-xs text-text-secondary">
              Upload your {followerCount > 0 ? 'following' : 'followers'} file to complete the snapshot
            </p>
          </>
        )}

        {effectiveState === 'ready' && (
          <>
            <p className="text-sm font-medium text-accent-green">
              Ready! {followerCount.toLocaleString()} followers, {followingCount.toLocaleString()} following
            </p>
            {onSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className="btn-primary mt-2 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Snapshot
              </button>
            )}
          </>
        )}

        {effectiveState === 'error' && (
          <>
            <p className="text-sm font-medium text-accent-red">
              {errorMessage || 'Something went wrong'}
            </p>
            <p className="text-xs text-text-secondary">Click to try again</p>
          </>
        )}
      </div>

      {/* Footer info */}
      {(effectiveState === 'idle' || effectiveState === 'drag-over') && (
        <div className="flex flex-col items-center gap-0.5 text-xs text-text-muted">
          <span>Supports: {modeLabel[mode]}</span>
          <span>Max size: 500MB</span>
        </div>
      )}
    </div>
  );
}
