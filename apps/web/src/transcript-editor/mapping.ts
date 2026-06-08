import {
	mediaTime,
	mediaTimeFromSeconds,
	mediaTimeToSeconds,
	type MediaTime,
} from "@/wasm";
import type { DeletedRange, TranscriptDocument } from "./types";

/**
 * Source-time <-> current-timeline-time mapping for transcript words.
 *
 * Word `start`/`end` are frozen at generation (timeline coordinates at the
 * moment of transcription). Each transcript cut ripple-closes the timeline,
 * removing `durationTicks` at its position. So a word's CURRENT timeline
 * position is its frozen source time minus the removed durations of all cuts
 * that lie before it. All arithmetic is done in integer ticks; seconds are only
 * crossed at the boundary, so repeated edits never accumulate rounding error.
 *
 * NOTE: this assumes edits happen through the transcript. A direct timeline edit
 * (dragging/splitting a clip outside the transcript) is not reflected here and
 * will drift the mapping — a documented limitation for this phase.
 */

function sortedBySource(deletedRanges: DeletedRange[]): DeletedRange[] {
	return [...deletedRanges].sort(
		(a, b) => a.sourceStartSeconds - b.sourceStartSeconds,
	);
}

/**
 * Map a frozen source time (seconds) to its current timeline position (ticks).
 * A time that falls INSIDE a deleted range is clamped to that gap's left edge
 * (where the surviving content now begins).
 */
export function sourceToTimeline({
	sourceSeconds,
	deletedRanges,
}: {
	sourceSeconds: number;
	deletedRanges: DeletedRange[];
}): MediaTime {
	let shiftTicks = 0;
	let anchorSeconds = sourceSeconds;
	for (const range of sortedBySource(deletedRanges)) {
		if (range.sourceEndSeconds <= sourceSeconds) {
			// Entirely before: its full removed duration shifts us left.
			shiftTicks += range.durationTicks;
		} else if (range.sourceStartSeconds <= sourceSeconds) {
			// Inside this cut: clamp to the gap's left edge.
			anchorSeconds = range.sourceStartSeconds;
			break;
		} else {
			// Sorted by source start, so nothing further is relevant.
			break;
		}
	}
	const raw = mediaTimeFromSeconds({ seconds: anchorSeconds }) - shiftTicks;
	return mediaTime({ ticks: Math.max(0, raw) });
}

/**
 * Inverse: map a current timeline position (ticks) back to source seconds, by
 * adding back the removed duration of every cut at or before that position.
 */
export function timelineToSource({
	timelineTicks,
	deletedRanges,
}: {
	timelineTicks: MediaTime;
	deletedRanges: DeletedRange[];
}): number {
	let cumulativeShift = 0;
	let addBack = 0;
	for (const range of sortedBySource(deletedRanges)) {
		const gapStartTimeline =
			mediaTimeFromSeconds({ seconds: range.sourceStartSeconds }) -
			cumulativeShift;
		if (gapStartTimeline <= timelineTicks) {
			addBack += range.durationTicks;
		}
		cumulativeShift += range.durationTicks;
	}
	return mediaTimeToSeconds({ time: mediaTime({ ticks: timelineTicks + addBack }) });
}

export interface WordTimelineBounds {
	tStartTicks: MediaTime;
	tEndTicks: MediaTime;
}

/**
 * Current timeline bounds for every word, keyed by word id. Memoize by document
 * identity in the UI. Deleted words map to their (collapsed) gap edge.
 */
export function buildWordTimeline(
	doc: TranscriptDocument,
): Map<string, WordTimelineBounds> {
	const map = new Map<string, WordTimelineBounds>();
	const ranges = doc.deletedRanges;
	for (const segment of doc.segments) {
		for (const word of segment.words) {
			map.set(word.id, {
				tStartTicks: sourceToTimeline({
					sourceSeconds: word.start,
					deletedRanges: ranges,
				}),
				tEndTicks: sourceToTimeline({
					sourceSeconds: word.end,
					deletedRanges: ranges,
				}),
			});
		}
	}
	return map;
}
