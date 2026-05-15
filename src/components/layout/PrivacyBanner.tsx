/**
 * Privacy notice banner displayed before first upload.
 * Dismissal persisted in localStorage.
 * See: docs/features/01_file_processing.md §10.1
 */

'use client';

import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { PRIVACY_NOTICE_KEY } from '@/lib/utils/constants';

export function PrivacyBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Default hidden to prevent flash

  useEffect(() => {
    const dismissed = localStorage.getItem(PRIVACY_NOTICE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PRIVACY_NOTICE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-glow">
      <Shield className="w-5 h-5 text-accent-primary shrink-0" />
      <p className="flex-1 text-sm text-text-secondary">
        <span className="text-text-primary font-medium">Your data never leaves your device.</span>{' '}
        All processing happens right here in your browser. Nothing is uploaded to any server.
      </p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors shrink-0"
        aria-label="Dismiss privacy notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
