# Design Language — Instaghost Tracker

> **Document Status:** Draft v0.6  
> **Last Updated:** 2026-05-22  
> **Parent Spec:** `docs/SYSTEM_SPEC.md`

---

## 1. Design Philosophy

**Dark. Minimal. Data-forward.**

Instaghost Tracker presents dense analytical data in a clean, distraction-free interface. Every element earns its place. The design favors **neutral dark surfaces**, negative space, and **spectral purple accents** on interactive elements — letting the data speak. No decorative elements, no skeuomorphism, no visual noise.

---

## 2. Color System

### 2.0 Ghost Aesthetic

The palette should feel **phantom, not neon**. Think moonlit fog, a faint lavender glow in the dark, and surfaces that disappear into the background — not saturated purple-to-purple gradients.

| Principle | Guideline |
|-----------|-----------|
| **Mist over saturation** | Backgrounds stay **achromatic gray-black** — ghost purple appears only in accents and halos, never in surfaces. |
| **Spectral accents** | Purple accents are pale, cool, and slightly luminous — like light through fog. |
| **Soft depth** | Gradients suggest atmosphere (mist settling, a faint glow), not decoration. |
| **Restrained contrast** | Text stays readable, but borders and fills stay whisper-quiet. |

> **Rule:** If a color reads as “brand purple,” it is too loud. Ghost purple should feel like it is barely there.

### 2.1 Base Palette (Dark Mode Default)

Neutral **achromatic dark** base — same lightness steps as v1, but with **0% saturation** so surfaces read as true gray-black, not blue or purple. Ghost purple is reserved for accents (§2.2).

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `hsl(0, 0%, 8%)` | Page background — flat neutral near-black |
| `--bg-secondary` | `hsl(0, 0%, 12%)` | Card/panel backgrounds |
| `--bg-tertiary` | `hsl(0, 0%, 16%)` | Elevated surfaces (modals, popovers, hover states) |
| `--border-subtle` | `hsl(0, 0%, 20%)` | Card borders, dividers — barely visible |
| `--border-default` | `hsl(0, 0%, 28%)` | Input borders, interactive element outlines |
| `--text-primary` | `hsl(0, 0%, 95%)` | Main body text — off-white, never pure white |
| `--text-secondary` | `hsl(0, 0%, 60%)` | Labels, descriptions, secondary info |
| `--text-muted` | `hsl(0, 0%, 40%)` | Placeholder text, disabled states |

### 2.2 Accent Palette

Purple is kept, but shifted from **vivid violet** to **spectral lavender** — lighter, cooler, and lower saturation.

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `hsl(265, 42%, 72%)` | Primary CTAs, active states — soft phantom lavender |
| `--accent-primary-hover` | `hsl(265, 45%, 66%)` | Link hover, inline accent emphasis — not primary button fill |
| `--accent-glow` | `hsla(265, 50%, 78%, 0.10)` | Faint ectoplasm glow on focus/selection — avoid large-area fills |
| `--accent-spectral` | `hsl(275, 35%, 82%)` | Highlights, focus rings, subtle “haunting” shimmer |
| `--text-on-accent` | `hsl(0, 0%, 12%)` | Text on pale `--gradient-accent` buttons |
| `--accent-green` | `hsl(155, 45%, 52%)` | Positive metrics — gained followers, success states (desaturated) |
| `--accent-red` | `hsl(0, 55%, 58%)` | Negative metrics — lost followers, errors (desaturated) |
| `--accent-amber` | `hsl(38, 65%, 58%)` | Warnings, incomplete states (desaturated) |

### 2.3 Gradient Tokens

Gradients should read as **atmosphere**, not as a bold brand stripe. Prefer low saturation, 2–3 stops max, and avoid high-chroma purple pairs.

```css
/* Page shell — neutral gray-black depth (no hue) */
--gradient-hero: linear-gradient(
  135deg,
  hsl(0, 0%, 10%) 0%,
  hsl(0, 0%, 8%) 100%
);

/* Card depth — barely perceptible lift on neutral dark */
--gradient-card: linear-gradient(
  180deg,
  hsl(0, 0%, 13%) 0%,
  hsl(0, 0%, 11%) 100%
);

/* Primary accent — spectral glow, not a saturated CTA ramp */
--gradient-accent: linear-gradient(
  180deg,
  hsl(265, 38%, 76%) 0%,
  hsl(272, 32%, 68%) 100%
);

/* Stat card highlight — neutral lift only */
--gradient-stat: linear-gradient(
  135deg,
  hsla(0, 0%, 100%, 0.04) 0%,
  transparent 60%
);

/* Optional hero icon halo — very soft radial glow */
--gradient-spectral-halo: radial-gradient(
  circle at 50% 40%,
  hsla(265, 45%, 78%, 0.14) 0%,
  hsla(265, 30%, 60%, 0.05) 45%,
  transparent 70%
);
```

