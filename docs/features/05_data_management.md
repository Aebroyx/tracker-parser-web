# Feature Spec: Data Export & Clear Controls (Phase 5)

> **Document Status:** Skeleton — Pending Elaboration  
> **Last Updated:** 2026-05-13  
> **Feature Phase:** 5  
> **Parent Docs:** `docs/SYSTEM_SPEC.md`, `docs/ARCHITECTURE.md`  
> **Depends On:** Phase 1, Phase 2, Phase 3

---

## 1. Feature Summary

Provide users with controls to export their analyzed data (non-followers list, diff results, etc.) as downloadable files, and to manage/clear all stored data from IndexedDB. This ensures users maintain full data autonomy as per the privacy-first protocol.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-5.1 | User | Export my non-followers list as CSV | I can use it outside this app |
| US-5.2 | User | Export a diff result (gained/lost followers) as CSV | I can share or archive changes |
| US-5.3 | User | Clear all stored data with one click | I can remove everything from my browser |
| US-5.4 | User | Delete a specific snapshot | I can remove just one outdated backup |
| US-5.5 | User | See how much storage my data uses | I understand the browser impact |

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-E1 | "Export as CSV" button generates a downloadable file | Click → browser downloads CSV with correct data |
| AC-E2 | CSV includes username, profile URL, timestamp columns | Open CSV → columns match expected schema |
| AC-E3 | "Clear All Data" requires confirmation | Click → confirmation dialog → "Are you sure?" |
| AC-E4 | Clearing data removes all IndexedDB entries | After clear → dashboard shows first-time upload state |
| AC-E5 | Individual snapshot deletion is available | Click delete on a snapshot → only that one is removed |
| AC-E6 | Storage usage is displayed accurately | Shows approximate MB used |

---

## 4. Export Formats

### 4.1 CSV Export Schema

```csv
username,profile_url,followed_since
alice,https://www.instagram.com/alice,2025-12-01T10:00:00Z
bob,https://www.instagram.com/bob,2025-11-15T08:30:00Z
```

### 4.2 Exportable Lists

| List | Description |
|------|-------------|
| Non-Followers | Accounts you follow that don't follow you back |
| Fans | Accounts that follow you but you don't follow back |
| Mutuals | Accounts in both followers and following |
| Gained Followers | New followers between two snapshots |
| Lost Followers | Unfollowers between two snapshots |
| All Followers | Complete followers list from a snapshot |
| All Following | Complete following list from a snapshot |

---

## 5. Implementation Checklist

- [ ] Implement CSV generation utility (`src/lib/utils/csv-export.ts`)
- [ ] Build export button component with list selector
- [ ] Build "Clear All Data" button with confirmation dialog
- [ ] Build individual snapshot delete functionality (coordinate with Phase 2)
- [ ] Build storage usage display component
- [ ] Write unit tests for CSV generation
- [ ] Write integration tests for export + clear flows
