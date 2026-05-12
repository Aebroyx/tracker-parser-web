# Feature Spec: File Processing (Phase 1)

> **Document Status:** Draft v0.1  
> **Last Updated:** 2026-05-12  
> **Feature Phase:** 1  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`

---

## 1. Feature Summary

Enable users to upload Instagram data exports in `.zip`, `.json`, or `.html` format, parse them in a Web Worker, validate the data structure, normalize it into the canonical `ParsedExport` model, and surface any errors with clear, actionable messages.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-1.1 | User | Drag and drop my Instagram `.zip` export onto the page | I can quickly start analyzing my data |
| US-1.2 | User | Click a button to browse and select a file | I have an alternative to drag-and-drop |
| US-1.3 | User | Upload individual `.json` files (followers + following) | I can use the tool even if I extracted the zip myself |
| US-1.4 | User | Upload individual `.html` files (followers + following) | I can use the tool even if I exported in HTML format |
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
| AC-6 | Multiple `.json` or `.html` files can be uploaded at once | User selects both `followers_1.json` and `following.json` (or `.html` equivalents) → both are processed together |
| AC-6b | Mixed `.json` and `.html` files can be uploaded together | User selects `followers_1.html` and `following.json` → both are parsed and merged |
| AC-7 | Clicking the upload zone opens the system file picker | `<input type="file">` is triggered programmatically |

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
| AC-25 | Successful parsing navigates the user to `/results` | After `SUCCESS` message, `router.push('/results')` is called |

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
function validateHtmlExport(doc: Document): boolean

1. Parse HTML string with DOMParser → Document
2. Find all <a> tags with href containing 'instagram.com/'
3. If count > 0 → return true (valid Instagram HTML export)
4. return false (not an Instagram export)
```

---

## 5. Normalization Rules

### 5.1 Current JSON Format → Canonical

```
For each entry in the array (followers) or relationships_following array (following):
  1. Extract `string_list_data[0].value` → username
  2. Extract `string_list_data[0].href` → profileUrl
  3. Extract `string_list_data[0].timestamp` → timestamp
  4. If `string_list_data` is empty or missing → skip entry, log warning
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
function parseHtmlExport(htmlString: string): InstagramAccount[]

1. Parse HTML with `new DOMParser().parseFromString(htmlString, 'text/html')`
2. Find all <a> tags where href contains 'instagram.com/'
3. For each <a> tag:
   a. Extract username from text content of the <a> tag → username
   b. Extract href attribute → profileUrl
   c. Walk up to the nearest common ancestor container (parent or grandparent)
   d. Search sibling/child text nodes for an ISO 8601 timestamp pattern:
      - Regex: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:?\d{2}/
      - If found → parse to Unix timestamp
      - If not found → default timestamp to 0
   e. Normalize username: trim whitespace, convert to lowercase
   f. Construct InstagramAccount { username, profileUrl, timestamp }
4. Return deduplicated array (latest timestamp wins on conflict)
```

**Determining followers vs. following from HTML:**

The file is identified as "followers" or "following" based on:
1. **Filename:** `followers_*.html` → followers list; `following.html` → following list
2. **Page title fallback:** If the filename is ambiguous, check the `<title>` tag or the first `<h1>`/`<h2>` heading for keywords "Followers" or "Following"
3. **Ambiguous fallback:** If neither heuristic works, prompt the user to manually label the file

---

## 6. Multi-File Upload Merge Behavior

When a user uploads multiple files (whether via drag-and-drop, file picker, or a ZIP containing both), the app **merges** them into a single `ParsedExport` rather than replacing previous uploads.

### 6.1 Merge Rules

| Scenario | Behavior |
|----------|----------|
| Upload `followers_1.json` then `following.json` | Both are merged into one `ParsedExport` with populated `followers` and `following` arrays |
| Upload `followers_1.json` then `followers_2.json` | The two follower files are concatenated and deduplicated (latest timestamp wins) |
| Upload `followers_1.html` then `following.json` | Mixed formats are accepted — each file is parsed with its appropriate parser, then merged |
| Upload a `.zip` containing everything | All recognized files are parsed and merged automatically |
| Upload `followers_1.json`, then later upload another `followers_1.json` | **The new file replaces** the previous data for that specific file. Other files in the merge are kept |

### 6.2 Merge UX Flow

```
1. User uploads File A (e.g., followers_1.json)
   → ParsedExport: { followers: [...], following: [] }
   → UI shows: "Parsed 150 followers. No following data yet."
   → Button appears: "Add more files" (or "Continue to results")

2. User uploads File B (e.g., following.json)
   → ParsedExport: { followers: [...], following: [...] }
   → UI shows: "Parsed 150 followers, 200 following. Ready to analyze!"
   → Auto-navigates to /results (or user clicks "View Results")
```

### 6.3 Merge State Reset

- A **"Start Over"** button is always visible during the merge flow
- Clicking it clears the in-memory `ParsedExport` and resets to the empty upload state
- Navigating away from the upload page does NOT clear the merge state (preserved in context)

---

## 7. Profile URL Validation

