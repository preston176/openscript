import type { EditorCore } from "@/core";
import type { SceneTracks, TimelineElement } from "@/timeline";
import { mediaTimeFromSeconds, type MediaTime } from "@/wasm";

interface ElementRef {
	trackId: string;
	elementId: string;
}

interface CoveringElement extends ElementRef {
	startTime: MediaTime;
	endTime: MediaTime;
}

export interface WordRange {
	startSeconds: number;
	endSeconds: number;
}

/**
 * Delete a list of word ranges from the timeline.
 *
 * For each range, finds elements covering it on every track and either splits
 * them at the range boundaries (deleting the middle piece) or deletes the
 * whole element if it sits entirely inside the range. Adjacent ranges are
 * merged first to minimise the number of splits.
 *
 * Ranges are processed latest-first so deletions don't shift the time
 * coordinates of earlier ranges. (Without ripple, deletions leave gaps —
 * coordinates are stable. Ripple is not yet supported.)
 *
 * The whole batch is one undo step (each splitElements/deleteElements call is
 * already an atomic command in opencut's command system; we issue them in
 * order and rely on the user's Ctrl+Z stepping through them).
 */
export function applyTranscriptDeletions({
	editor,
	ranges,
}: {
	editor: EditorCore;
	ranges: WordRange[];
}): void {
	if (ranges.length === 0) return;
	const merged = mergeRanges({ ranges });

	for (let i = merged.length - 1; i >= 0; i--) {
		const range = merged[i];
		const startTime = mediaTimeFromSeconds({ seconds: range.startSeconds });
		const endTime = mediaTimeFromSeconds({ seconds: range.endSeconds });
		if (endTime <= startTime) continue;
		deleteTimelineRange({ editor, startTime, endTime });
	}
}

function mergeRanges({ ranges }: { ranges: WordRange[] }): WordRange[] {
	if (ranges.length === 0) return [];
	const sorted = [...ranges].sort((a, b) => a.startSeconds - b.startSeconds);
	const merged: WordRange[] = [{ ...sorted[0] }];
	for (let i = 1; i < sorted.length; i++) {
		const last = merged[merged.length - 1];
		const next = sorted[i];
		if (next.startSeconds <= last.endSeconds) {
			last.endSeconds = Math.max(last.endSeconds, next.endSeconds);
		} else {
			merged.push({ ...next });
		}
	}
	return merged;
}

function deleteTimelineRange({
	editor,
	startTime,
	endTime,
}: {
	editor: EditorCore;
	startTime: MediaTime;
	endTime: MediaTime;
}): void {
	const tracks = editor.scenes.getActiveSceneOrNull()?.tracks;
	if (!tracks) return;

	const covering = findCoveringElements({ tracks, startTime, endTime });
	if (covering.length === 0) return;

	const fullyContained: ElementRef[] = [];
	const partialLeft: ElementRef[] = []; // element straddles startTime
	const partialRight: ElementRef[] = []; // element straddles endTime
	const straddleBoth: ElementRef[] = []; // element contains the whole range

	for (const cov of covering) {
		const startsBefore = cov.startTime < startTime;
		const endsAfter = cov.endTime > endTime;
		if (!startsBefore && !endsAfter) {
			fullyContained.push({ trackId: cov.trackId, elementId: cov.elementId });
		} else if (startsBefore && endsAfter) {
			straddleBoth.push({ trackId: cov.trackId, elementId: cov.elementId });
		} else if (startsBefore) {
			partialLeft.push({ trackId: cov.trackId, elementId: cov.elementId });
		} else {
			partialRight.push({ trackId: cov.trackId, elementId: cov.elementId });
		}
	}

	// 1. Elements that contain the whole range: split at endTime first (capturing
	//    the right piece, which we keep), then split at startTime (the right of
	//    that becomes the middle, which we delete).
	const middleFromStraddleBoth: ElementRef[] = [];
	if (straddleBoth.length > 0) {
		// Split at endTime — right side is the surviving tail.
		editor.timeline.splitElements({
			elements: straddleBoth,
			splitTime: endTime,
			retainSide: "both",
		});
		// Now the original IDs in straddleBoth are the LEFT piece [origStart, endTime).
		// Split those at startTime — right side is the middle [startTime, endTime).
		const middlePieces = editor.timeline.splitElements({
			elements: straddleBoth,
			splitTime: startTime,
			retainSide: "both",
		});
		middleFromStraddleBoth.push(...middlePieces);
	}

	// 2. Elements straddling startTime only (left side survives, right side gets
	//    deleted because it falls fully inside the range).
	const rightOfPartialLeft: ElementRef[] = [];
	if (partialLeft.length > 0) {
		const rightPieces = editor.timeline.splitElements({
			elements: partialLeft,
			splitTime: startTime,
			retainSide: "both",
		});
		rightOfPartialLeft.push(...rightPieces);
	}

	// 3. Elements straddling endTime only (left side falls fully inside the
	//    range, right side survives).
	const leftOfPartialRight: ElementRef[] = [];
	if (partialRight.length > 0) {
		// Original IDs become the LEFT piece [origStart, endTime).
		// We capture them BEFORE the split returns the right side.
		leftOfPartialRight.push(...partialRight);
		editor.timeline.splitElements({
			elements: partialRight,
			splitTime: endTime,
			retainSide: "both",
		});
	}

	const toDelete: ElementRef[] = [
		...fullyContained,
		...middleFromStraddleBoth,
		...rightOfPartialLeft,
		...leftOfPartialRight,
	];

	if (toDelete.length > 0) {
		editor.timeline.deleteElements({ elements: toDelete });
	}
}

function findCoveringElements({
	tracks,
	startTime,
	endTime,
}: {
	tracks: SceneTracks;
	startTime: MediaTime;
	endTime: MediaTime;
}): CoveringElement[] {
	const result: CoveringElement[] = [];
	const collect = (trackId: string, elements: readonly TimelineElement[]) => {
		for (const element of elements) {
			const elementEnd = (element.startTime + element.duration) as MediaTime;
			if (element.startTime < endTime && elementEnd > startTime) {
				result.push({
					trackId,
					elementId: element.id,
					startTime: element.startTime,
					endTime: elementEnd,
				});
			}
		}
	};
	collect(tracks.main.id, tracks.main.elements);
	for (const track of tracks.audio) collect(track.id, track.elements);
	for (const track of tracks.overlay) collect(track.id, track.elements);
	return result;
}
