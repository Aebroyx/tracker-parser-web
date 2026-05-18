# Feature Spec: Dashboard & Timeline Visualization (Phase 4)

> **Document Status:** Complete v0.1  
> **Last Updated:** 2026-05-18  
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

**Resolved (US-4.4):** Manual comparison of any two backups is done via **SnapshotPicker** (older → newer). The Recharts timeline is read-only in v1; clicking chart points to set the comparison window is deferred to a future iteration.

---

## 3. Dashboard Layout (Planned)

### 3.1 Smart Landing Page (`/`)

| Condition | Displayed Content |
|-----------|-------------------|
| No snapshots | Full-screen upload zone (first-time experience) with privacy banner |
| 1 snapshot | **StatsBar** (followers, following, non-followers, fans, mutuals). No cross-snapshot diff. Prompt: upload another backup. **AnalysisPanel**. **SnapshotHistory**. No timeline chart (&lt; 2 data points). |
| 2+ snapshots | **StatsBar** + **DiffCard** (when a valid older/newer pair yields a diff), or **StatsBar** alone if the picker is invalid. **TimelineChart** (followers + following lines). **SnapshotPicker**. **AnalysisPanel**. **SnapshotHistory**. |

### 3.2 Component Hierarchy

- **StatsBar** — Follower count, following count, non-follower count, fan count, mutual count (`src/components/dashboard/StatsBar.tsx`). With 2+ snapshots and a valid diff, **followers** and **following** show numeric deltas vs. the older snapshot (`SnapshotDiff.stats`); other cards are counts only (deltas for those categories would require extending the diff model — deferred).
- **DiffCard** — Wraps **StatsBar** (with deltas) + Phase 3 **DiffSummary** (gained/lost lists) in one shell (`src/components/dashboard/DiffCard.tsx`).
- **TimelineChart** — Recharts line chart: follower and following counts per snapshot (`src/components/dashboard/TimelineChart.tsx`).
- **SnapshotHistory** — Chronological list of all snapshots with labels, dates, rename/delete (`src/components/dashboard/SnapshotHistory.tsx`).
- **SnapshotPicker** — Dropdowns to choose two snapshots for manual comparison (`src/components/dashboard/SnapshotPicker.tsx`).
- **Upload CTA** — Link to `/upload` on the home dashboard (`src/app/page.tsx`).

---

## 4. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-U1 | Dashboard shows stats for latest snapshot | Upload 1 snapshot → stats bar shows correct counts |
| AC-U2 | Diff card appears when 2+ snapshots exist | Upload 2nd snapshot → diff card shows gained/lost |
| AC-U3 | Timeline chart plots follower count over all snapshots | 2+ snapshots → line chart with data points (following series also shown). 1 snapshot → placeholder message. |
| AC-U4 | User can select two snapshots for manual comparison | Picker allows choosing any two → diff updates |
| AC-U5 | "Upload New Backup" button navigates to `/upload` | Click → `/upload` page loads |
| AC-U6 | Dashboard is responsive (mobile-friendly) | Works on 375px width screens; layout uses responsive grids and `ResponsiveContainer` |

---

## 5. Implementation Checklist

- [x] Build `src/components/dashboard/StatsBar.tsx`
- [x] Build `src/components/dashboard/DiffCard.tsx` (composes **StatsBar** + **DiffSummary**)
- [x] Build `src/components/dashboard/TimelineChart.tsx` (Recharts `LineChart`, dark-themed tooltip)
- [x] Build `src/components/shared/StatCard.tsx` (shared stat primitive per `docs/DESIGN_LANGUAGE.md`)
- [x] Build `src/components/dashboard/SnapshotHistory.tsx` _(Phase 2; extended in Phase 3 for timeline context)_
- [x] Build `src/components/dashboard/SnapshotPicker.tsx` _(Phase 3)_
- [x] Implement smart landing logic in `src/app/page.tsx` (0 / 1 / 2+ branches per §3.1)
- [x] Wire up diff engine to dashboard state _(Phase 3: `useDiff`, **`DiffCard`** on `/` when diff valid)_
- [x] Responsive layout testing (375 / 768 / 1024 — Tailwind breakpoints + chart `ResponsiveContainer`)
- [ ] Write component tests _(deferred; same backlog as Phases 1–3)_

---

## 6. Resolved Decisions

| # | Topic | Decision |
|---|--------|----------|
| 1 | **DiffCard vs DiffSummary** | **DiffCard** is the Phase 4 wrapper; **DiffSummary** remains the Phase 3 expandable diff lists. |
| 2 | **Chart library** | **Recharts** — client-only; no analytics / external calls. |
| 3 | **Stat deltas** | Only **followers** and **following** show Δ vs. older snapshot; **SnapshotDiff** does not carry non-follower / fan / mutual deltas in v1. |
