/**
 * Collapsible help section explaining how to get an Instagram export.
 * See: docs/features/01_file_processing.md §10.4
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const steps = [
  'Open Instagram → Settings → Accounts Center',
  'Your Information and Permissions → Download Your Information',
  'Select "Some of your information"',
  'Check "Followers and Following"',
  'Choose JSON or HTML format (both are supported)',
  'Download and upload the .zip file here',
];

export function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <HelpCircle className="w-4 h-4 shrink-0" />
        <span className="font-medium">How to get your Instagram data export</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 ml-auto shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <ol className="px-4 pb-4 space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-secondary">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-bg-tertiary text-xs text-text-muted shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
