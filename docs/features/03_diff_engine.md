# Feature Spec: Snapshot Diff Engine (Phase 3)

> **Document Status:** Skeleton — Pending Elaboration  
> **Last Updated:** 2026-05-13  
> **Feature Phase:** 3  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1, Phase 2

---

## 1. Feature Summary

Compute analytical diffs between Instagram snapshots. Supports two diff types: **within-snapshot analysis** (non-followers, fans, mutuals from a single snapshot) and **cross-snapshot comparison** (gained/lost followers between two snapshots from different points in time). The default comparison is always latest vs. previous, but users can manually select any two snapshots.

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
| AC-D1 | Within-snapshot analysis is computed for every snapshot | Upload a single snapshot → non-followers, fans, mutuals lists are shown |
| AC-D2 | Cross-snapshot diff is auto-computed on new upload | Upload 2nd snapshot → gained/lost followers are shown |
| AC-D3 | Default comparison is latest vs. previous snapshot | Dashboard shows "Compared to {previous snapshot label}" |
| AC-D4 | User can select any two snapshots to compare | Snapshot picker allows choosing older/newer snapshots |
| AC-D5 | Diff stats show counts and direction | "+15 new followers, -8 unfollowers" format |
| AC-D6 | Each list (gained, lost, etc.) is sortable | Sort by username or timestamp |

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

---

## 5. Implementation Checklist

- [ ] Implement `src/lib/diff/diff-engine.ts` (both diff types)
- [ ] Implement snapshot selection logic (default: latest vs previous)
- [ ] Implement manual snapshot picker state
- [ ] Build diff result components (gained/lost/non-follower lists)
- [ ] Write unit tests for set operations
- [ ] Write tests for edge cases (empty snapshots, identical snapshots)
