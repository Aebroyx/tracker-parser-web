# Design Language — Instaghost Tracker

> **Document Status:** Draft v0.3  
> **Last Updated:** 2026-05-19  
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
| Primary actions | `--gradient-accent`, `.btn-primary` | Pale spectral fill; hover brightens + glow ring + lift — never deep purple |
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

### 4.3 Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |

> **Rule:** Mobile-first. The app must be usable at 375px width. Content never exceeds 960px on desktop.

---

## 5. Component Styling Principles

### 5.1 Cards

- Background: `--bg-secondary` with `--gradient-card`
- Border: `1px solid --border-subtle`
- Border radius: `12px`
- Padding: `md` (16px)
- No drop shadows — depth comes from border and background contrast only
- Hover: border transitions to `--border-default` over `150ms`

### 5.2 Buttons

**Primary:**
- Background: `--gradient-accent` (spectral lavender glow — not a loud purple ramp)
- Text: `hsl(0, 0%, 12%)` — dark neutral for contrast on pale ghost buttons
- Padding: `8px 16px`
- Border radius: `8px`
- Hover: **same pale gradient** — brighten slightly + soft spectral ring/glow + lift (`translateY(-1px)`). Never darken to deep purple.
- Active: settle back down with reduced glow
- Focus: `--accent-glow` only — no box-shadow stacks

**Secondary/Ghost:**
- Background: transparent
- Border: `1px solid --border-default`
- Text: `--text-secondary`
- Hover: background shifts to `--bg-tertiary`

### 5.3 Inputs & Drop Zone

- Background: `--bg-primary`
- Border: `1px dashed --border-default`
- Border radius: `12px`
- Transition: border-color `150ms ease`
- Focus: border-color transitions to `--accent-primary`

### 5.4 Data Tables / Lists

- No zebra striping — too visually noisy
- Rows separated by `1px solid --border-subtle`
- Hover: row background shifts to `--bg-tertiary`
- Username column uses mono font
- Sortable columns indicated by subtle caret icon

### 5.5 Stat Cards

- Background: `--bg-secondary` with `--gradient-stat` + `--gradient-card` (neutral lift only)
- Large number in `h2` weight
- Label below in `body-sm` + `--text-secondary`
- Positive values: `--accent-green`
- Negative values: `--accent-red`
- Neutral values: `--text-primary`
- Optional: very faint `--accent-spectral` top border (1px) for a spectral edge — use on one featured stat at most

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