> **Rules for ghost gradients:**
> - **Background gradients stay neutral** (achromatic gray-black only). Purple tints belong in accent/halos — not page or card fills.
> - No high-saturation purple-to-magenta ramps on CTAs.
> - Prefer **vertical** (`180deg`) gradients for mist; use diagonal only for faint stat wisps.
> - Accent gradients stay **light and desaturated** — they should glow, not shout.
> - Use `--gradient-spectral-halo` sparingly (nav mark 👻, upload hero icon) — one soft glow is enough.

### 2.4 Semantic Color Usage

| Context | Token(s) | Notes |
|---------|----------|-------|
| Page shell | `--bg-primary` | Flat neutral dark fill — avoid purple-tinted page gradients |
| Cards & panels | `--bg-secondary`, `--gradient-card`, `--border-subtle` | No drop shadows; depth from tone only |
| Primary actions | `--gradient-accent`, Shadcn `<Button>` (default variant) | Pale spectral fill; hover brightens + glow ring + lift — never deep purple |
| Links & active nav | `--accent-primary`, `--accent-primary-hover` | Solid spectral lavender |
| Positive / negative stats | `--accent-green`, `--accent-red` | Keep semantic colors muted so purple remains the mood |
| Selection highlight | `--accent-glow` | Text selection should feel like a soft purple mist |

---

## 3. Typography

### 3.1 Font Stack

| Usage | Font | Fallback |
|-------|------|----------|
| **Headings** | `Inter` (Google Fonts) | `system-ui, -apple-system, sans-serif` |
| **Body** | `Inter` | `system-ui, -apple-system, sans-serif` |
| **Mono/Data** | `JetBrains Mono` (Google Fonts) | `ui-monospace, monospace` |

> Load via `next/font/google` for zero layout shift and automatic font optimization.

### 3.2 Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 28px / 1.75rem | 700 | 1.2 | Page titles |
| `h2` | 22px / 1.375rem | 600 | 1.3 | Section titles |
| `h3` | 18px / 1.125rem | 600 | 1.4 | Card titles |
| `body` | 14px / 0.875rem | 400 | 1.6 | Default text |
| `body-sm` | 13px / 0.8125rem | 400 | 1.5 | Secondary text, labels |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Timestamps, metadata |
| `mono` | 13px / 0.8125rem | 400 | 1.4 | Usernames, data values |

> **Rule:** Never go below 12px. Keep weight variations minimal — 400 and 600 only, with 700 reserved for h1.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Base unit: `4px`. All spacing is a multiple of this.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline padding, icon gaps |
| `sm` | 8px | Tight element spacing |
| `md` | 16px | Default element spacing, card padding |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Page section separation |
| `2xl` | 48px | Major layout gaps |

### 4.2 Layout Constants

| Constant | Value |
|----------|-------|
| Max content width | `960px` |
| Card border radius | `12px` |
| Button border radius | `8px` |
| Input border radius | `8px` |
| Page horizontal padding | `16px` (mobile), `24px` (desktop) |
| Minimum touch target | `44px` × `44px` (mobile interactive controls) |
| Safe-area footer padding | `max(16px, env(safe-area-inset-bottom))` |

### 4.3 Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |

> **Rule:** Mobile-first. The app must be usable at 375px width. Content never exceeds 960px on desktop.

### 4.4 Stack-on-Mobile Rule

Any horizontal two-column flex or grid whose children cannot each reach `min-w-[140px]` at 375px **must stack to a single column** below the `sm` breakpoint (640px). Applies to snapshot pickers, dual upload slots (already stacked), and any future side-by-side form controls.

---

## 5. Component Styling Principles

### 5.1 Cards

- Background: `--bg-secondary` with `--gradient-card`
- Border: `1px solid --border-subtle`
- Border radius: `12px`
- Padding: `md` (16px)
- No drop shadows — depth comes from border and background contrast only
- Hover: border transitions to `--border-default` over `150ms`

### 5.2 Buttons (Shadcn UI)

