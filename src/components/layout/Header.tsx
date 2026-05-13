/**
 * App header with navigation.
 */

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'var(--gradient-accent)' }}>
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
          IG Tracker
        </span>
      </Link>

      <nav className="flex items-center gap-1">
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
