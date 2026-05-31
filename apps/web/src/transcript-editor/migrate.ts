import type { SceneTracks } from "@/timeline";
import { isWordPresentInTimeline } from "./coverage";
import type { TranscriptDocument } from "./types";

export interface StoredTranscript {
	version: number;
	document: TranscriptDocument;
}

const CURRENT_VERSION = 2;

/**
 * Normalize a persisted transcript to the current (v2) document shape.
 *
 * v1 (pre-Descript) had no stored `deleted`/`deletedRanges`: the timeline was
 * already destructively cut (gaps left open) and deletion was DERIVED from
 * coverage at render time. Migrate it ONCE here by deriving each word's
 * `deleted` flag from the current timeline coverage, and start an empty
 * `deletedRanges` log. Pre-v2 cuts therefore show struck-through but are NOT
 * restorable (the media was already physically removed and we kept no
 * reconstruction info) — the UI must disable restore for words not covered by
 * any DeletedRange.
 *
 * The migration never mutates the timeline (Phase 1 already left the gaps; do
 * not double-cut). v2+ documents are returned as-is (with a defensive default
 * for `deletedRanges`).
 */
export function migrateTranscript({
	stored,
	tracks,
}: {
	stored: StoredTranscript;
	tracks: SceneTracks | null;
}): TranscriptDocument {
	const doc = stored.document;

	if (stored.version >= CURRENT_VERSION) {
		return {
			segments: doc.segments,
			deletedRanges: doc.deletedRanges ?? [],
		};
	}

	return {
		segments: doc.segments.map((segment) => ({
			...segment,
			words: segment.words.map((word) => ({
				...word,
				deleted: tracks ? !isWordPresentInTimeline({ word, tracks }) : false,
			})),
		})),
		deletedRanges: [],
	};
}

export function isCurrentTranscriptVersion(version: number): boolean {
	return version >= CURRENT_VERSION;
}
