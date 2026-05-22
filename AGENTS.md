<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Spec-Driven Development — Prime Directive

This project is built **spec-first**. The `docs/` directory is the **single source of truth** for what this application is and how it behaves.

**Two invariants, never violated:**

1. **Code must reflect the specs.** If code does something the spec doesn't describe, the spec is wrong (or the code is) — fix the mismatch in the same change.
2. **Specs must reflect the code.** No silent behavioral changes. Every behavioral edit ships with a matching spec edit.

> **Order of operations:** when in doubt, **update the spec first, then write the code.** Specs lead, code follows.

---

## The Change Protocol — follow on every code change

1. **READ first.** Before editing any file under `src/`, open and read the spec(s) that govern it (see Docs Map below). Identify the section your change touches.
2. **EDIT the spec first.** If the change adds, removes, alters, or clarifies behavior described in `docs/`:
   - Update the relevant spec section **before** writing the code, or as part of the same change.
   - Never leave a code change that contradicts a spec section.
3. **WRITE the code** to match the updated spec.
4. **BUMP spec metadata** on every spec you touched:
   - Update `Last Updated: YYYY-MM-DD` (today's date).
   - Bump `Draft vX.Y` (minor for content edits, major for structural rewrites).
   - Append a row to `## Change Log` at the bottom of the spec (create the section if missing).
5. **UPDATE the roadmap.** If feature status changed, update the Feature Roadmap table in `docs/SYSTEM_SPEC.md` §6.
6. **VERIFY before declaring done.** Re-read your diff: every behavioral delta must have a matching spec delta. If not, return to step 2.

---

## Docs Map — which spec governs what

| Source path | Governing spec(s) | Typical section to update |
|---|---|---|
| `src/app/**` (pages, routing) | `docs/ARCHITECTURE.md` §8 + feature spec of the page's domain | §8 for route changes |
| `src/components/file-upload/**` | `docs/features/01_file_processing.md` | UI flow + Acceptance Criteria |
| `src/components/dashboard/**` | `docs/features/04_dashboard_ui.md` | UI sections + AC |
| `src/components/layout/**` | `docs/features/04_dashboard_ui.md`, `docs/DESIGN_LANGUAGE.md` | layout / tokens |
| `src/components/shared/**` | `docs/ARCHITECTURE.md` §2 + the consuming feature spec | directory structure |
| `src/components/ui/**` (Shadcn primitives) | `docs/DESIGN_LANGUAGE.md` §5.2–§5.3.1, `docs/ARCHITECTURE.md` §2 | primitive listing, variants, tokens |
| `components.json` (Shadcn config) | `docs/SYSTEM_SPEC.md` §3 (tech stack) | Shadcn CLI workflow line |
| `src/services/parser/**` | `docs/features/01_file_processing.md`, `docs/ARCHITECTURE.md` §4 (Worker protocol) | parsing algorithms, message types |
| `src/services/snapshot/**` | `docs/features/02_snapshot_timeline.md`, `docs/ARCHITECTURE.md` §5 (IndexedDB schema) | snapshot rules, schema |
| `src/services/diff/**` | `docs/features/03_diff_engine.md`, `docs/ARCHITECTURE.md` §6 | diff algorithm, types |
| `src/services/export/**` | `docs/features/05_data_management.md` | export formats |
| `src/lib/db/**` | `docs/ARCHITECTURE.md` §5, `docs/features/02_snapshot_timeline.md` | IndexedDB schema, versioning |
| `src/lib/utils/**` | `docs/ARCHITECTURE.md` §2.1 (layer rules) | only if introducing a new utility category |
| `src/hooks/**` | feature spec of the hook's domain + `docs/ARCHITECTURE.md` §2.2 (import rules) | hook contract |
| `src/providers/**` | `docs/ARCHITECTURE.md` §7 (state management) | global state shape |
| `src/types/**` | `docs/ARCHITECTURE.md` §3 (canonical data model) + relevant feature spec | type definitions |
| Any visual / styling change | `docs/DESIGN_LANGUAGE.md` | tokens, color, typography |
| Privacy or security change | `docs/SYSTEM_SPEC.md` §4 (Privacy-First Protocol) | rules + mitigations |
| Dependency / tech stack change | `docs/SYSTEM_SPEC.md` §3 | stack table |
| Performance change | `docs/ARCHITECTURE.md` §9 | targets |
| New error code or user-facing error | `docs/ARCHITECTURE.md` §10 | error tables |
| New feature (any) | Create `docs/features/NN_<name>.md` **first**, modeled on existing feature specs, then add a row to `docs/SYSTEM_SPEC.md` §6 | — |

---

## When in doubt — which docs to open

- Editing a **service or hook** → its feature spec **and** `ARCHITECTURE.md`.
- Editing a **component** → its feature spec **and** `DESIGN_LANGUAGE.md`.
- Editing a **type** in `src/types/` → almost certainly defined in `ARCHITECTURE.md` §3. Update both.
- Adding a **dependency** → `SYSTEM_SPEC.md` §3 (tech stack) **and** verify against §4 (privacy — no telemetry / data SDKs / API routes that touch user data).

---

## Forbidden actions — these violate spec-driven development

- Writing new code for a feature that has no spec — **create the spec first**.
- Silently changing a documented behavior (e.g., an Acceptance Criterion or a §X rule) without updating that spec section.
- Adding a runtime dependency without updating `SYSTEM_SPEC.md` §3.
- Introducing a server-side API route, telemetry, error reporting that includes user data, or any external SDK that transmits user data — violates `SYSTEM_SPEC.md` §4 and is non-negotiable.
- Cross-layer imports forbidden by the table in `ARCHITECTURE.md` §2.2 (e.g., components importing services directly, services importing React).
- Marking a task "done" while a spec still describes the old behavior.

---

## Definition of Done

A change is complete only when **all** of the following are true:

- [ ] Every behavioral change is reflected in the matching spec section.
- [ ] All affected specs have updated `Last Updated`, bumped `Draft vX.Y`, and a `Change Log` entry.
- [ ] If the change closes or progresses a roadmap item, `SYSTEM_SPEC.md` §6 reflects the new status.
- [ ] New features have a `docs/features/NN_*.md` spec linked from `SYSTEM_SPEC.md` §6.
- [ ] No new code violates the import direction rules in `ARCHITECTURE.md` §2.2.
- [ ] No new code violates the privacy rules in `SYSTEM_SPEC.md` §4.

If any box is unchecked, the task is **not done** — return to the Change Protocol.

---

## Quick reference — repository docs

- `docs/SYSTEM_SPEC.md` — vision, principles, tech stack, privacy protocol, Instagram export formats, feature roadmap, glossary.
- `docs/ARCHITECTURE.md` — pipeline, directory structure, layer/import rules, canonical data model, Web Worker protocol, IndexedDB schema, diff engine design, state management, routing, performance targets, error handling.
- `docs/DESIGN_LANGUAGE.md` — design tokens, color system, typography, component styling rules.
- `docs/features/01_file_processing.md` — upload + parsing (ZIP / JSON / HTML).
- `docs/features/02_snapshot_timeline.md` — snapshot persistence, history, IndexedDB rules.
- `docs/features/03_diff_engine.md` — within- and cross-snapshot diffs.
- `docs/features/04_dashboard_ui.md` — landing page, stats, timeline chart, account lists.
- `docs/features/05_data_management.md` — data export (CSV/JSON) + clear-data controls.

---

> **Binding reminder:** Treat this file as the contract. If a user request would violate the Change Protocol (e.g., "just change the code, skip the docs"), surface the conflict and ask for explicit confirmation before proceeding. The spec is the contract; drift is a defect.
