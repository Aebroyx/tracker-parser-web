# System Specification — Instagram Follower Tracker (Web)

> **Document Status:** Draft v0.1  
> **Last Updated:** 2026-05-12  
> **Author:** Spec-Driven Development Process

---

## 1. Vision Statement

Build a **privacy-first, client-side only** web application that enables Instagram users to:

1. Upload their official Instagram data export (`.zip`, raw `.json`, or `.html` files).
2. Parse and visualize their **followers** and **following** lists.
3. Identify **non-followers** (accounts you follow that don't follow you back).
4. Identify **fans** (accounts that follow you but you don't follow back).
5. **Accumulate snapshots over time** and compare any two to detect **unfollowers**, **new followers**, and **changes** between backups.
6. View a **timeline dashboard** showing follower analytics progression across all uploaded backups.

**No user data ever leaves the browser.** There is no backend, no database server, no telemetry, and no external API calls involving user data.

---

## 2. Core Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Privacy-First** | All parsing, diffing, and storage happens exclusively in the browser. Zero network transmission of user data. |
| 2 | **Offline-Capable** | Once loaded, the app must function without an internet connection. All logic is client-side. |
| 3 | **Spec-Driven** | Every feature is documented in `docs/` *before* implementation. Specs are the source of truth. |
| 4 | **Progressive Complexity** | Start with core parsing → add diffing → add history. Features are layered, not monolithic. |
| 5 | **Zero Account Required** | Users never create an account. The app has no authentication layer. |

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | File-based routing, SSR-capable layout shells, standard Vercel deployment. |
| **Language** | TypeScript (Strict Mode) | Type safety for complex JSON parsing and data diffing logic. |
| **Styling** | Tailwind CSS v3+ | Utility-first CSS for rapid, consistent UI development. Design tokens defined in `docs/DESIGN_LANGUAGE.md`. |
| **UI Components** | Shadcn UI | Accessible, composable primitives built on Radix UI. Not a dependency — components are copied into the project. |
| **Icons** | Lucide React | Consistent, lightweight SVG icon library. |
| **Client Storage** | IndexedDB via Dexie.js | Structured storage for accumulated snapshots and timeline history. Survives page refreshes. All data stays in the browser. |
| **Heavy Parsing** | Web Workers | Offload JSON/HTML parsing of large exports to a background thread to keep the UI responsive. |
| **Archive Handling** | JSZip | Client-side `.zip` extraction to access Instagram export files without server involvement. |
| **HTML Parsing** | DOMParser (built-in) | Parse Instagram HTML exports in the Web Worker using the browser-native `DOMParser` API. No external dependency required. |
| **Deployment** | Vercel (Standard) | Standard Next.js deployment on Vercel. No server compute for user data — Vercel only serves the app. Free tier sufficient. |

---

## 4. Privacy-First Protocol

This section is **non-negotiable** and governs all implementation decisions.

### 4.1 Data Handling Rules

| Rule | Enforcement |
|------|------------|
| **No data transmission** | The application makes zero HTTP requests containing user data. This includes analytics, error reporting, and logging services. |
| **No server-side processing** | Next.js is used purely for its client-side rendering capabilities. No API routes (`/api/*`) are created. No server actions are used for user data. |
| **No third-party data SDKs** | Libraries like Google Analytics, Sentry (with PII), or Mixpanel are prohibited. If analytics are added in the future, they must be privacy-preserving (e.g., Plausible self-hosted) and document-only (page views, no user data). |
| **Local-only persistence** | All stored data resides in the user's browser via IndexedDB. The user can clear it at any time via in-app controls or browser settings. |
| **Explicit user consent** | The app must display a clear notice explaining where data is stored and that nothing leaves the device, *before* the first file upload. |

### 4.2 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **XSS via parsed JSON/HTML** | All rendered values from parsed JSON or HTML are sanitized. React's default JSX escaping is leveraged. No `dangerouslySetInnerHTML` is used on user-sourced data. HTML exports are parsed via `DOMParser` for data extraction only — the raw HTML is never rendered. |
| **Malicious ZIP contents** | Only `.json` and `.html` files are extracted from uploaded `.zip` archives. File size limits are enforced (max 500MB uncompressed). Path traversal in ZIP entries is rejected. |
| **Malicious HTML content** | HTML files are parsed with `DOMParser` in a Web Worker (no DOM access). Only text content and `href` attributes from `<a>` tags are extracted. Embedded `<script>` tags, event handlers, and `<iframe>` elements are ignored. No HTML is injected into the live document. |
| **IndexedDB data exposure** | Users are informed that anyone with physical access to their browser can view stored data. A "Clear All Data" button is always accessible. |

---

## 5. Target Instagram Export Structure

Instagram provides user data exports in **two selectable output formats** (JSON and HTML) and within JSON there are legacy and current schema versions. The parser must handle **all three** variants:

### 5.1 Current Format (2024+)

```
instagram-data-export/
├── followers_and_following/
│   ├── followers_1.json
│   ├── following.json
│   └── ...
└── ...
```

**`followers_1.json` structure:**
```json
[
  {
    "title": "",
    "media_list_data": [],
    "string_list_data": [
      {
        "href": "https://www.instagram.com/username",
        "value": "username",
        "timestamp": 1700000000
      }
    ]
  }
]
```

**`following.json` structure:**
```json
{
  "relationships_following": [
    {
      "title": "",
      "media_list_data": [],
      "string_list_data": [
        {
          "href": "https://www.instagram.com/username",
          "value": "username",
          "timestamp": 1700000000
        }
      ]
    }
  ]
}
```

### 5.2 Legacy JSON Format (Pre-2024)

```json
{
  "relationships_followers": [
    {
      "value": "username",
      "timestamp": 1600000000
    }
  ]
}
```

### 5.3 HTML Format (All Versions)

When the user selects "HTML" instead of "JSON" during the Instagram export request, the export contains `.html` files instead of `.json` files. The folder structure is identical:

```
instagram-data-export/
├── followers_and_following/
│   ├── followers_1.html
│   ├── following.html
│   └── ...
└── ...
```

**`followers_1.html` typical structure:**
```html
<html>
<body>
  <div class="_a6-g">
    <div class="_a6-p">
      <div class="_a6-b">
        <!-- Title: "Followers" -->
      </div>
      <!-- Repeated block per follower: -->
      <div class="_a6-b">
        <div class="_a6-o">
          <a href="https://www.instagram.com/username">username</a>
        </div>
        <div class="_a6-o">
          2025-05-12T10:00:00+00:00
        </div>
      </div>
      <!-- ... more follower entries ... -->
    </div>
  </div>
</body>
</html>
```

> **WARNING: Unstable class names.** Instagram frequently changes CSS class names in HTML exports (e.g., `_a6-b`, `_a6-o`, `_a6-p`). The HTML parser **must not** rely on class names. Instead, it should use a **structural heuristic** approach:
> 1. Find all `<a>` tags with `href` containing `instagram.com/`
> 2. Extract the username from the `<a>` tag's text content
> 3. Look for sibling/adjacent text nodes containing ISO 8601 timestamps
> 4. Fall back to parent container iteration if the heuristic fails
>
> See `docs/features/01_file_processing.md` §5.3 for the full HTML normalization algorithm.

> **IMPORTANT:** The parser must auto-detect the format (JSON current, JSON legacy, or HTML) and normalize all three into a unified internal schema. See `docs/ARCHITECTURE.md` §3 for the canonical data model.

---

## 6. Feature Roadmap (High-Level)

| Phase | Feature | Spec File | Status |
|-------|---------|-----------|--------|
| 1 | File Upload & JSON/HTML Parsing | `docs/features/01_file_processing.md` | 📝 Draft |
| 2 | Snapshot Storage & Timeline | `docs/features/02_snapshot_timeline.md` | ⏳ Planned |
| 3 | Snapshot Diff Engine | `docs/features/03_diff_engine.md` | ⏳ Planned |
| 4 | Dashboard & Timeline Visualization | `docs/features/04_dashboard_ui.md` | ⏳ Planned |
| 5 | Data Export & Clear Controls | `docs/features/05_data_management.md` | ⏳ Planned |

---

## 7. Non-Goals (Explicit Exclusions)

The following are explicitly **out of scope** for this project:

- ❌ Instagram API integration (no OAuth, no scraping)
- ❌ User accounts or authentication
- ❌ Backend server or database
- ❌ Real-time follower tracking
- ❌ Multi-user collaboration
- ❌ Mobile native app (responsive web only)
- ❌ Automated Instagram data fetching

---

## 8. Glossary

| Term | Definition |
|------|-----------|
| **Followers** | Accounts that follow the user. |
| **Following** | Accounts that the user follows. |
| **Non-Followers** | Accounts in "Following" that are NOT in "Followers" (you follow them, they don't follow you back). |
| **Fans** | Accounts in "Followers" that are NOT in "Following" (they follow you, you don't follow them back). |
| **Mutual** | Accounts that appear in both "Followers" and "Following." |
| **Snapshot** | A timestamped record of a parsed Instagram export, stored in IndexedDB. Snapshots accumulate over time to form a timeline. |
| **Diff** | The computed difference between two snapshots (e.g., Dec 2025 vs. Jan 2026). Shows gained/lost followers and following. |
| **Export** | The `.zip`, `.json`, or `.html` file downloaded from Instagram's "Download Your Information" feature. |
