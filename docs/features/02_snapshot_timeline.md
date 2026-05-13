# Feature Spec: Snapshot Storage & Timeline (Phase 2)

> **Document Status:** Skeleton — Pending Elaboration  
> **Last Updated:** 2026-05-13  
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

---

## 4. Implementation Scope

### 4.1 Dexie.js Operations (`snapshot-store.ts`)

- `saveSnapshot(data: ParsedExport): Promise<number>` — Save with auto-label, return ID
- `getAllSnapshots(): Promise<Snapshot[]>` — Sorted by `savedAt` ascending
- `getLatestSnapshot(): Promise<Snapshot | null>`
- `getSnapshotById(id: number): Promise<Snapshot | null>`
- `deleteSnapshot(id: number): Promise<void>`
- `updateLabel(id: number, label: string): Promise<void>`
- `clearAllSnapshots(): Promise<void>`
- `getSnapshotCount(): Promise<number>`
- `enforceLimit(): Promise<Snapshot | null>` — Prune oldest if count > 20, return pruned snapshot

### 4.2 React Hook (`use-snapshots.ts`)

- Wraps Dexie operations with React state
- Provides `snapshots`, `latestSnapshot`, `snapshotCount`, `isLoading`
- Uses Dexie's `liveQuery` for reactive updates when IndexedDB changes

---

## 5. Open Questions

_None — all decisions resolved in Phase 1 spec._

---

## 6. Implementation Checklist

- [ ] Implement `src/lib/db/dexie-client.ts` (database definition)
- [ ] Implement `src/lib/db/snapshot-store.ts` (CRUD operations)
- [ ] Implement auto-label logic (date formatting)
- [ ] Implement pruning logic (max 20, warn user)
- [ ] Create `src/hooks/use-snapshots.ts` (reactive hook)
- [ ] Build snapshot list UI component
- [ ] Build "Clear All Data" confirmation dialog
- [ ] Write unit tests for snapshot-store
- [ ] Write integration tests for save/delete/prune flow