All button controls use the Shadcn **Button** primitive (`src/components/ui/button.tsx`) built on `class-variance-authority`. Native `<button>` elements are only used inside non-interactive wrappers (e.g. icon-only nav triggers that already meet the touch-target rule). The Button component supports the `asChild` prop (via `@radix-ui/react-slot`) for composing as a Next.js `<Link>` or anchor.

**Shared rules (all variants):**
- Border radius: `8px` (`rounded-lg`)
- Focus: visible focus ring using `--accent-glow` only — no box-shadow stacks
- Disabled: `opacity-50` + `cursor-not-allowed`
- Mobile touch target: `min-h-[44px]` below `sm` (§9.1) — never shrink below 44px tap area on touch viewports

**Variants:**

| Variant | Token | Usage | Hover | Notes |
|---------|-------|-------|-------|-------|
| `default` | `--gradient-accent` fill, `--text-on-accent` text | Primary CTAs (Save Snapshot, Download, Confirm) | Same pale gradient + `brightness(1.07)` + spectral ring glow + `translateY(-1px)` lift | Never darken to deep purple |
| `destructive` | `--accent-red` fill, white text | Destructive confirm (Delete snapshot, Clear all data, Save-and-remove-oldest) | `brightness(1.07)` only — keep semantic red unmixed | No spectral glow; this is the **only** non-purple primary fill |
| `outline` | Transparent fill, `1px solid --border-default`, `--text-secondary` | Secondary actions (Cancel, header utility buttons) | Background → `--bg-tertiary`, text → `--text-primary` | Ghost aesthetic equivalent of secondary buttons |
| `ghost` | Transparent fill, no border, `--text-secondary` | Icon-only nav triggers, dialog dismissers, low-emphasis row actions | Background → `--bg-tertiary`, text → `--text-primary` | Use for tap targets that already have surrounding contrast |
| `link` | Inline text only, `--accent-primary` | Inline navigation links inside body copy | Underline + `--accent-primary-hover` | Use sparingly; prefer real `<Link>` |

**Sizes:**

| Size | Height | Padding | Usage |
|------|--------|---------|-------|
| `default` | `min-h-[44px] sm:h-9` | `px-4 py-2` | Forms, primary CTAs, dialog footer buttons |
| `sm` | `h-9` | `px-3` | Toolbar / inline / table-row controls (desktop-only emphasis) |
| `icon` | `min-h-[44px] min-w-[44px]` (mobile) / `h-9 w-9` (sm+) | square | Icon-only buttons (overflow menu trigger, snapshot history row actions) |

> **Rule:** Use `variant="default"` for the single primary action of a view. Use `variant="destructive"` only inside confirmation dialogs that already explain the consequence. Multiple `default` buttons on one screen dilutes the spectral CTA accent and is forbidden.

### 5.2.1 Dialog (Shadcn UI)

All modal flows (confirmations, export picker, prune-before-save) use the Shadcn **Dialog** primitive (`src/components/ui/dialog.tsx`) built on `@radix-ui/react-dialog`. Hand-rolled overlay `<div>` modals are forbidden.

| Property | Value |
|----------|-------|
| Overlay | `bg-black/60`, full-screen fixed |
| Content background | `--bg-secondary` |
| Content border | `1px solid --border-subtle` |
| Content radius | `12px` (`rounded-xl`) |
| Content padding | `24px` (`p-6`) |
| Max width | `max-w-md` (confirm) · `max-w-lg` (export picker) |
| Shadow | None — depth from tone only (no heavy box-shadow stacks) |
| Title | `text-lg font-semibold text-text-primary` (Shadcn `DialogTitle`) |
| Description | `text-sm text-text-secondary` (Shadcn `DialogDescription`) |
| Close trigger | ESC key + outside-click; explicit `X` button optional |
| Footer | `flex justify-end gap-2`; Cancel (`outline`) then Confirm (`default` or `destructive`) |
| Animation | Radix data-state fade + scale, ≤ 200ms (§6) |
| Mobile | Content fits within viewport with `p-4` outer padding; long bodies use `max-h-[90vh] overflow-y-auto` |

### 5.2.2 Progress (Shadcn UI)

Linear progress indicators (upload parsing, future long-running tasks) use the Shadcn **Progress** primitive (`src/components/ui/progress.tsx`) built on `@radix-ui/react-progress`.

