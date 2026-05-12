# Architecture — Instagram Follower Tracker (Web)

> **Document Status:** Draft v0.1  
> **Last Updated:** 2026-05-12  
> **Author:** Spec-Driven Development Process  
> **Parent Spec:** `docs/SYSTEM_SPEC.md`

---

## 1. Architecture Overview

The application follows a **unidirectional data pipeline** with four distinct stages. Every stage runs exclusively in the browser.

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌────────────┐
│  File Upload │───▶│  Web Worker      │───▶│  IndexedDB   │───▶│  React UI  │
│  (User)      │    │  Parser Engine   │    │  (Dexie.js)  │    │  (Diffing) │
└─────────────┘    └──────────────────┘    └──────────────┘    └────────────┘
      │                    │                      │                   │
 .zip/.json/.html    Parse & Normalize      Store Snapshots     Render Results
                     (Background Thread)    (Persistent)        (Main Thread)
```

### Stage Responsibilities

| Stage | Thread | Input | Output | Failure Mode |
|-------|--------|-------|--------|-------------|
| **1. File Upload** | Main | User drags/selects `.zip`, `.json`, or `.html` | `File` / `FileList` objects | Invalid file type → reject with message |
| **2. Parser Engine** | Web Worker | `File` blob / extracted JSON or HTML strings | `ParsedExport` (normalized) | Malformed JSON/HTML → structured error with details |
| **3. IndexedDB Storage** | Main | `ParsedExport` | Stored `Snapshot` record | Storage quota exceeded → warn user |
| **4. UI Diffing & Render** | Main | Current `ParsedExport` + stored `Snapshot` | Rendered diff tables, stats | No baseline → show current data only |

---

## 2. Directory Structure (Planned)

```
tracker-parser-web/
├── docs/                          # Specification files (this directory)
│   ├── SYSTEM_SPEC.md
│   ├── ARCHITECTURE.md
│   └── features/
│       ├── 01_file_processing.md
│       ├── 02_diff_engine.md
│       └── ...
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx               # Landing / upload page
│   │   └── results/
│   │       └── page.tsx           # Results / diff dashboard
│   ├── components/
│   │   ├── ui/                    # Shadcn UI primitives (Button, Card, etc.)
│   │   ├── file-upload/           # Drop zone, file validation UI
│   │   ├── results/               # Diff tables, stat cards
│   │   └── layout/                # Header, Footer, Privacy Banner
│   ├── lib/
│   │   ├── parser/
│   │   │   ├── worker.ts          # Web Worker entry point
│   │   │   ├── instagram-parser.ts # Format detection + normalization logic (JSON)
│   │   │   ├── html-parser.ts     # HTML export parsing via DOMParser
│   │   │   ├── zip-handler.ts     # JSZip extraction logic
│   │   │   └── schemas.ts         # Zod schemas for Instagram JSON validation
│   │   ├── db/
│   │   │   ├── dexie-client.ts    # Dexie.js database definition
│   │   │   └── snapshot-store.ts  # CRUD operations for snapshots
│   │   ├── diff/
│   │   │   └── diff-engine.ts     # Set operations: non-followers, fans, mutual
│   │   └── utils/
│   │       ├── constants.ts       # App-wide constants (limits, keys)
│   │       └── formatters.ts      # Date/number formatting helpers
│   ├── hooks/
│   │   ├── use-file-upload.ts     # File input state management
│   │   ├── use-parser-worker.ts   # Web Worker communication hook
│   │   └── use-snapshots.ts       # IndexedDB snapshot queries
│   └── types/
│       ├── instagram.ts           # Instagram export type definitions
│       ├── parser.ts              # Parser input/output types
│       └── snapshot.ts            # Snapshot & diff result types
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Canonical Data Model

All Instagram export formats are normalized into these TypeScript interfaces. This is the **single internal representation** used throughout the app.

```typescript
// types/instagram.ts

/** A single Instagram account extracted from an export file */
interface InstagramAccount {
  /** The Instagram username (lowercase, trimmed) */
  username: string;
  /** Profile URL (if available from export) */
  profileUrl: string | null;
  /** Unix timestamp (seconds) when the follow relationship was created */
  timestamp: number;
}

/** The normalized result of parsing an Instagram export */
interface ParsedExport {
  /** List of accounts that follow the user */
  followers: InstagramAccount[];
  /** List of accounts the user follows */
  following: InstagramAccount[];
  /** Metadata about the parse operation */
  meta: ParseMeta;
}

/** Metadata attached to every parsed export */
interface ParseMeta {
  /** Unique ID for this parse operation (UUID v4) */
  id: string;
  /** ISO 8601 timestamp of when parsing completed */
  parsedAt: string;
  /** Detected format version */
  formatVersion: 'current-json' | 'legacy-json' | 'html' | 'unknown';
  /** The source content type: 'json' or 'html' */
  sourceFormat: 'json' | 'html';
  /** Original filename(s) that were processed */
  sourceFiles: string[];
  /** Total number of followers parsed */
  followerCount: number;
  /** Total number of following parsed */
  followingCount: number;
  /** Duration of parse operation in milliseconds */
  parseDurationMs: number;
  /** Non-blocking warnings collected during parsing (e.g., URL validation issues) */
  warnings: string[];
}
```