The app performs **soft validation** on Instagram profile URLs extracted from exports. This is a **non-blocking warning** — it never prevents parsing from completing.

### 7.1 Validation Rules

| Check | Pattern | Action on Failure |
|-------|---------|-------------------|
| URL is present | `profileUrl !== null && profileUrl !== ''` | Set `profileUrl` to `https://www.instagram.com/${username}` (constructed) |
| URL matches Instagram domain | `profileUrl` starts with `https://www.instagram.com/` | Log warning: "Unexpected profile URL domain for @{username}" |
| URL contains the username | URL path includes the `username` value | Log warning: "Profile URL doesn't match username for @{username}" |
| URL is well-formed | Valid URL per `new URL()` constructor | Replace with constructed URL, log warning |

### 7.2 Warning Behavior

- Validation warnings are **collected** during parsing and attached to `ParseMeta` as an optional `warnings: string[]` array
- Warnings are displayed in a collapsible section on the results page
- Warnings **never block** the parse pipeline or prevent navigation to `/results`
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

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ┌──────────┐                         │
│                    │  Upload  │                         │
│                    │   Icon   │                         │
│                    └──────────┘                         │
│                                                         │
│         Drag & drop your Instagram export here          │
│              or click to browse files                   │
│                                                         │
│         Supports: .zip, .json, or .html files           │
│         Max size: 500MB                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**States:**
| State | Visual |
|-------|--------|
| `idle` | Dashed border, muted text, upload icon |
| `drag-over` | Highlighted border (primary color), pulsing icon, "Drop to upload" text |
| `uploading` | Solid border, spinner replacing icon, "Reading file…" text |
| `parsing` | Progress bar appears below zone, stage label shown |
| `partial` | Green border, checkmark icon, "Parsed X followers. Add more files or view results." with "Add More" and "View Results" buttons |
| `error` | Red border, error icon, error message with "Try Again" button |

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
  6. Download and upload the `.zip` file here

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
| Mixed format merge | `followers_1.html` + `following.json` | Merged `ParsedExport` with both lists |
| Profile URL soft validation | URL with wrong domain | Warning logged, parsing continues |
| HTML timestamp extraction | HTML with ISO 8601 timestamps | Correct Unix timestamps in output |

### 11.2 Integration Tests

| Test | Description |
|------|-------------|
| Full ZIP flow (JSON) | Upload a real Instagram `.zip` with JSON files → verify parsed output matches expected data |
| Full ZIP flow (HTML) | Upload a real Instagram `.zip` with HTML files → verify parsed output matches expected data |
| Multi-JSON flow | Upload separate `followers_1.json` + `following.json` → verify both are parsed and merged |
| Multi-HTML flow | Upload separate `followers_1.html` + `following.html` → verify both are parsed and merged |
| Mixed format flow | Upload `followers_1.html` + `following.json` → verify both are parsed and merged correctly |
| Merge UX flow | Upload followers only → see partial state → upload following → see complete state → navigate to results |
| Error recovery | Upload invalid file → see error → upload valid file → success |
| Cancel mid-parse | Start parsing → click cancel → verify UI resets cleanly |
| Start Over flow | Upload files → click "Start Over" → verify state is fully cleared |

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

- [ ] Create `src/types/instagram.ts` with canonical types
- [ ] Create `src/types/parser.ts` with Worker message types (incl. `PARSE_HTML`)
- [ ] Implement `src/lib/parser/schemas.ts` (Zod validation schemas)
- [ ] Implement `src/lib/parser/instagram-parser.ts` (JSON format detection + normalization)
- [ ] Implement `src/lib/parser/html-parser.ts` (HTML parsing via DOMParser + heuristic extraction)
- [ ] Implement `src/lib/parser/zip-handler.ts` (JSZip extraction + file discovery for .json AND .html)
- [ ] Implement `src/lib/parser/worker.ts` (Web Worker entry point, routing JSON vs HTML)
- [ ] Create `src/hooks/use-parser-worker.ts` (Worker lifecycle + message handling)
- [ ] Create `src/hooks/use-file-upload.ts` (drag-and-drop + file input state + merge logic)
- [ ] Build `src/components/file-upload/DropZone.tsx`
- [ ] Build `src/components/file-upload/ProgressBar.tsx`
- [ ] Build `src/components/layout/PrivacyBanner.tsx`
- [ ] Build `src/components/file-upload/HelpSection.tsx`
- [ ] Integrate on `src/app/page.tsx` (landing page)
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
| 2 | Should multiple file uploads merge or replace? | **✅ Merge.** Files are merged into a single `ParsedExport`. See §6 for detailed merge rules. | Users often need to upload followers and following as separate files. Merging is the natural UX. |
| 3 | Should we validate the Instagram profile URL format? | **✅ Soft warning.** Non-blocking validation with warnings collected in `ParseMeta.warnings`. See §7 for rules. | Invalid URLs shouldn't block analysis, but users should be informed of data quality issues. |
| 4 | What happens if followers span 10+ paginated files? | **✅ Support up to 100 paginated files** (`followers_1` through `followers_100`, JSON or HTML). | 100 files covers even the largest accounts. Beyond that, Instagram would likely change their export format. |

