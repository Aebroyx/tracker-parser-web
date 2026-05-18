# Feature Spec: Snapshot Storage & Timeline (Phase 2)

> **Document Status:** Complete v0.2  
> **Last Updated:** 2026-05-18  
> **Feature Phase:** 2  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1 (`01_file_processing.md`)

---

## 1. Feature Summary

Manage the persistence, retrieval, and lifecycle of parsed Instagram export snapshots in IndexedDB via Dexie.js. Each upload from Phase 1 produces a `ParsedExport` that is saved as a timestamped `Snapshot`. This phase handles the CRUD operations, auto-labeling, chronological ordering, storage limits, and pruning logic.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-2.1 | User | Have my parsed data automatically saved after upload | I don't lose my data when I close the browser |
| US-2.2 | User | See all my saved snapshots in chronological order | I can track my follower history over time |
| US-2.3 | User | Delete a specific snapshot | I can remove outdated or incorrect data |
| US-2.4 | User | Rename a snapshot's label | I can identify backups more easily (e.g., "Before cleanup") |
| US-2.5 | User | Be warned when old snapshots will be pruned | I don't lose important data unexpectedly |
| US-2.6 | User | See how much browser storage my snapshots use | I understand the storage impact |

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-S1 | Snapshot is auto-saved to IndexedDB after successful parse | Parse completes → snapshot appears in stored list |
| AC-S2 | Snapshots are auto-labeled with the save date (e.g., "May 13, 2026") | New snapshot has readable date label |
| AC-S3 | User can rename a snapshot label | Click edit → type new name → label updates |
| AC-S4 | User can delete a snapshot | Click delete → confirmation dialog → snapshot removed |
| AC-S5 | Max 20 snapshots are retained | Save 21st snapshot → oldest is pruned with warning |
| AC-S6 | Snapshots are sorted chronologically (oldest first) | Snapshot list always shows correct order |
| AC-S7 | Storage usage is displayed | UI shows approximate size (e.g., "Using ~5MB of browser storage") |
| AC-S8 | "Clear All Data" button removes all snapshots | Click → confirmation → IndexedDB emptied |

**Pruning UX (AC-S5 / US-2.5):** Before saving when the store already has 20 snapshots, the app shows a confirmation dialog (e.g. "Saving will remove your oldest snapshot … Continue?"). After save, `enforceLimit()` runs defensively in case of edge cases.

---

## 4. Implementation Scope

### 4.1 Snapshot service (`src/services/snapshot/snapshot.service.ts`)

Business logic lives under `services/` per `docs/ARCHITECTURE.md`. IndexedDB schema-only code remains in `src/lib/db/dexie-client.ts`.

- `saveSnapshot(data: ParsedExport): Promise<number>` — Save with auto-label (`formatSnapshotLabel`), return Dexie id
- `getAllSnapshots(): Promise<Snapshot[]>` — Sorted by `savedAt` ascending
- `getLatestSnapshot(): Promise<Snapshot | null>` — Highest `savedAt`
- `getSnapshotById(id: number): Promise<Snapshot | null>`
- `deleteSnapshot(id: number): Promise<void>`
- `updateLabel(id: number, label: string): Promise<void>` — Trims empty → fallback to date label
- `clearAllSnapshots(): Promise<void>`
- `getSnapshotCount(): Promise<number>`
- `enforceLimit(): Promise<Snapshot | null>` — If count > `MAX_SNAPSHOTS`, delete oldest by `savedAt`, return deleted row
- `willExceedLimit(): Promise<{ exceeds: boolean; oldest: Snapshot | null }>` — True when count ≥ `MAX_SNAPSHOTS` (next save would require prune)
- `getStorageEstimate(): Promise<{ usage: number; quota: number } | null>` — Wraps `navigator.storage.estimate()` when available

### 4.2 React Hook (`src/hooks/use-snapshots.ts`)

- Uses `dexie-react-hooks` **`useLiveQuery`** for reactive IndexedDB reads
- Provides `snapshots`, `latestSnapshot`, `snapshotCount`, `isLoading`, `storage` (from `getStorageEstimate`)
- Exposes actions: `save`, `rename`, `remove`, `clearAll` (wrapping the service)

### 4.3 UI (Phase 2 minimal)

- `SnapshotHistory` — Chronological list, inline rename, delete with confirmation
- `StorageUsage` — Approximate browser storage line
- `ConfirmDialog` — Shared modal for delete, clear-all, and pre-save prune warning
- Smart landing on `/` and dedicated `/upload` per `docs/ARCHITECTURE.md` §8

---

## 5. Open Questions

_None — all decisions resolved in Phase 1 spec._

---

## 6. Implementation Checklist

- [x] Implement `src/lib/db/dexie-client.ts` (database definition) — already in repo
- [x] Implement `src/services/snapshot/snapshot.service.ts` (CRUD operations)
- [x] Implement auto-label logic (date formatting via `formatSnapshotLabel`)
- [x] Implement pruning logic (max 20, pre-save warning + `enforceLimit`)
- [x] Create `src/hooks/use-snapshots.ts` (reactive hook with `useLiveQuery`)
- [x] Build snapshot list UI component (`SnapshotHistory`)
- [x] Build "Clear All Data" confirmation dialog (`ConfirmDialog` + header control)
- [ ] Write unit tests for snapshot service
- [ ] Write integration tests for save/delete/prune flow
