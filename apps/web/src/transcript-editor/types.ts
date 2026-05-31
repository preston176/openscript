import type { TimelineElement } from "@/timeline";
import type { TranscriptionSegment } from "@/transcription/types";
import type { MediaTime } from "@/wasm";

export interface TranscriptWord {
	id: string;
	text: string;
	/**
	 * Source-time bounds in seconds, FROZEN at generation. These are the mapping
	 * anchor and are never mutated by edits — the current timeline position of a
	 * word is derived from these minus the durations of earlier deleted ranges
	 * (see mapping.ts), so they stay correct across ripple deletes and reload.
	 */
	start: number;
	end: number;
	/** Stored deletion intent (tombstone). Absent/false means present. */
	deleted?: boolean;
}

export interface TranscriptSegment {
	id: string;
	words: TranscriptWord[];
	start: number;
	end: number;
}

/**
 * A timeline element that was removed by a transcript deletion, captured with
 * enough information to reconstruct it losslessly on restore. The element is
 * stored whole (minus its id) so every renderer-relevant field — trim, retime,
 * params, animations, masks, effects — round-trips.
 */
export interface RemovedPiece {
	trackId: string;
	trackType: "main" | "audio" | "overlay";
	/** element.startTime − gapStartTimeline at delete time, so pieces re-land contiguously on restore. */
	offsetTicks: MediaTime;
	element: Omit<TimelineElement, "id">;
}

/**
 * One contiguous transcript cut. The unit of deletion and (whole-cut) restore.
 */
export interface DeletedRange {
	id: string;
	/** Tombstoned word ids covered by this cut. */
	wordIds: string[];
	/** Source-time span of the cut (merge/restore key). */
	sourceStartSeconds: number;
	sourceEndSeconds: number;
	/**
	 * Exact integer gap width = sum of the removed elements' visible durations.
	 * Reused verbatim on ripple-open (never recomputed from seconds) to avoid
	 * tick drift.
	 */
	durationTicks: MediaTime;
	/** Reconstruction descriptors, one per removed element. Empty for pre-v2 cuts (not restorable). */
	removed: RemovedPiece[];
}

export interface TranscriptDocument {
	segments: TranscriptSegment[];
	deletedRanges: DeletedRange[];
}

export function buildTranscriptDocument({
	segments,
}: {
	segments: TranscriptionSegment[];
}): TranscriptDocument {
	const result: TranscriptSegment[] = [];
	for (let s = 0; s < segments.length; s++) {
		const segment = segments[s];
		if (!segment.words || segment.words.length === 0) continue;
		const words: TranscriptWord[] = segment.words.map((word, w) => ({
			id: `s${s}-w${w}`,
			text: word.text,
			start: word.start,
			end: word.end,
		}));
		result.push({
			id: `s${s}`,
			words,
			start: segment.start,
			end: segment.end,
		});
	}
	return { segments: result, deletedRanges: [] };
}
