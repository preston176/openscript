import type { SceneTracks } from "@/timeline";
import { generateUUID } from "@/utils/id";
import { deleteRangeFromTracks } from "./delete-transform";
import { sourceToTimeline } from "./mapping";
import { restoreRangeToTracks } from "./restore-transform";
import type { DeletedRange, TranscriptDocument } from "./types";

/** A contiguous run of selected words to delete as one cut. */
export interface DeletionRun {
	wordIds: string[];
	startSeconds: number;
	endSeconds: number;
}

export interface TranscriptEditPlan {
	afterTracks: SceneTracks;
	afterDoc: TranscriptDocument;
}

/**
 * Compute the timeline + document after deleting `runs`. Pure (the only impurity
 * is a fresh DeletedRange id). Each run becomes one DeletedRange; its words are
 * marked deleted. Runs are processed latest-source-first so each run's timeline
 * position — derived from the pre-existing cuts only — is unaffected by the
 * other runs in the same batch (which are all earlier and shift it left only
 * after it has already been cut).
 */
export function planTranscriptDelete({
	tracks,
	doc,
	runs,
}: {
	tracks: SceneTracks;
	doc: TranscriptDocument;
	runs: DeletionRun[];
}): TranscriptEditPlan {
	const existing = doc.deletedRanges;
	const ordered = [...runs].sort((a, b) => b.startSeconds - a.startSeconds);
	let afterTracks = tracks;
	const newRanges: DeletedRange[] = [];
	const deletedWordIds = new Set<string>();

	for (const run of ordered) {
		const start = sourceToTimeline({
			sourceSeconds: run.startSeconds,
			deletedRanges: existing,
		});
		const end = sourceToTimeline({
			sourceSeconds: run.endSeconds,
			deletedRanges: existing,
		});
		if (end <= start) continue;
		const result = deleteRangeFromTracks({ tracks: afterTracks, start, end });
		afterTracks = result.afterTracks;
		newRanges.push({
			id: generateUUID(),
			wordIds: run.wordIds,
			sourceStartSeconds: run.startSeconds,
			sourceEndSeconds: run.endSeconds,
			durationTicks: result.durationTicks,
			removed: result.removed,
		});
		for (const id of run.wordIds) deletedWordIds.add(id);
	}

	const afterDoc: TranscriptDocument = {
		segments: doc.segments.map((segment) => ({
			...segment,
			words: segment.words.map((word) =>
				deletedWordIds.has(word.id) ? { ...word, deleted: true } : word,
			),
		})),
		deletedRanges: [...existing, ...newRanges],
	};

	return { afterTracks, afterDoc };
}

/**
 * Compute the timeline + document after restoring (un-deleting) one whole cut.
 * Re-opens the gap at its current position and reconstructs the removed media,
 * un-marks the cut's words, and drops the DeletedRange.
 */
export function planTranscriptRestore({
	tracks,
	doc,
	rangeId,
}: {
	tracks: SceneTracks;
	doc: TranscriptDocument;
	rangeId: string;
}): TranscriptEditPlan {
	const range = doc.deletedRanges.find((r) => r.id === rangeId);
	if (!range) return { afterTracks: tracks, afterDoc: doc };

	const others = doc.deletedRanges.filter((r) => r.id !== rangeId);
	const gapStartTicks = sourceToTimeline({
		sourceSeconds: range.sourceStartSeconds,
		deletedRanges: others,
	});
	const afterTracks = restoreRangeToTracks({
		tracks,
		gapStartTicks,
		durationTicks: range.durationTicks,
		removed: range.removed,
	});

	const restored = new Set(range.wordIds);
	const afterDoc: TranscriptDocument = {
		segments: doc.segments.map((segment) => ({
			...segment,
			words: segment.words.map((word) =>
				restored.has(word.id) ? { ...word, deleted: false } : word,
			),
		})),
		deletedRanges: others,
	};

	return { afterTracks, afterDoc };
}