| Property | Value |
|----------|-------|
| Track background | `--bg-tertiary` |
| Track height | `h-1.5` (compact, inline in drop zones) |
| Track radius | `rounded-full` |
| Indicator fill | `--accent-primary` (solid spectral lavender — no gradient on small tracks) |
| Indicator transition | `width 300ms ease-in-out` (§6) |
| Indeterminate state | Not used — always provide a numeric `value` (0–100) |

### 5.2.3 DropdownMenu (Shadcn UI)

The mobile header overflow menu (§9.2) and any future contextual menus use the Shadcn **DropdownMenu** primitive (`src/components/ui/dropdown-menu.tsx`) built on `@radix-ui/react-dropdown-menu`. The previous custom Tailwind + Lucide popover in `Header.tsx` is replaced — see `docs/features/06_mobile_responsive.md` §5.1 and Resolved Decision #2.

| Property | Value |
|----------|-------|
| Trigger | Shadcn `<Button variant="ghost" size="icon">` with `MoreVertical` icon |
| Content panel | `--bg-secondary`, `1px solid --border-subtle`, `rounded-xl`, `py-1`, `min-w-[180px]` |
| Item hover/focus | `--bg-tertiary` background, `--text-primary` text |
| Item padding | `px-4 py-3` (44px-equivalent on mobile) |
| Destructive item | `--accent-red` text on hover/focus |
| Separator | `--border-subtle` |
| Animation | Radix data-state fade + slide, ≤ 200ms (§6) |
| Mobile | Items are stacked, full-width inside content panel; each item meets 44px touch target |

### 5.3 Inputs & Drop Zone

- Background: `--bg-primary`
- Border: `1px dashed --border-default`
- Border radius: `12px`
- Transition: border-color `150ms ease`
- Focus: border-color transitions to `--accent-primary`

**ZIP upload:** Single full-width zone, `min-h` ~220px.

**JSON/HTML dual upload:** Two `FileSlotDropZone` components in a responsive grid (`grid-cols-1` mobile, `sm:grid-cols-2` desktop), `gap-4`, panel `max-w-2xl`. Each slot `min-h` ~180px with a title (Followers / Following) and filename hint above the dashed area. Per-slot states: idle (default), drag-over (primary border), parsing (spinner on active slot only), loaded (green border + count), error (red border). Save action lives in `UploadReadyBar` below the grid, not inside a slot.

**Touch-device copy:** On `(hover: none) and (pointer: coarse)` devices, replace drag-and-drop instructional text with tap-to-select copy (e.g. "Tap to select files" / "Tap to select file"). The dashed border, upload icon, and click-to-browse behavior remain unchanged.

### 5.3.1 Select (Shadcn UI)

All dropdown `<select>` controls use the Shadcn **Select** primitive (`src/components/ui/select.tsx`) built on `@radix-ui/react-select` — never native OS `<select>` elements.

| Property | Value |
|----------|-------|
| Trigger background | `--bg-primary` |
| Trigger border | `1px solid --border-default` |
| Trigger radius | `8px` (`rounded-lg`) |
| Trigger text | `text-sm`, `--text-primary` |
| Focus ring | `ring-1 ring-accent-primary` |
| Chevron | Lucide `ChevronDown`, muted (`opacity-50`) |
| Content panel | `--bg-secondary`, `--border-subtle`, `rounded-lg`, elevated z-index |
| Item hover/focus | `--bg-tertiary` background |
| Selected item indicator | Lucide `Check`, `--accent-primary` |
| Mobile touch target | Trigger `min-h-[44px]` below `sm`; items `min-h-[44px]` below `sm` |
| Size variants | `default` (full-width forms) and `sm` (compact toolbar controls) |

### 5.4 Data Tables / Lists

- No zebra striping — too visually noisy
- Rows separated by `1px solid --border-subtle`
- Hover: row background shifts to `--bg-tertiary`
- Username column uses mono font
- Sortable columns indicated by subtle caret icon
- **Mobile (`< sm`):** Hide secondary columns (e.g. timestamps) to avoid horizontal squeeze; rows use a compact single-line layout with username + profile link. Interactive row controls meet the 44px touch target (§9.1).

### 5.5 Stat Cards

- Background: `--bg-secondary` with `--gradient-stat` + `--gradient-card` (neutral lift only)
- Large number in `h2` weight
- Label below in `body-sm` + `--text-secondary`
- Positive values: `--accent-green`
- Negative values: `--accent-red`
- Neutral values: `--text-primary`
- Optional: very faint `--accent-spectral` top border (1px) for a spectral edge — use on one featured stat at most
- **Responsive grid:** `grid-cols-2` on mobile, `sm:grid-cols-3` on tablet+. When an odd count (e.g. 5 cards) would orphan the last item, the final card spans full width on mobile via `col-span-2 sm:col-span-1`.