---

## 4. Web Worker Communication Protocol

The main thread and parser Web Worker communicate via `postMessage` using a typed message protocol.

### 4.1 Main Thread → Worker Messages

```typescript
// types/parser.ts

type WorkerInboundMessage =
  | { type: 'PARSE_JSON'; payload: { fileId: string; content: string; fileName: string } }
  | { type: 'PARSE_HTML'; payload: { fileId: string; content: string; fileName: string } }
  | { type: 'PARSE_ZIP'; payload: { fileId: string; arrayBuffer: ArrayBuffer; fileName: string } }
  | { type: 'CANCEL'; payload: { fileId: string } };
```

### 4.2 Worker → Main Thread Messages

```typescript
type WorkerOutboundMessage =
  | { type: 'PROGRESS'; payload: { fileId: string; stage: ParseStage; percent: number } }
  | { type: 'SUCCESS'; payload: { fileId: string; result: ParsedExport } }
  | { type: 'ERROR'; payload: { fileId: string; error: ParseError } };

type ParseStage =
  | 'extracting'      // Unzipping archive
  | 'detecting'       // Detecting format version (JSON vs HTML, current vs legacy)
  | 'parsing'         // Parsing JSON structures or HTML DOM
  | 'normalizing';    // Normalizing to canonical model

interface ParseError {
  code: ParseErrorCode;
  message: string;
  details?: string;      // Technical details (for console, not user)
  fileName?: string;     // Which file caused the error
}

type ParseErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_HTML'
  | 'UNSUPPORTED_FORMAT'
  | 'MISSING_FILES'
  | 'ZIP_EXTRACTION_FAILED'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_DATA'
  | 'UNKNOWN';
```

### 4.3 Sequence Diagram

```
Main Thread                          Web Worker
    │                                     │
    │── PARSE_ZIP { arrayBuffer } ───────▶│
    │                                     │── Extract .zip (JSZip)
    │◀── PROGRESS { extracting, 20% } ───│
    │                                     │── Detect files (.json or .html)
    │◀── PROGRESS { detecting, 40% } ────│
    │                                     │── Parse files (JSON.parse or DOMParser)
    │◀── PROGRESS { parsing, 70% } ──────│
    │                                     │── Normalize to canonical model
    │◀── PROGRESS { normalizing, 90% } ──│
    │                                     │
    │◀── SUCCESS { ParsedExport } ────────│
    │                                     │
```

> **Note on HTML parsing in Web Workers:** `DOMParser` is available in Web Workers in modern browsers (Chrome 114+, Firefox 116+, Safari 17+). For older browser fallback, the app will parse HTML on the main thread if the Worker throws a `DOMParser is not defined` error.

---

## 5. IndexedDB Schema (Dexie.js)

```typescript
// lib/db/dexie-client.ts

import Dexie, { type Table } from 'dexie';

interface Snapshot {
  /** Auto-incremented primary key */
  id?: number;
  /** The parsed export data */
  data: ParsedExport;
  /** ISO 8601 timestamp when the snapshot was saved */
  savedAt: string;
  /** User-provided label (optional) */
  label?: string;
  /** Whether this snapshot is marked as the active baseline */
  isBaseline: boolean;
}

class TrackerDatabase extends Dexie {
  snapshots!: Table<Snapshot>;

  constructor() {
    super('instagram-tracker');
    this.version(1).stores({
      // Indexed fields only — Dexie stores the full object regardless
      snapshots: '++id, savedAt, isBaseline',
    });
  }
}
```

### 5.1 Storage Rules

| Rule | Detail |
|------|--------|
| **Max snapshots** | 20 snapshots retained. Oldest non-baseline snapshots are auto-pruned when the limit is reached. |
| **Baseline constraint** | Only ONE snapshot can be marked as `isBaseline: true` at any time. Setting a new baseline unsets the previous one. |
| **Data integrity** | Snapshots are immutable once saved. Users can delete or relabel, but cannot edit parsed data. |
| **Size estimation** | Each snapshot is estimated at ~50KB–2MB depending on follower/following counts. The app displays approximate storage usage. |

---

## 6. Diff Engine Design

The diff engine operates on **sets of usernames** derived from `ParsedExport` data.

