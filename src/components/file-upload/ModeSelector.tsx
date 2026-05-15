/**
 * Mode selector tabs: ZIP | JSON Files | HTML Files
 * See: docs/features/01_file_processing.md §6.1
 */

'use client';

import type { UploadMode } from '@/types/ui';
import { cn } from '@/lib/utils/cn';
import { Archive, FileJson, FileText } from 'lucide-react';

interface ModeSelectorProps {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  disabled?: boolean;
}

const modes: { value: UploadMode; label: string; icon: typeof Archive; description: string }[] = [
  {
    value: 'zip',
    label: 'ZIP',
    icon: Archive,
    description: 'Upload a .zip export',
  },
  {
    value: 'json',
    label: 'JSON Files',
    icon: FileJson,
    description: 'Upload .json files',
  },
  {
    value: 'html',
    label: 'HTML Files',
    icon: FileText,
    description: 'Upload .html files',
  },
];

export function ModeSelector({ mode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 p-1 rounded-xl bg-bg-secondary border border-border-subtle">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.value;

        return (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-bg-tertiary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="w-4 h-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