---

## 6. Motion & Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transitions | Fade in | 200ms | `ease-out` |
| Card hover border | Color transition | 150ms | `ease` |
| Button hover | Brighten + spectral glow + lift | 150ms | `ease` |
| Progress bar | Width expansion | 300ms | `ease-in-out` |
| Drop zone drag-over | Border pulse | 600ms | `ease-in-out` (infinite) |
| Stat number count-up | Number increment | 400ms | `ease-out` |
| Toast notifications | Slide in from top-right | 200ms | `ease-out` |

> **Rule:** All animations under 400ms. No bouncing, no spring physics, no parallax. Motion exists to confirm interactions, not to entertain.

---

## 7. Iconography

- **Brand mark (header nav):** 👻 ghost emoji inside `.spectral-icon-wrap` — the only emoji in the UI
- **All other UI icons:** **Lucide React** (consistent with tech stack)
- Size: `16px` (inline), `20px` (standalone), `24px` (hero)
- Color: inherits from text color by default; accent icons use `--accent-primary`
- Stroke width: 1.5px (Lucide default)
- Lucide icons are outline only — no filled variants

---

## 8. Dark Mode Notes

- Dark mode is the **default and only theme** for v1
- No light mode toggle in initial release
- All colors are defined as CSS custom properties for future theme-ability
- Shadcn UI components will use the `dark` class on `<html>` and custom CSS variables

> **Future consideration:** If light mode is added later, the entire color system flips via CSS custom property overrides. No component code changes required.

---

## 9. Mobile & Touch

### 9.1 Minimum Touch Targets

All interactive controls on viewports below `sm` (640px) must meet a **44×44px minimum** tap area (Apple HIG + WCAG 2.5.5). Apply via `min-h-[44px] min-w-[44px]` on icon buttons and adequate vertical padding on text buttons. Desktop sizes may remain compact.

### 9.2 Mobile Header Pattern

Below `sm`, the header collapses secondary nav actions into a single **overflow menu** triggered by a `MoreVertical` (⋮) Lucide icon. The logo and app name stay visible. Menu items: Export data, Clear data (when snapshots exist), GitHub. No bottom tab bar — this is a single-session analytical tool, not a multi-tab app.

At `sm+`, the current inline nav (text buttons) is shown; the overflow trigger is hidden.

### 9.3 Drag-and-Drop on Touch

Touch devices cannot drag files from the OS file manager onto a web drop zone in most mobile browsers. Detect via `matchMedia('(hover: none) and (pointer: coarse)')` and swap idle-state copy:

| Context | Desktop copy | Touch copy |
|---------|-------------|------------|
| ZIP zone | "Drag & drop your Instagram export here" | "Tap to select your Instagram export" |
| File slot | "Drop file here" | "Tap to select file" |
| Secondary hint | "or click to browse files" | _(omitted — tap is the primary action)_ |

Drag-over states remain for hybrid devices (e.g. iPad with pointer); they are simply never shown on pure touch.

### 9.4 Table-to-List Collapse

Account list rows at `< sm` hide the timestamp column. The username link remains tappable with a minimum 44px row height. Timestamp is visible again at `sm+`.

### 9.5 Safe-Area Insets

The footer applies bottom padding using `env(safe-area-inset-bottom)` so content is not obscured by the iOS home indicator. Header horizontal padding follows §4.2 (`16px` mobile).

### 9.6 Chart Touch UX

The timeline chart is **view-only on touch** — users read trends from the line series and the static legend below the chart. Tooltip hover interaction is a desktop enhancement; do not rely on tap-to-tooltip for critical information on mobile.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-22 | v0.6 | Shadcn UI foundation adoption: replaced §5.2 `.btn-primary` rules with Shadcn `Button` variants (default/destructive/outline/ghost/link + sizes); added §5.2.1 Dialog, §5.2.2 Progress, §5.2.3 DropdownMenu primitive rules; updated §2.4 to reference the Shadcn Button |
| 2026-05-22 | v0.5 | Added §5.3.1 Shadcn Select primitive rules |
| 2026-05-22 | v0.4 | Added §9 Mobile & Touch; §4.4 stack-on-mobile rule; touch copy, stat grid, and list collapse rules in §5 |
| 2026-05-19 | v0.3 | Ghost aesthetic palette and spectral lavender accents |
