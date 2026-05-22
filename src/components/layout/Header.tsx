/**
 * App header with navigation.
 *
 * Mobile (<sm): Shadcn DropdownMenu overflow popover (Phase 6 + Phase 7
 * Shadcn UI foundation). Desktop (sm+): inline nav.
 *
 * See: docs/features/06_mobile_responsive.md §5.1,
 *      docs/DESIGN_LANGUAGE.md §5.2.3 (DropdownMenu).
 */

'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { HeaderClearData } from '@/components/layout/HeaderClearData';
import { HeaderExportData } from '@/components/layout/HeaderExportData';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ExportDialog } from '@/components/shared/ExportDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/db/dexie-client';
import { APP_NAME } from '@/lib/utils/constants';
import * as snapshotService from '@/services/snapshot/snapshot.service';
import type { Snapshot } from '@/types/snapshot';

const GITHUB_URL = 'https://github.com/Aebroyx/tracker-parser-web';

function DesktopNav() {
  return (
    <nav className="hidden sm:flex items-center gap-2">
      <HeaderExportData />
      <HeaderClearData />
      <Button asChild variant="ghost" size="sm" className="text-text-secondary">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </Button>
    </nav>
  );
}

/**
 * Mobile overflow menu — Shadcn DropdownMenu items reuse the same data
 * sources (live Dexie queries) and trigger the same dialogs as the
 * desktop nav so behaviour stays identical across breakpoints.
 */
function MobileNavMenu() {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('savedAt').toArray(),
    [],
  ) as Snapshot[] | undefined;

  const count = snapshots?.length ?? 0;
  const [exportOpen, setExportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="text-text-secondary"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          {count > 0 && (
            <DropdownMenuItem onSelect={() => setExportOpen(true)}>
              <Download className="w-4 h-4" />
              Export data
            </DropdownMenuItem>
          )}
          {count > 0 && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setClearOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Clear data
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={exportOpen}
        snapshots={snapshots ?? []}
        onClose={() => setExportOpen(false)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Clear all data?"
        description="This removes every saved snapshot from this browser. This cannot be undone."
        confirmLabel="Clear everything"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          void snapshotService.clearAllSnapshots().then(() => setClearOpen(false));
        }}
      />
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