```typescript
// lib/diff/diff-engine.ts

interface DiffResult {
  /** Accounts you follow that don't follow you back */
  nonFollowers: InstagramAccount[];
  /** Accounts that follow you but you don't follow back */
  fans: InstagramAccount[];
  /** Accounts in both followers and following */
  mutuals: InstagramAccount[];

  /** Stats summary */
  stats: {
    totalFollowers: number;
    totalFollowing: number;
    nonFollowerCount: number;
    fanCount: number;
    mutualCount: number;
  };
}

/** If a baseline exists, compute changes between snapshots */
interface BaselineDiff {
  /** New followers since baseline */
  gainedFollowers: InstagramAccount[];
  /** Lost followers since baseline (unfollowers) */
  lostFollowers: InstagramAccount[];
  /** New accounts you started following since baseline */
  newFollowing: InstagramAccount[];
  /** Accounts you unfollowed since baseline */
  removedFollowing: InstagramAccount[];
}
```

### 6.1 Diff Algorithm

```
Given:
  F  = Set of follower usernames (current upload)
  G  = Set of following usernames (current upload)
  Fb = Set of follower usernames (baseline, if exists)
  Gb = Set of following usernames (baseline, if exists)

Current Diff:
  Non-Followers = G \ F    (following minus followers)
  Fans          = F \ G    (followers minus following)
  Mutuals       = F ∩ G    (intersection)

Baseline Diff (if baseline exists):
  Gained Followers   = F \ Fb
  Lost Followers     = Fb \ F
  New Following      = G \ Gb
  Removed Following  = Gb \ G
```

---

## 7. State Management

The application uses **React Context + `useReducer`** for global state. No external state management library is needed given the app's scope.

### 7.1 Global State Shape

```typescript
interface AppState {
  /** Current parsing status */
  parseStatus: 'idle' | 'loading' | 'success' | 'error';
  /** Progress percentage (0-100) during parsing */
  parseProgress: number;
  /** Current parse stage label */
  parseStage: ParseStage | null;
  /** The most recent parsed export (in-memory, not yet saved) */
  currentExport: ParsedExport | null;
  /** Error from the most recent parse attempt */
  parseError: ParseError | null;
  /** The current diff result (computed from currentExport) */
  currentDiff: DiffResult | null;
  /** Baseline diff (computed if a baseline snapshot exists) */
  baselineDiff: BaselineDiff | null;
}
```

### 7.2 Context Providers

```
<AppProvider>              // Global state (parse status, current data)
  <DatabaseProvider>       // Dexie.js instance, snapshot operations
    <ThemeProvider>         // Dark/light mode toggle
      <Layout>
        {children}
      </Layout>
    </ThemeProvider>
  </DatabaseProvider>
</AppProvider>
```

---

## 8. Page Routing

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Landing page with file upload zone and privacy notice |
| `/results` | `app/results/page.tsx` | Dashboard showing parsed data, diffs, and stats |
| `/history` | `app/history/page.tsx` | Saved snapshots list with baseline management |

> **Note:** Navigation to `/results` is programmatic (after successful parse). There is no direct URL access to results without data — the page redirects to `/` if no current export exists.

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parse time (10K accounts)** | < 2 seconds | Web Worker `parseDurationMs` |
| **Parse time (50K accounts)** | < 5 seconds | Web Worker `parseDurationMs` |
| **UI responsiveness during parse** | No frame drops | Main thread remains unblocked (Worker handles parsing) |
| **Initial page load (LCP)** | < 1.5 seconds | Lighthouse on static export |
| **Bundle size (JS)** | < 200KB gzipped | `next build` output analysis |

---

## 10. Error Handling Strategy

### 10.1 Error Boundary Hierarchy

```
<RootErrorBoundary>           // Catches catastrophic rendering errors
  <ParseErrorBoundary>        // Catches parse-specific errors, shows retry UI
    <DatabaseErrorBoundary>   // Catches IndexedDB failures, suggests clearing data
      {children}
    </DatabaseErrorBoundary>
  </ParseErrorBoundary>
</RootErrorBoundary>
```

### 10.2 User-Facing Error Messages

| Error Code | User Message | Action |
|------------|-------------|--------|
| `INVALID_JSON` | "This file doesn't contain valid JSON. Please check that you downloaded the correct export from Instagram." | Retry upload |
| `INVALID_HTML` | "This HTML file couldn't be parsed. It may be corrupted or not a valid Instagram export." | Retry upload |
| `UNSUPPORTED_FORMAT` | "We couldn't recognize this Instagram export format. Please try downloading a fresh export." | Retry upload |
| `MISSING_FILES` | "The required follower/following files weren't found in this export. Make sure you selected 'Followers and Following' when requesting your data." | Retry upload |
| `ZIP_EXTRACTION_FAILED` | "We couldn't open this ZIP file. It may be corrupted — try downloading it again from Instagram." | Retry upload |
| `FILE_TOO_LARGE` | "This file exceeds the 500MB limit. Please try exporting a smaller date range." | Retry with smaller file |
| `EMPTY_DATA` | "The export was parsed successfully, but no follower or following data was found." | Check export settings |
