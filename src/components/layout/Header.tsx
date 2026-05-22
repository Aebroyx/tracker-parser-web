/**
 * App header with navigation.
 * Mobile: overflow menu (Phase 6). Desktop: inline nav.
 * See: docs/features/06_mobile_responsive.md §5.1
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { HeaderClearData } from '@/components/layout/HeaderClearData';
import { HeaderExportData } from '@/components/layout/HeaderExportData';
import { APP_NAME } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

const GITHUB_URL = 'https://github.com/Aebroyx/tracker-parser-web';

function DesktopNav() {
  return (
    <nav className="hidden sm:flex items-center gap-2">
      <HeaderExportData />
      <HeaderClearData />
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        GitHub
      </a>
    </nav>
  );
}

function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-1 z-50 min-w-[180px]',
            'rounded-xl border border-border-subtle bg-bg-secondary py-1 shadow-lg'
          )}
        >
          <div
            className="flex flex-col [&_button]:w-full [&_button]:justify-start [&_button]:rounded-none [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm"
            onClick={() => setOpen(false)}
          >
            <HeaderExportData />
            <HeaderClearData />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-subtle">
      <Link href="/" className="flex items-center gap-2 group min-w-0">
        <div
          className="spectral-icon-wrap flex items-center justify-center w-8 h-8 rounded-lg text-base leading-none shrink-0"
          aria-hidden
        >
          👻
        </div>
        <span className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
          {APP_NAME}
        </span>
      </Link>

      <DesktopNav />
      <MobileNavMenu />
    </header>
  );
}
