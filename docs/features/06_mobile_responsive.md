# Feature Spec: Mobile Responsive UI (Phase 6)

> **Document Status:** Complete v0.2  
> **Last Updated:** 2026-05-22  
> **Feature Phase:** 6  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/DESIGN_LANGUAGE.md` §9  
> **Depends On:** Phase 1, Phase 4, Phase 5

---

## 1. Feature Summary

Make Instaghost Tracker fully usable on mobile phones (375px width) and touch devices. The app already declares mobile-first in the design language but several components overflow, use desktop-only drag-and-drop copy, or have tap targets below the 44px minimum. This phase adds responsive layout rules, touch-aware upload copy, a mobile header overflow menu, and safe-area padding — without changing any data or privacy behavior.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-6.1 | Mobile user | Access all header actions without horizontal overflow | I can export, clear data, or visit GitHub on a phone |
| US-6.2 | Mobile user | Tap upload zones to select files with clear instructions | I am not confused by drag-and-drop copy I cannot use |
| US-6.3 | Mobile user | See dashboard stats in a readable grid | Five stat cards do not orphan or truncate badly |
| US-6.4 | Mobile user | Stack snapshot picker dropdowns vertically | I can compare two backups without squashed selects |
| US-6.5 | Mobile user | Browse account lists without horizontal squeeze | Usernames are readable; timestamps hidden on narrow screens |
| US-6.6 | Mobile user | Tap snapshot history actions reliably | Rename, export, and delete buttons meet 44px targets |
| US-6.7 | Mobile user | See footer content above the iOS home indicator | Nothing is clipped by the device safe area |

---

## 3. Scope

### 3.1 In Scope

| Area | Change |
|------|--------|
| **Header** | Overflow menu (`MoreVertical`) below `sm`; inline nav at `sm+` |
| **Upload zones** | Touch-device copy swap via `isTouchDevice` from `useFileUpload` |
| **StatsBar** | `grid-cols-2 sm:grid-cols-3`; 5th card `col-span-2 sm:col-span-1` |
| **SnapshotPicker** | `flex-col sm:flex-row` (verify / enforce) |
| **AccountList** | Hide timestamp column on `< sm`; 44px row tap targets |
| **SnapshotHistory** | Truncate long labels; 44px icon buttons |
| **Footer** | `env(safe-area-inset-bottom)` padding |
| **TimelineChart** | Static legend (already present); view-only on touch — no tap-to-tooltip dependency |

### 3.2 Out of Scope

- Bottom tab navigation
- Native mobile app or PWA install prompt
- Swipe gestures for snapshot navigation
- Chart point tap-to-compare (deferred from Phase 4)

---

## 4. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-M1 | Header nav does not overflow at 375px | Export, Clear, GitHub accessible via overflow menu |
| AC-M2 | Upload zones show tap copy on touch devices | `(hover: none) and (pointer: coarse)` → "Tap to select…" |
| AC-M3 | StatsBar renders 2-column grid on mobile with full-width 5th card | 375px viewport → 2+2+1 layout |
| AC-M4 | SnapshotPicker stacks dropdowns on mobile | 375px → vertical layout; 640px+ → horizontal |
| AC-M5 | AccountList hides timestamp on mobile | `< sm` → no "Since" column; `sm+` → column visible |
| AC-M6 | SnapshotHistory icon buttons are ≥ 44px | Inspect tap targets on mobile |
| AC-M7 | Footer respects iOS safe area | `padding-bottom` includes `env(safe-area-inset-bottom)` |
| AC-M8 | Timeline chart readable at 375px | Chart renders inside `ResponsiveContainer`; legend visible below |

---

## 5. Implementation Details

### 5.1 Mobile Header (`Header.tsx`)

- Below `sm`: hide inline `<nav>`; show a Shadcn `<DropdownMenu>` (see `docs/DESIGN_LANGUAGE.md` §5.2.3) triggered by a `MoreVertical` icon Shadcn `<Button variant="ghost" size="icon">`.
- Menu contains: Export data item, Clear data item (when snapshots exist), GitHub link item (`<DropdownMenuItem asChild>` wrapping an `<a target="_blank">`). Same behavior as desktop nav controls.
- Menu closes via Radix dismissable layer (outside click, ESC, item activation) — no manual `useEffect` listeners.
- Header horizontal padding: `px-4 sm:px-6` per design language.

### 5.2 Touch Detection (`use-file-upload.ts`)

```ts
const isTouchDevice = matchMedia('(hover: none) and (pointer: coarse)').matches;
```

Expose `isTouchDevice` from the hook return value. `UploadPanel` passes it to `DropZone` and `FileSlotDropZone`.

### 5.3 Upload Copy Swap

| Component | `isTouchDevice === false` | `isTouchDevice === true` |
|-----------|--------------------------|-------------------------|
| `DropZone` idle | "Drag & drop your Instagram export here" / "or click to browse files" | "Tap to select your Instagram export" |
| `FileSlotDropZone` idle | "Drop file here" / "or click to browse" | "Tap to select file" |

### 5.4 StatsBar Grid

```html
<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
  <!-- cards 1–4 -->
  <StatCard class="col-span-2 sm:col-span-1" /> <!-- 5th: Mutuals -->
