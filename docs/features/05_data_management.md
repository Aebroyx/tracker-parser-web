# Feature Spec: Data Export & Clear Controls (Phase 5)

> **Document Status:** Complete v1.0  
> **Last Updated:** 2026-05-20  
> **Feature Phase:** 5  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1, Phase 2, Phase 3, Phase 4

---

## 1. Feature Summary

Give users full **data autonomy**: export analyzed lists as CSV, export full snapshot backups as JSON, and manage stored data (clear all, delete individual snapshots, view storage usage). All operations run in the browser; exported files are saved locally via the download API — nothing is uploaded.

Phase 2 already delivered clear/delete/storage UI. Phase 5 adds the **export** pipeline and a hybrid export UX (inline buttons + global dialog).

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-5.1 | User | Export my non-followers list as CSV | I can use it outside this app |
| US-5.2 | User | Export a diff result (gained/lost followers) as CSV | I can share or archive changes |
| US-5.3 | User | Clear all stored data with one click | I can remove everything from my browser |
| US-5.4 | User | Delete a specific snapshot | I can remove just one outdated backup |
| US-5.5 | User | See how much storage my data uses | I understand the browser impact |
| US-5.6 | User | Export a full snapshot as JSON backup | I can archive parsed data outside IndexedDB |
| US-5.7 | User | Export from a single “Export data” dialog | I can export any list without hunting UI |

---

## 3. Acceptance Criteria

| # | Criterion | Verification | Status |
|---|-----------|-------------|--------|
| AC-E1 | “Export CSV” generates a downloadable file | Click → browser downloads CSV with correct rows | ✅ |
| AC-E2 | CSV includes `username`, `profile_url`, `followed_since` columns | Open CSV → columns match schema | ✅ |
| AC-E3 | “Clear All Data” requires confirmation | Click → confirmation dialog | ✅ Phase 2 |
| AC-E4 | Clearing data removes all IndexedDB entries | After clear → first-time upload state | ✅ Phase 2 |
| AC-E5 | Individual snapshot deletion is available | Delete on snapshot row → only that one removed | ✅ Phase 2 |
| AC-E6 | Storage usage is displayed accurately | Shows approximate MB used | ✅ Phase 2 |
| AC-E7 | JSON snapshot backup downloads full `Snapshot` envelope | Export dialog → JSON file with `schemaVersion: 1` | ✅ |
| AC-E8 | Inline export on analysis and diff lists | Export CSV on `AccountList` surfaces | ✅ |

---

## 4. Export Formats

### 4.1 CSV Export Schema

```csv
username,profile_url,followed_since
alice,https://www.instagram.com/alice/,2025-12-01T10:00:00.000Z
bob,https://www.instagram.com/bob/,2025-11-15T08:30:00.000Z
```

- `profile_url`: from export when present; otherwise `https://www.instagram.com/{username}/`
- `followed_since`: ISO 8601 from Unix timestamp (seconds); empty if timestamp ≤ 0
- RFC-4180 escaping (quoted fields, CRLF line endings)

### 4.2 Exportable Lists (`ExportListType`)

| List type | Source | Requires |
|-----------|--------|----------|
| `non-followers` | `SnapshotAnalysis.nonFollowers` | 1 snapshot |
| `fans` | `SnapshotAnalysis.fans` | 1 snapshot |
| `mutuals` | `SnapshotAnalysis.mutuals` | 1 snapshot |
| `gained-followers` | `SnapshotDiff.gainedFollowers` | 2 snapshots (older + newer) |
| `lost-followers` | `SnapshotDiff.lostFollowers` | 2 snapshots |
| `new-following` | `SnapshotDiff.newFollowing` | 2 snapshots |
| `removed-following` | `SnapshotDiff.removedFollowing` | 2 snapshots |
| `all-followers` | `ParsedExport.followers` | 1 snapshot |
| `all-following` | `ParsedExport.following` | 1 snapshot |

### 4.3 JSON Snapshot Backup

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-05-20T12:00:00.000Z",
  "snapshot": {
    "id": 1,
    "data": { "followers": [], "following": [], "meta": {} },
    "savedAt": "2026-05-13T10:00:00.000Z",
    "label": "May 13, 2026"
  }
}
```

**Out of scope for Phase 5:** re-import / restore from JSON backup.

### 4.4 Filename Convention

| Kind | Pattern | Example |
|------|---------|---------|
| CSV list | `instaghost_{listType}_{label}[_{vs_newer}]_{YYYY-MM-DD}.csv` | `instaghost_non-followers_may-13-2026_2026-05-20.csv` |
| JSON backup | `instaghost_snapshot_{label}_{YYYY-MM-DD}.json` | `instaghost_snapshot_may-13-2026_2026-05-20.json` |

Labels are slugified (lowercase, non-alphanumeric → `-`, max 48 chars).

---

## 5. Architecture & File Map

Export logic lives in **`src/services/export/`** per `docs/ARCHITECTURE.md` §2 (not `lib/utils`).

| Layer | File | Role |
|-------|------|------|
| Types | `src/types/export.ts` | `ExportListType`, `ExportContext`, labels |
| Service | `src/services/export/export.service.ts` | CSV/JSON generation, download, `resolveExportAccounts` |
| Hook | `src/hooks/use-export.ts` | Bridge for components |
| UI | `src/components/shared/ExportButton.tsx` | Inline CSV |
| UI | `src/components/shared/ExportDialog.tsx` | Global picker |
| UI | `src/components/layout/HeaderExportData.tsx` | Header entry |
| UI | `AccountList`, `AnalysisPanel`, `DiffSummary`, `SnapshotHistory` | Inline + per-row export |

### 5.1 Hybrid UI

1. **Inline** — `ExportButton` on each `AccountList` when `exportContext` is passed (analysis tabs, diff folds).
2. **Header** — “Export data” opens `ExportDialog` with snapshot + list + format selectors.
3. **Snapshot history** — Download icon per row opens `ExportDialog` pre-selected to that snapshot.

### 5.2 Pre-existing (Phase 2)

| Feature | File |
|---------|------|
| Clear all data | `src/components/layout/HeaderClearData.tsx` |
| Delete snapshot | `src/components/dashboard/SnapshotHistory.tsx` |
| Storage usage | `src/components/dashboard/StorageUsage.tsx` |
| Confirmation modal | `src/components/shared/ConfirmDialog.tsx` |

---

## 6. Implementation Checklist

- [x] Implement `src/services/export/export.service.ts` (CSV, JSON, download, resolve lists)
- [x] Add `src/types/export.ts`
- [x] Implement `src/hooks/use-export.ts`
- [x] Build `ExportButton` and `ExportDialog`
- [x] Wire inline export on `AccountList`, `AnalysisPanel`, `DiffSummary`
- [x] Add per-snapshot export in `SnapshotHistory`
- [x] Add `HeaderExportData` in header nav
- [x] Clear all / delete / storage (Phase 2 — unchanged)
- [ ] Write unit tests for CSV generation (deferred, same backlog as Phases 1–4)
- [ ] Write integration tests for export + clear flows (deferred)

---

## 7. Resolved Decisions

| # | Topic | Decision |
|---|--------|----------|
| 1 | Export service location | `services/export/` per architecture (not `lib/utils/csv-export.ts`) |
| 2 | UI placement | Hybrid: inline + global dialog |
| 3 | JSON format | Full snapshot backup only; no re-import in v1 |
| 4 | Cross-snapshot exports | Require older + newer snapshot pickers in dialog |
