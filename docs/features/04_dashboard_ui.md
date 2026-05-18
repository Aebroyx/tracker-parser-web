# Feature Spec: Dashboard & Timeline Visualization (Phase 4)

> **Document Status:** Skeleton — Pending Elaboration  
> **Last Updated:** 2026-05-13  
> **Feature Phase:** 4  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1, Phase 2, Phase 3

---

## 1. Feature Summary

Build the main dashboard UI that serves as the application's home screen for returning users. The dashboard displays the latest snapshot analysis, the diff against the previous snapshot, a timeline chart of follower progression across all snapshots, and a snapshot picker for manual comparisons.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-4.1 | User | See my current follower/following stats at a glance | I have an instant overview |
| US-4.2 | User | See a timeline chart of follower count over time | I can visualize growth trends |
| US-4.3 | User | See the diff between my latest and previous backup | I know what changed recently |
| US-4.4 | User | Click on a snapshot in the timeline to compare | I can explore historical changes |
| US-4.5 | User | See a list of unfollowers with their profile links | I can take action on who left |
| US-4.6 | User | Navigate to the upload page from the dashboard | I can easily add new backups |

---

## 3. Dashboard Layout (Planned)

### 3.1 Smart Landing Page (`/`)

| Condition | Displayed Content |
|-----------|-------------------|
| No snapshots | Full-screen upload zone (first-time experience) with privacy banner |
| 1 snapshot | Stats overview (followers, following, non-followers, fans, mutuals). No diff. "Upload another backup to start tracking!" prompt |
| 2+ snapshots | Full dashboard: stats, diff card, timeline chart, snapshot history list |

### 3.2 Component Hierarchy

- **StatsBar** — Follower count, following count, non-follower count, fan count, mutual count
- **DiffCard** — "+X gained, -Y lost" with expandable lists
- **TimelineChart** — Line chart showing follower count per snapshot over time
- **SnapshotHistory** — Chronological list of all snapshots with labels, dates, and compare buttons
- **SnapshotPicker** — Dropdown/selector to choose two snapshots for manual comparison
- **UploadButton** — Prominent CTA to navigate to `/upload`

---

## 4. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-U1 | Dashboard shows stats for latest snapshot | Upload 1 snapshot → stats bar shows correct counts |
| AC-U2 | Diff card appears when 2+ snapshots exist | Upload 2nd snapshot → diff card shows gained/lost |
| AC-U3 | Timeline chart plots follower count over all snapshots | 3+ snapshots → line chart with data points |
| AC-U4 | User can select two snapshots for manual comparison | Picker allows choosing any two → diff updates |
| AC-U5 | "Upload New Backup" button navigates to `/upload` | Click → `/upload` page loads |
| AC-U6 | Dashboard is responsive (mobile-friendly) | Works on 375px width screens |

---

## 5. Implementation Checklist

- [ ] Build `src/components/dashboard/StatsBar.tsx`
- [ ] Build `src/components/dashboard/DiffCard.tsx`
- [ ] Build `src/components/dashboard/TimelineChart.tsx` (consider lightweight chart lib like Recharts)
- [x] Build `src/components/dashboard/SnapshotHistory.tsx` _(Phase 2; extended in Phase 3 for timeline context)_
- [ ] Build `src/components/dashboard/SnapshotPicker.tsx`
- [ ] Implement smart landing logic in `src/app/page.tsx`
- [x] Wire up diff engine to dashboard state _(Phase 3: `useDiff`, `DiffSummary`, `AnalysisPanel`, `SnapshotPicker` on `/`)_
- [ ] Responsive layout testing
- [ ] Write component tests
