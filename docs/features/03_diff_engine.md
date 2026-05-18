# Feature Spec: Snapshot Diff Engine (Phase 3)

> **Document Status:** Complete v0.2  
> **Last Updated:** 2026-05-18  
> **Feature Phase:** 3  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1, Phase 2

---

## 1. Feature Summary

Compute analytical diffs between Instagram snapshots. Supports two diff types: **within-snapshot analysis** (non-followers, fans, mutuals from a single snapshot) and **cross-snapshot comparison** (gained/lost followers and following between two snapshots from different points in time). The default comparison is always latest vs. previous, but users can manually select any two snapshots (older → newer, validated by `savedAt`).

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-3.1 | User | See who doesn't follow me back (non-followers) | I can decide who to unfollow |
| US-3.2 | User | See who follows me but I don't follow back (fans) | I can discover new accounts to follow |
| US-3.3 | User | See mutual followers | I know which relationships are reciprocal |
| US-3.4 | User | See who unfollowed me since my last backup | I can track follower churn |
| US-3.5 | User | See new followers since my last backup | I can track follower growth |
| US-3.6 | User | Compare any two snapshots, not just the latest | I can analyze changes across any time period |

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-D1 | Within-snapshot analysis is computed for every snapshot | With ≥1 snapshot saved → analysis tabs (non-followers, fans, mutuals) are shown for the selected “newer” snapshot |
| AC-D2 | Cross-snapshot diff is available when ≥2 snapshots exist | With 2+ snapshots → diff summary shows gained/lost followers and new/removed following (default: previous vs latest) |
| AC-D3 | Default comparison is latest vs. previous snapshot | With 2+ snapshots and no manual picker override → diff compares second-to-last backup to latest; UI labels the two snapshots (e.g. “Comparing **A** → **B**”) |
| AC-D4 | User can select any two snapshots to compare | Snapshot picker (older / newer) updates the diff when valid (older `savedAt` < newer `savedAt`) |
| AC-D5 | Diff stats show counts and direction | Summary shows follower/following deltas and counts (e.g. “+N new followers, −M unfollowers” by list difference) |
| AC-D6 | Each list (gained, lost, etc.) is sortable | `AccountList` supports sort by username or timestamp on each list |

---

## 4. Diff Types (from `ARCHITECTURE.md` §6)

### 4.1 Within-Snapshot (`SnapshotAnalysis`)
- Non-Followers = Following \ Followers
- Fans = Followers \ Following
- Mutuals = Followers ∩ Following

### 4.2 Cross-Snapshot (`SnapshotDiff`)
- Gained Followers = Newer.Followers \ Older.Followers
- Lost Followers = Older.Followers \ Newer.Followers
- New Following = Newer.Following \ Older.Following
- Removed Following = Older.Following \ Newer.Following

**Implementation:** `src/services/diff/diff.service.ts` — `analyzeSnapshot()`, `compareSnapshots()`.

---

## 5. Implementation Checklist

- [x] Implement `src/services/diff/diff.service.ts` (`analyzeSnapshot`, `compareSnapshots`, Map-based set ops)
- [x] Implement `src/hooks/use-diff.ts` (default latest vs previous; optional `olderId` / `newerId`; memoized)
- [x] `src/components/dashboard/SnapshotPicker.tsx` — manual older/newer selection + order validation UI
- [x] `src/components/dashboard/AccountList.tsx` — sortable lists, profile links, show-all for long lists
- [x] `src/components/dashboard/AnalysisPanel.tsx` — within-snapshot tabs
- [x] `src/components/dashboard/DiffSummary.tsx` — cross-snapshot summary + expandable sections (minimal Phase 3 card; polish in Phase 4)
- [x] Wire dashboard on `src/app/page.tsx` (picker state, analysis, diff, history)
- [ ] Unit tests: set operations and `compareSnapshots` edge cases
- [ ] Unit / hook tests: `useDiff` default vs picker overrides

---

## 6. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Only one snapshot | Show within-snapshot analysis for latest; no cross-snapshot diff; prompt to upload another backup |
| Same snapshot selected for older and newer | Diff is not computed (`useDiff` returns `diff: null`); picker shows a warning |
| Older snapshot is not strictly before newer (by `savedAt`) | Diff is not computed; picker shows validation message |
| Empty follower or following lists | Set differences yield empty arrays; stats use `ParseMeta` counts where applicable |
| Identical data in two snapshots | Diff lists empty; net follower/following change may still be 0 |

---

## 7. Resolved Decisions

| # | Decision | Notes |
|---|----------|-------|
| 1 | Code location | Per `docs/ARCHITECTURE.md`, diff logic lives in `src/services/diff/`, not `src/lib/diff/`. |
| 2 | UI split with Phase 4 | Phase 3 ships functional `DiffSummary` + tabs; Phase 4 adds `StatsBar`, `TimelineChart`, and refined dashboard layout per `04_dashboard_ui.md`. |