</div>
```

Remove `lg:grid-cols-5` — five cards in one row is too dense even on desktop; three columns with wrapping is sufficient.

### 5.5 AccountList Mobile Layout

- Header row: hide "Since" with `hidden sm:block`.
- Row: username link with `min-h-[44px] flex items-center`; timestamp span with `hidden sm:inline`.

### 5.6 SnapshotHistory

- Label: `truncate` (already applied).
- Action buttons: `min-h-[44px] min-w-[44px] flex items-center justify-center`.

### 5.7 Footer Safe Area

Add utility in `globals.css`:

```css
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

Apply to `<footer>`.

---

## 6. Implementation Checklist

- [x] Update `docs/DESIGN_LANGUAGE.md` §9
- [x] Update `docs/SYSTEM_SPEC.md` §6 roadmap
- [x] Update `docs/features/04_dashboard_ui.md` AC-U6
- [x] Update `docs/features/01_file_processing.md` §10.2 touch copy
- [x] Implement mobile overflow menu in `Header.tsx`
- [x] Expose `isTouchDevice` in `use-file-upload.ts`
- [x] Touch copy in `DropZone.tsx` and `FileSlotDropZone.tsx`
- [x] Responsive grid in `StatsBar.tsx`
- [x] Mobile layout in `AccountList.tsx`
- [x] 44px targets in `SnapshotHistory.tsx`
- [x] Safe-area padding in `Footer.tsx` + `globals.css`
- [ ] Manual QA at 375px, 640px, 1024px

---

## 7. Resolved Decisions

| # | Topic | Decision |
|---|--------|----------|
| 1 | **Mobile nav pattern** | Overflow popover menu (⋮), not bottom tab bar or slide-in drawer |
| 2 | **Shadcn DropdownMenu** | **Adopted (Phase 7 Shadcn UI foundation).** The custom Tailwind + Lucide popover was replaced by the Shadcn `DropdownMenu` primitive built on `@radix-ui/react-dropdown-menu` for proper a11y (focus trap, ESC, roving tabindex) and to align with the Shadcn primitive policy in `docs/DESIGN_LANGUAGE.md` §5.2.3. The previous "zero new dependencies" rationale is superseded: Radix dropdown-menu is now a documented dependency in `docs/SYSTEM_SPEC.md` §3. |
| 3 | **Touch detection location** | `useFileUpload` hook exposes `isTouchDevice`; no separate hook file |
| 4 | **Stat grid at desktop** | Max 3 columns (`sm:grid-cols-3`), not 5 in one row |
| 5 | **Chart on touch** | View-only with static legend; tooltip is desktop enhancement |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-22 | v0.2 | Phase 7 Shadcn UI foundation: §5.1 mobile header now uses Shadcn `DropdownMenu`; removed "no new Shadcn dependencies" from §3.2 out-of-scope; flipped Resolved Decision #2 to adopt Shadcn DropdownMenu |
| 2026-05-22 | v0.1 | Initial Phase 6 mobile responsive spec |
