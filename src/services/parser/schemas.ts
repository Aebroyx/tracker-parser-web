/**
 * Zod validation schemas for Instagram JSON export formats.
 * Schemas are intentionally LENIENT — Instagram changes their export format
 * frequently, so we accept optional fields and fall back gracefully.
 * See: docs/features/01_file_processing.md §4, §5
 */

import { z } from 'zod';

// ─── Current Format (2024+) ─────────────────────────────────────────────────

/** A single entry in string_list_data — value is optional (following files omit it) */
const stringListDataItemSchema = z.object({
  href: z.string().optional().default(''),
  value: z.string().optional().default(''),
  timestamp: z.number().optional().default(0),
});

/**
 * A single follower/following entry in current format.
 * The username can be in EITHER:
 *   - string_list_data[0].value (followers files)
 *   - title (following files)
 * Both are accepted; parser logic resolves which to use.
 */
const currentFormatEntrySchema = z.object({
  title: z.string().optional().default(''),
  media_list_data: z.array(z.unknown()).optional().default([]),
  string_list_data: z.array(stringListDataItemSchema).optional().default([]),
});

/** followers_1.json (current format) — top-level array */
export const currentFollowersSchema = z.array(currentFormatEntrySchema);

/** following.json (current format) — object with relationships_following key */
export const currentFollowingSchema = z.object({
  relationships_following: z.array(currentFormatEntrySchema),
});

// ─── Legacy Format (Pre-2024) ────────────────────────────────────────────────

/** A single legacy follower/following entry */
const legacyEntrySchema = z.object({
  value: z.string(),
  timestamp: z.number().optional().default(0),
});

/** Legacy followers — object with relationships_followers key */
export const legacyFollowersSchema = z.object({
  relationships_followers: z.array(legacyEntrySchema),
});

/** Legacy following — object with relationships_following key */
export const legacyFollowingSchema = z.object({
  relationships_following: z.array(legacyEntrySchema),
});

// ─── Schema Types ────────────────────────────────────────────────────────────

export type CurrentFormatEntry = z.infer<typeof currentFormatEntrySchema>;
export type LegacyEntry = z.infer<typeof legacyEntrySchema>;
