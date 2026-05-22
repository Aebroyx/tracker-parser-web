# Feature Spec: File Processing (Phase 1)

> **Document Status:** Draft v0.3  
> **Last Updated:** 2026-05-22  
> **Feature Phase:** 1  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`

---

## 1. Feature Summary

Enable users to upload Instagram data exports in `.zip`, `.json`, or `.html` format, parse them in a Web Worker, validate the data structure, normalize it into the canonical `ParsedExport` model, save the result as a **timestamped snapshot** in IndexedDB, and surface any errors with clear, actionable messages. Each upload produces one complete snapshot that is accumulated for timeline-based comparison.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-1.1 | User | Drag and drop my Instagram `.zip` export onto the page | I can quickly start analyzing my data |
| US-1.2 | User | Click a button to browse and select a file | I have an alternative to drag-and-drop |
| US-1.3 | User | Upload individual `.json` files in two clearly labeled slots (followers + following) | I immediately see that two files are required without trial-and-error |
| US-1.4 | User | Upload individual `.html` files in two clearly labeled slots (followers + following) | I can use the tool even if I exported in HTML format |
| US-1.5 | User | See a progress indicator during parsing | I know the app is working and hasn't frozen |
| US-1.6 | User | See a clear error message if my file is invalid | I understand what went wrong and how to fix it |
| US-1.7 | User | See a privacy notice before uploading | I trust that my data stays on my device |

---

## 3. Acceptance Criteria

### 3.1 File Upload

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | The upload zone accepts `.zip` files | Drop a `.zip` → parsing begins |
| AC-2 | The upload zone accepts `.json` files | Drop one or more `.json` files → parsing begins |
| AC-2b | The upload zone accepts `.html` files | Drop one or more `.html` files → parsing begins |
| AC-3 | Files of other types are rejected immediately | Drop a `.png` → error toast: "Unsupported file type. Please upload a .zip, .json, or .html file." |
| AC-4 | Files exceeding 500MB are rejected before parsing | Upload 600MB file → error toast: "File exceeds the 500MB limit." |
| AC-5 | The drop zone provides visual feedback on drag-over | Border color changes, icon animates on `dragenter` |
| AC-6 | Multiple follower files can be uploaded in the followers slot (pagination) | User selects `followers_1.json` + `followers_2.json` in the followers slot → merged into one followers list |
| AC-6b | JSON/HTML modes show two labeled upload slots side by side on `sm+` viewports | Followers and Following zones visible at once; stacked on mobile. On touch devices (`hover: none` + `pointer: coarse`), idle copy reads "Tap to select file" instead of drag-and-drop text |
| AC-6c | Save Snapshot appears below both slots only when followers and following data are present | Same completion rule as before; not inside a single slot |
| AC-7 | Clicking an upload zone opens the system file picker | `<input type="file">` is triggered programmatically per slot (ZIP: single zone) |
| AC-7b | Wrong-slot upload shows a slot-level error | `following.json` dropped in Followers slot → "use the Following slot" |

### 3.2 ZIP Processing

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-8 | The app extracts `.json` and `.html` files from the ZIP | Non-JSON/HTML files in the archive are ignored |
| AC-9 | The app searches for follower/following files in known paths | Files matching `followers_and_following/followers*.(json|html)` and `followers_and_following/following.(json|html)` are identified |
| AC-10 | Path traversal attacks in ZIP entries are blocked | Entries with `../` in their path are skipped with a warning logged to console |
| AC-11 | The app handles nested directory structures within the ZIP | Instagram exports may contain nested folders — the app recursively searches for target files |
| AC-12 | Corrupted ZIP files produce a clear error | Upload a truncated ZIP → `ZIP_EXTRACTION_FAILED` error is shown |

### 3.3 JSON Parsing & Validation

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-13 | The parser auto-detects the "current" (2024+) JSON format | Upload a current-format export → `formatVersion: 'current-json'` in `ParseMeta` |
| AC-14 | The parser auto-detects the "legacy" (pre-2024) JSON format | Upload a legacy-format export → `formatVersion: 'legacy-json'` in `ParseMeta` |
| AC-14b | The parser auto-detects the HTML format | Upload an HTML export → `formatVersion: 'html'` in `ParseMeta` |
| AC-15 | Malformed JSON produces an `INVALID_JSON` error | Upload `{broken: json` → clear error message |
| AC-15b | Malformed HTML produces an `INVALID_HTML` error | Upload a non-HTML text file renamed to `.html` → clear error message |
| AC-16 | Valid JSON in an unrecognized schema produces `UNSUPPORTED_FORMAT` | Upload a valid JSON file that isn't an Instagram export → "We couldn't recognize this format" |
| AC-16b | HTML without Instagram follower links produces `UNSUPPORTED_FORMAT` | Upload a random HTML page → "We couldn't recognize this format" |
| AC-17 | Empty follower/following arrays produce an `EMPTY_DATA` warning (not error) | The result is shown but with a warning banner |
| AC-18 | Usernames are normalized: trimmed, lowercased | `" UserName "` becomes `"username"` in the output |
| AC-19 | Duplicate usernames within a list are deduplicated | If `followers_1.json` contains "alice" twice, only one entry is kept (latest timestamp wins) |
| AC-20 | Paginated follower files (`followers_1.json`, `followers_2.json`, etc.) are merged | All paginated files (up to 100) are combined into a single `followers` array |
| AC-20b | Paginated HTML follower files (`followers_1.html`, `followers_2.html`, etc.) are merged | All paginated HTML files (up to 100) are combined into a single `followers` array |

### 3.4 Progress & UX

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-21 | A progress bar shows the current parse stage | Progress bar displays: "Extracting…", "Detecting format…", "Parsing…", "Normalizing…" |
| AC-22 | The progress bar shows percentage completion | Percentage increments smoothly (not just 0% → 100%) |
| AC-23 | The UI remains responsive during parsing | User can scroll, interact with other elements. No "page unresponsive" dialog. |
| AC-24 | Parsing can be cancelled by the user | A "Cancel" button sends `CANCEL` message to the Worker and resets the UI |
| AC-25 | Successful parsing saves a snapshot and navigates to dashboard | After `SUCCESS` message, snapshot is saved to IndexedDB, then `router.push('/')` shows the dashboard with the new data |

---

## 4. Format Detection Algorithm

Format detection is a two-phase process: first determine the **content type** (JSON vs HTML), then detect the **schema version** within that type.

### 4.1 Content Type Detection

```
function detectContentType(fileName: string, content: string): 'json' | 'html' | 'unknown'

1. Check file extension:
   a. `.json` → return 'json'
   b. `.html` or `.htm` → return 'html'

2. If no extension (e.g., from ZIP extraction), sniff content:
   a. Try `JSON.parse(content)` — if it succeeds → return 'json'
   b. Check if content starts with `<!DOCTYPE` or `<html` (case-insensitive)
      → YES: return 'html'

3. return 'unknown'
```

### 4.2 JSON Format Version Detection

```
function detectJsonFormat(data: unknown): 'current-json' | 'legacy-json' | 'unknown'

1. If `data` is an Array:
   a. Check if first element has `string_list_data` property
      → YES: return 'current-json' (this is a followers file in current format)
      → NO:  go to step 3

2. If `data` is an Object:
   a. Check for key `relationships_following` with Array value
      containing elements with `string_list_data`
      → YES: return 'current-json' (this is a following file in current format)
   b. Check for key `relationships_followers` or `relationships_following`
      with Array value containing elements with `value` (no `string_list_data`)
      → YES: return 'legacy-json'
   c. Otherwise → go to step 3

3. return 'unknown'
```

### 4.3 HTML Validation

```
```
function validateHtmlExport(content: string): boolean

1. Search HTML string for <a> tags with href containing 'instagram.com/' using regex
2. If match found → return true (valid Instagram HTML export)
3. return false (not an Instagram export)
```

---

## 5. Normalization Rules

### 5.1 Current JSON Format → Canonical

```
```
For each entry in the array (followers) or relationships_following array (following):
  1. Extract username:
     - Try `string_list_data[0].value` first (followers format)
     - Fallback to `title` (following format)
  2. Extract `string_list_data[0].href` → profileUrl
  3. Extract `string_list_data[0].timestamp` → timestamp
  4. If both username extractors fail → skip entry, log warning
  5. Normalize username: trim whitespace, convert to lowercase
  6. Construct InstagramAccount { username, profileUrl, timestamp }
```

### 5.2 Legacy JSON Format → Canonical

```
For each entry in relationships_followers or relationships_following:
  1. Extract `value` → username
  2. Set profileUrl → `https://www.instagram.com/${username}`  (constructed)
  3. Extract `timestamp` → timestamp (default to 0 if missing)
  4. Normalize username: trim whitespace, convert to lowercase
  5. Construct InstagramAccount { username, profileUrl, timestamp }
```

### 5.3 HTML Format → Canonical

Instagram's HTML exports use unstable CSS class names that change between export versions. The parser uses a **structural heuristic** that does NOT depend on class names.

```
```
function parseHtmlExport(htmlString: string): InstagramAccount[]

1. Find all <a> tags where href contains 'instagram.com/' using regex
2. For each <a> tag match:
   a. Resolve username from href + link text:
      - Followers HTML: link text is the handle (e.g. `mioarchia`), href is `https://www.instagram.com/mioarchia`
      - Following HTML: link text is often the full URL (e.g. `https://www.instagram.com/_u/mioarchia`);
        extract username from href via `extractUsernameFromInstagramUrl()` (supports `/_u/` paths)
      - If link text looks like an Instagram URL, prefer username from href (or from text URL as fallback)
   b. Normalize profile URL to canonical `https://www.instagram.com/{username}` (same as JSON exports)
   c. Search a text window around the match (e.g. ±500 chars) for an ISO 8601 timestamp:
      - Regex: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:?\d{2}/
      - If found → parse to Unix timestamp
      - If not found → default timestamp to 0
   d. Normalize username: trim whitespace, convert to lowercase
   e. Construct InstagramAccount { username, profileUrl, timestamp }
3. Return deduplicated array (latest timestamp wins on conflict)
```

**HTML export variants:**

| File | Typical link text | Typical href | Notes |
|------|-------------------|--------------|-------|
| `followers_*.html` | `username` | `https://www.instagram.com/username` | Username in anchor text |
| `following.html` | Full profile URL | `https://www.instagram.com/_u/username` | May also have `<h2>username</h2>` above the link; parser reads username from URL path |

**Determining followers vs. following from HTML:**

The file is identified as "followers" or "following" based on:
1. **Filename:** `followers_*.html` → followers list; `following.html` → following list
2. **Page title fallback:** If the filename is ambiguous, check the `<title>` tag or the first `<h1>`/`<h2>` heading for keywords "Followers" or "Following"
3. **Ambiguous fallback:** If neither heuristic works, prompt the user to manually label the file

---

## 6. Upload Model: Replace & Snapshot

Each upload produces a **single, complete snapshot**. There is no incremental merge. Uploading a new file always **replaces** the in-progress parse and creates a fresh snapshot.

### 6.1 Upload Modes

The user selects one of three modes before uploading:

| Mode | What the user uploads | What happens |
|------|----------------------|--------------|
| **ZIP** | A single `.zip` file | The ZIP is extracted, follower/following files are auto-discovered, parsed, and combined into one snapshot |
| **JSON Files** | Two side-by-side slots: **Followers** and **Following** | Each slot accepts `.json` only. Followers slot allows multiple files (paginated `followers_1`, `followers_2`, …). Following slot accepts one `following.json`. Both lists required before save |
| **HTML Files** | Same dual-slot layout as JSON | Each slot accepts `.html` / `.htm`. Same merge/replace rules as JSON mode |

### 6.2 Replace Behavior (Non-ZIP Modes)

For JSON/HTML modes where files are uploaded individually:

| Action | Result |
|--------|--------|
| Upload `followers_1.json` in **Followers** slot | Followers slot shows green loaded state with account count. Following slot stays idle |
| Upload `following.json` in **Following** slot | Following slot loads. **UploadReadyBar** below both slots: "Ready! …" + Save Snapshot |
| Upload another `followers_2.json` in Followers slot | **Merges** with existing followers (deduped). Following data is kept |
| Upload wrong file in a slot | Slot-level error (e.g. following file in Followers slot). Other slot unaffected |
| Switch upload mode | Resets all in-memory slot state |

### 6.3 Snapshot Save Flow

```
1. Parse completes successfully → ParsedExport is in memory
2. User confirms save (or auto-save for ZIP uploads)
3. Snapshot is written to IndexedDB with current timestamp
4. If previous snapshots exist → auto-diff computed against latest
5. Redirect to dashboard ("/")
```

### 6.4 File Validation per Mode

| Selected Mode | Accepted Files | Rejected With |
|---------------|---------------|---------------|
| ZIP | `.zip` only | "Please upload a .zip file. Switch modes if you have individual JSON/HTML files." |
| JSON Files | `.json` only | "Please upload .json files. Switch to ZIP mode for .zip uploads." |
| HTML Files | `.html` only | "Please upload .html files. Switch to ZIP mode for .zip uploads." |

---

## 7. Profile URL Validation

The app performs **soft validation** on Instagram profile URLs extracted from exports. This is a **non-blocking warning** — it never prevents parsing from completing.

### 7.1 Validation Rules

| Check | Pattern | Action on Failure |
|-------|---------|-------------------|
| URL is present | `profileUrl !== null && profileUrl !== ''` | Set `profileUrl` to `https://www.instagram.com/${username}` (constructed) |
| URL matches Instagram domain | Host is `instagram.com` | Log warning: "Unexpected profile URL domain for @{username}" |
| URL resolves to username | `extractUsernameFromInstagramUrl()` matches entry username (supports `/username` and `/_u/username`) | Log warning: "Profile URL doesn't match username for @{username}" |
| URL is well-formed | Valid URL per `new URL()` constructor | Replace with constructed URL, log warning |
| Canonical output | Always | Stored `profileUrl` is `https://www.instagram.com/${username}` so HTML and JSON snapshots diff consistently |

### 7.2 Warning Behavior

- Validation warnings are **collected** during parsing and attached to `ParseMeta` as an optional `warnings: string[]` array
- Warnings are displayed in a collapsible section on the dashboard
- Warnings **never block** the parse pipeline or prevent navigation to the dashboard
- If >50 warnings exist, show the first 50 with a "and N more…" summary

---

## 8. Error Handling Matrix

| Scenario | Detection Point | Error Code | User Message | Recoverable? |
|----------|----------------|------------|-------------|-------------|
| File is not `.zip`, `.json`, or `.html` | File input `onChange` | N/A (pre-parse) | "Unsupported file type. Please upload a .zip, .json, or .html file." | Yes — retry |
| File exceeds 500MB | File input `onChange` | `FILE_TOO_LARGE` | "This file exceeds the 500MB limit." | Yes — retry with smaller file |
| ZIP cannot be opened | JSZip.loadAsync | `ZIP_EXTRACTION_FAILED` | "We couldn't open this ZIP file. It may be corrupted." | Yes — retry |
| No follower/following files found in ZIP | Post-extraction scan | `MISSING_FILES` | "Required follower/following files weren't found in this export." | Yes — retry with correct export |
| JSON syntax error | `JSON.parse()` in Worker | `INVALID_JSON` | "This file doesn't contain valid JSON." | Yes — retry |
| HTML cannot be parsed | `DOMParser` in Worker | `INVALID_HTML` | "This HTML file couldn't be parsed. It may be corrupted." | Yes — retry |
| Valid JSON, wrong structure | Format detection | `UNSUPPORTED_FORMAT` | "We couldn't recognize this Instagram export format." | Yes — retry |
| Valid HTML, no Instagram links | HTML validation | `UNSUPPORTED_FORMAT` | "This HTML file doesn't appear to be an Instagram export." | Yes — retry |
| Parse succeeds but 0 followers AND 0 following | Post-normalization check | `EMPTY_DATA` | "No follower or following data was found." (warning, not blocking) | Yes — shown as warning |
| ZIP contains both JSON and HTML files | Post-extraction scan | `MIXED_FORMATS` | "This ZIP contains both JSON and HTML files. Please re-download your data in a single format." | Yes — retry |
| Web Worker crashes | Worker `onerror` handler | `UNKNOWN` | "Something went wrong during parsing. Please try again." | Yes — retry |
| DOMParser unavailable in Worker | Worker feature detection | N/A | Falls back to main thread HTML parsing silently | Auto-handled |
| IndexedDB write fails | `dexie.snapshots.add()` catch | N/A (post-parse) | "We couldn't save your data. Your browser storage may be full." | Yes — clear old data |

---

## 9. File Size & Performance Constraints

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Max upload size | 500MB (uncompressed) | Prevents browser memory exhaustion |
| Max individual JSON/HTML size | 100MB | Single files larger than this are uncommon and may cause Worker OOM |
| Max entries per list | 1,000,000 | Sanity limit to prevent rendering issues; warn user if exceeded |
| Max paginated files | 100 | Support `followers_1` through `followers_100` (JSON or HTML) |
| Parse timeout | 30 seconds | If Worker hasn't responded in 30s, assume failure and show error |
| ZIP bomb detection | Max 1000 files in archive | Reject archives with suspiciously many files |

---

## 10. UI Component Breakdown

### 10.1 Privacy Notice Banner

- Displayed **above** the upload zone on first visit (or until dismissed)
- Content: "🔒 Your data never leaves your device. All processing happens right here in your browser."
- Dismissible with "Got it" button
- Dismissal state stored in `localStorage` (key: `privacy-notice-dismissed`)

### 10.2 Upload Drop Zone

**ZIP mode** — single full-width `DropZone` (`min-h` 220px):

```
┌─────────────────────────────────────────────────────────┐
│   Upload Mode: [ZIP] [JSON Files] [HTML Files]          │
│                    ┌──────────┐                         │
│                    │  Upload  │                         │
│                    └──────────┘                         │
│         Drag & drop your Instagram export here          │
│         Supports: .zip files · Max size: 500MB          │
└─────────────────────────────────────────────────────────┘
```

**JSON / HTML modes** — dual `FileSlotDropZone` grid (`min-h` 180px per slot, `max-w-2xl` panel):

```
┌─────────────────────────────────────────────────────────┐
│   Upload both files from followers_and_following/       │
├─────────────────────────┬───────────────────────────────┤
│  Followers              │  Following                    │
│  e.g. followers_1.json │  e.g. following.json          │
│  [drop zone]            │  [drop zone]                  │
└─────────────────────────┴───────────────────────────────┘
│  UploadReadyBar: Ready! … [Save Snapshot]  (when both OK) │
└─────────────────────────────────────────────────────────┘
```

Responsive: `grid-cols-1` on mobile, `sm:grid-cols-2` side by side.

**Touch-device copy swap:** When `isTouchDevice` is true (detected via `matchMedia('(hover: none) and (pointer: coarse)')`), idle-state instructional text changes:

| Zone | Desktop idle copy | Touch idle copy |
|------|-------------------|-----------------|
| ZIP `DropZone` | "Drag & drop your Instagram export here" / "or click to browse files" | "Tap to select your Instagram export" |
| `FileSlotDropZone` | "Drop file here" / "or click to browse" | "Tap to select file" |

Drag-over visual states remain for hybrid/desktop devices; they are not shown on pure touch because OS-level drag-and-drop is unavailable.

**ZIP drop zone states (`DropZoneState`):**
| State | Visual |
|-------|--------|
| `idle` | Dashed border, muted text, upload icon |
| `drag-over` | Highlighted border (primary color), "Drop to upload" |
| `parsing` | Progress bar + stage label + Cancel |
| `ready` | Green border, checkmark, counts + Save Snapshot |
| `error` | Red border, error message, click to retry |

**Per-slot states (`SlotVisualState`) for JSON/HTML:**
| State | Visual |
|-------|--------|
| `idle` | Dashed border, "Drop file here" |
| `drag-over` | Primary border highlight |
| `parsing` | Spinner + progress (active slot only) |
| `loaded` | Green border, account count + filename hint |
| `error` | Red border, slot-level message (mis-slot, validation, parse) |

### 10.3 Progress Indicator

- **Type:** Linear progress bar (Shadcn `Progress` component)
- **Labels:** Shows current stage name + percentage
- **Animation:** Smooth transition between percentage values
- **Cancel button:** Appears next to progress bar during parsing

### 10.4 Help Section (Collapsible)

- **Title:** "How to get your Instagram data export"
- **Content:** Step-by-step guide:
  1. Open Instagram → Settings → Accounts Center
  2. Your Information and Permissions → Download Your Information
  3. Select "Some of your information"
  4. Check "Followers and Following"
  5. Choose **JSON or HTML** format (both are supported)
  6. **ZIP mode:** Download and upload the `.zip` file here. **JSON/HTML modes:** Unzip, open `followers_and_following`, and upload both files in the two upload areas.

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Parse current-format followers (JSON) | Valid `followers_1.json` (current) | `ParsedExport` with correct `followers` array |
| Parse current-format following (JSON) | Valid `following.json` (current) | `ParsedExport` with correct `following` array |
| Parse legacy-format (JSON) | Valid legacy JSON | `ParsedExport` with `formatVersion: 'legacy-json'` |
| Parse HTML followers | Valid `followers_1.html` | `ParsedExport` with correct `followers` array, `formatVersion: 'html'` |
| Parse HTML following | Valid `following.html` | `ParsedExport` with correct `following` array |
| Detect current JSON format | Object with `string_list_data` | `'current-json'` |
| Detect legacy JSON format | Object with `value` only | `'legacy-json'` |
| Detect HTML format | File with `.html` extension | `'html'` content type |
| Detect unknown format | Random JSON | `'unknown'` |
| Handle malformed JSON | `"{broken"` | `ParseError` with code `INVALID_JSON` |
| Handle malformed HTML | Non-HTML text with `.html` extension | `ParseError` with code `INVALID_HTML` |
| HTML with no Instagram links | Random HTML page | `ParseError` with code `UNSUPPORTED_FORMAT` |
| Normalize username | `" UsErNaMe "` | `"username"` |
| Deduplicate entries | Array with two "alice" entries | Single "alice" with latest timestamp |
| Merge paginated JSON files | `followers_1.json` + `followers_2.json` | Single merged `followers` array |
| Merge paginated HTML files | `followers_1.html` + `followers_2.html` | Single merged `followers` array |
| Replace behavior | Upload followers, then upload different followers | Previous followers data fully replaced |
| Profile URL soft validation | URL with wrong domain | Warning logged, parsing continues |
| HTML timestamp extraction | HTML with ISO 8601 timestamps | Correct Unix timestamps in output |

### 11.2 Integration Tests

| Test | Description |
|------|-------------|
| Full ZIP flow (JSON) | Upload a real Instagram `.zip` with JSON files → verify snapshot saved to IndexedDB |
| Full ZIP flow (HTML) | Upload a real Instagram `.zip` with HTML files → verify snapshot saved to IndexedDB |
| Multi-JSON flow | Upload `followers_1.json` + `following.json` → verify both are parsed into one snapshot |
| Multi-HTML flow | Upload `followers_1.html` + `following.html` → verify both are parsed into one snapshot |
| Replace behavior | Upload `followers_1.json` → upload different `followers_1.json` → verify followers data is replaced |
| Snapshot save flow | Complete upload → save snapshot → verify it appears in IndexedDB |
| Auto-diff on upload | Upload second snapshot → verify diff is auto-computed against first |
| Error recovery | Upload invalid file → see error → upload valid file → success |
| Cancel mid-parse | Start parsing → click cancel → verify UI resets cleanly |
| Mode validation | Select ZIP mode → try to upload `.json` → verify rejection with helpful message |

### 11.3 Test Fixtures

Create mock data files in `__tests__/fixtures/`:

```
__tests__/
└── fixtures/
    ├── current-json-format/
    │   ├── followers_1.json      # 10 accounts, current format
    │   ├── followers_2.json      # 5 accounts (pagination test)
    │   └── following.json        # 8 accounts, current format
    ├── legacy-json-format/
    │   ├── followers.json        # 10 accounts, legacy format
    │   └── following.json        # 8 accounts, legacy format
    ├── html-format/
    │   ├── followers_1.html      # 10 accounts, HTML format
    │   ├── followers_2.html      # 5 accounts (pagination test)
    │   └── following.html        # 8 accounts, HTML format
    ├── malformed/
    │   ├── broken-json.json      # Syntax error
    │   ├── broken-html.html      # Non-HTML text with .html extension
    │   ├── wrong-schema.json     # Valid JSON, not Instagram
    │   ├── wrong-html.html       # Valid HTML, not Instagram (no IG links)
    │   └── empty-data.json       # Valid Instagram format, zero entries
    ├── sample-export-json.zip    # Complete mock ZIP with JSON files
    └── sample-export-html.zip    # Complete mock ZIP with HTML files
```

---

## 12. Implementation Checklist

> **Note:** Parser implementation lives under `src/services/parser/` (per `docs/ARCHITECTURE.md`), not `src/lib/parser/`.

- [x] Create `src/types/instagram.ts` with canonical types
- [x] Create `src/types/parser.ts` with Worker message types (incl. `PARSE_HTML`)
- [x] Implement `src/services/parser/schemas.ts` (Zod validation schemas)
- [x] Implement `src/services/parser/instagram-parser.ts` (JSON format detection + normalization)
- [x] Implement `src/services/parser/html-parser.ts` (HTML parsing via DOMParser + heuristic extraction)
- [x] Implement `src/services/parser/zip-handler.ts` (JSZip extraction + file discovery for .json AND .html)
- [x] Implement `src/services/parser/worker.ts` (Web Worker entry point, routing JSON vs HTML)
- [x] Create `src/hooks/use-parser-worker.ts` (Worker lifecycle + message handling)
- [x] Create `src/hooks/use-file-upload.ts` (drag-and-drop + file input state + mode selector + replace logic)
- [x] Build `src/components/file-upload/DropZone.tsx` (ZIP-only)
- [x] Build `src/components/file-upload/FileSlotDropZone.tsx` (JSON/HTML per-slot)
- [x] Build `src/components/file-upload/UploadReadyBar.tsx` (dual-mode save CTA)
- [ ] Build `src/components/file-upload/ProgressBar.tsx` (standalone optional; progress inline in drop zones per AC-21)
- [x] Build `src/components/layout/PrivacyBanner.tsx`
- [x] Build `src/components/file-upload/HelpSection.tsx`
- [x] Integrate on `src/app/page.tsx` (landing page)
- [ ] Create test fixtures in `__tests__/fixtures/` (JSON + HTML + malformed)
- [ ] Write unit tests for JSON parser module
- [ ] Write unit tests for HTML parser module
- [ ] Write integration tests for full upload flow (JSON, HTML, mixed)
- [ ] Manual QA: test with real Instagram JSON export
- [ ] Manual QA: test with real Instagram HTML export

---

## 13. Resolved Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Should we support HTML format exports? | **✅ Yes.** Full HTML parsing support via DOMParser with structural heuristics. | User has exports in both JSON and HTML formats. HTML parsing is feasible client-side with DOMParser. |
| 2 | Should multiple file uploads merge or replace? | **✅ Replace.** Each upload replaces the previous data for that category. No incremental merge. See §6. | Simpler mental model. Users upload complete backups as snapshots. The timeline handles comparison between different points in time. |
| 3 | Should we validate the Instagram profile URL format? | **✅ Soft warning.** Non-blocking validation with warnings collected in `ParseMeta.warnings`. See §7 for rules. | Invalid URLs shouldn't block analysis, but users should be informed of data quality issues. |
| 4 | What happens if followers span 10+ paginated files? | **✅ Support up to 100 paginated files** (`followers_1` through `followers_100`, JSON or HTML). | 100 files covers even the largest accounts. |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-22 | v0.3 | Touch-device upload copy swap in §10.2 and AC-6b (Phase 6) |
| 2026-05-22 | v0.2 | Dual-slot JSON/HTML upload, HTML parsing |

