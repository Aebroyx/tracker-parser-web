/**
 * Privacy notice banner displayed before first upload.
 * Dismissal persisted in localStorage.
 * See: docs/features/01_file_processing.md §10.1
 */

'use client';

import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { PRIVACY_NOTICE_KEY } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';

export function PrivacyBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Default hidden to prevent flash

  useEffect(() => {
    const dismissed = localStorage.getItem(PRIVACY_NOTICE_KEY) === 'true';
    queueMicrotask(() => setIsDismissed(dismissed));
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PRIVACY_NOTICE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-bg-secondary">
      <Shield className="w-5 h-5 text-accent-primary shrink-0" />
      <p className="flex-1 text-sm text-text-secondary">
        <span className="text-text-primary font-medium">Your data never leaves your device.</span>{' '}
        All processing happens right here in your browser. Nothing is uploaded to any server.
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        aria-label="Dismiss privacy notice"
        className="text-text-muted sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
