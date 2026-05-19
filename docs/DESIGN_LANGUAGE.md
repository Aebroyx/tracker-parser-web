# Design Language — Instaghost Tracker

> **Document Status:** Draft v0.1  
> **Last Updated:** 2026-05-19  
> **Parent Spec:** `docs/SYSTEM_SPEC.md`

---

## 1. Design Philosophy

**Dark. Minimal. Data-forward.**

Instaghost Tracker presents dense analytical data in a clean, distraction-free interface. Every element earns its place. The design favors negative space, subtle gradients, and muted tones — letting the data speak. No decorative elements, no skeuomorphism, no visual noise.

---

## 2. Color System

### 2.1 Base Palette (Dark Mode Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `hsl(228, 16%, 8%)` | Page background — near-black with a cool blue undertone |
| `--bg-secondary` | `hsl(228, 14%, 12%)` | Card/panel backgrounds |
| `--bg-tertiary` | `hsl(228, 12%, 16%)` | Elevated surfaces (modals, popovers, hover states) |
| `--border-subtle` | `hsl(228, 10%, 20%)` | Card borders, dividers — barely visible |
| `--border-default` | `hsl(228, 10%, 28%)` | Input borders, interactive element outlines |
| `--text-primary` | `hsl(220, 20%, 95%)` | Main body text — off-white, never pure white |
| `--text-secondary` | `hsl(220, 12%, 60%)` | Labels, descriptions, secondary info |
| `--text-muted` | `hsl(220, 10%, 40%)` | Placeholder text, disabled states |

### 2.2 Accent Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `hsl(250, 70%, 60%)` | Primary CTA buttons, active states — muted violet |
| `--accent-primary-hover` | `hsl(250, 70%, 55%)` | Button hover |
| `--accent-glow` | `hsla(250, 70%, 60%, 0.15)` | Subtle glow behind primary elements |
| `--accent-green` | `hsl(155, 60%, 50%)` | Positive metrics — gained followers, success states |
| `--accent-red` | `hsl(0, 65%, 55%)` | Negative metrics — lost followers, errors |
| `--accent-amber` | `hsl(38, 80%, 55%)` | Warnings, incomplete states |

### 2.3 Gradient Tokens

```css
/* Hero/header gradient — subtle, not flashy */
--gradient-hero: linear-gradient(135deg, hsl(250, 30%, 12%) 0%, hsl(228, 16%, 8%) 100%);

/* Card highlight gradient — barely perceptible depth */
--gradient-card: linear-gradient(180deg, hsl(228, 14%, 13%) 0%, hsl(228, 14%, 11%) 100%);

/* Accent gradient — for primary CTAs only */
--gradient-accent: linear-gradient(135deg, hsl(250, 70%, 58%) 0%, hsl(270, 60%, 52%) 100%);

/* Stat card subtle shimmer */
--gradient-stat: linear-gradient(135deg, hsla(250, 40%, 20%, 0.3) 0%, transparent 60%);
```

> **Rule:** Gradients are always subtle. Never more than 2 stops. Never saturated enough to be "flashy." They add depth, not decoration.

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
- Background: `--gradient-accent`
- Text: white
- Padding: `8px 16px`
- Border radius: `8px`
- Hover: brightness increases slightly (`filter: brightness(1.1)`)
- No box-shadow — only a subtle `--accent-glow` on focus

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

- Background: `--bg-secondary` with directional `--gradient-stat`
- Large number in `h2` weight
- Label below in `body-sm` + `--text-secondary`
- Positive values: `--accent-green`
- Negative values: `--accent-red`
- Neutral values: `--text-primary`

---

## 6. Motion & Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transitions | Fade in | 200ms | `ease-out` |
| Card hover border | Color transition | 150ms | `ease` |
| Button hover | Brightness shift | 150ms | `ease` |
| Progress bar | Width expansion | 300ms | `ease-in-out` |
| Drop zone drag-over | Border pulse | 600ms | `ease-in-out` (infinite) |
| Stat number count-up | Number increment | 400ms | `ease-out` |
| Toast notifications | Slide in from top-right | 200ms | `ease-out` |

> **Rule:** All animations under 400ms. No bouncing, no spring physics, no parallax. Motion exists to confirm interactions, not to entertain.

---

## 7. Iconography

- Library: **Lucide React** (consistent with tech stack)
- Size: `16px` (inline), `20px` (standalone), `24px` (hero)
- Color: inherits from text color by default
- Stroke width: 1.5px (Lucide default)
- Never use filled icons — outline only

---

## 8. Dark Mode Notes

- Dark mode is the **default and only theme** for v1
- No light mode toggle in initial release
- All colors are defined as CSS custom properties for future theme-ability
- Shadcn UI components will use the `dark` class on `<html>` and custom CSS variables

> **Future consideration:** If light mode is added later, the entire color system flips via CSS custom property overrides. No component code changes required.
