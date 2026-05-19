/**
 * App header with navigation.
 */

import Link from 'next/link';
import { HeaderClearData } from '@/components/layout/HeaderClearData';
import { APP_NAME } from '@/lib/utils/constants';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
      <Link href="/" className="flex items-center gap-2 group">
        <div
          className="spectral-icon-wrap flex items-center justify-center w-8 h-8 rounded-lg text-base leading-none"
          aria-hidden
        >
          👻
        </div>
        <span className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
          {APP_NAME}
        </span>
      </Link>

      <nav className="flex items-center gap-2">
        <HeaderClearData />
        <a
          href="https://github.com/Aebroyx/tracker-parser-web"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
