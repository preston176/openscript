import { rippleShiftElements } from "@/ripple";
import type { SceneTracks, TimelineElement } from "@/timeline";
import { splitElementAtTime } from "@/timeline/split-element";
import type { MediaTime } from "@/wasm";
import type { RemovedPiece } from "./types";

export interface RangeDeletionResult {
	afterTracks: SceneTracks;
	/** Slices removed from the timeline, captured for lossless restore. */
	removed: RemovedPiece[];
	/** Gap width closed by the ripple = end − start. Reused verbatim on restore. */
	durationTicks: MediaTime;
}

/**
 * Remove a timeline range `[start, end)` across all tracks and ripple-close the
 * gap (shift every track uniformly so the tracks stay in sync), returning the
 * new tracks plus the removed slices. Pure: operates on a `SceneTracks` value,
 * never the live editor — so it is unit-testable and the command layer is a
 * thin snapshot wrapper.
 *
 * Elements straddling the range are split (retime-aware) via splitElementAtTime;
 * the portion inside `[start, end)` is captured in `removed`, the outside
 * portions are kept. `offsetTicks` is each removed slice's start relative to the
 * gap's left edge (`start`), so restore re-lands the pieces contiguously.
 */
export function deleteRangeFromTracks({
	tracks,
	start,
	end,
}: {
	tracks: SceneTracks;
	start: MediaTime;
	end: MediaTime;
}): RangeDeletionResult {
	const removed: RemovedPiece[] = [];
	const durationTicks = (end - start) as MediaTime;

	const capture = (
		slice: TimelineElement,
		trackId: string,
		trackType: RemovedPiece["trackType"],
	): void => {
		const { id: _id, ...element } = slice;
		removed.push({
			trackId,
			trackType,
			offsetTicks: (slice.startTime - start) as MediaTime,
			element,
		});
	};

	const process = (
		elements: readonly TimelineElement[],
		trackId: string,
		trackType: RemovedPiece["trackType"],
	): TimelineElement[] => {
		const kept: TimelineElement[] = [];
		for (const element of elements) {
			const elStart = element.startTime;
			const elEnd = element.startTime + element.duration;

			// No overlap with the cut.
			if (elEnd <= start || elStart >= end) {
				kept.push(element);
				continue;
			}
			// Entirely inside the cut.
			if (elStart >= start && elEnd <= end) {
				capture(element, trackId, trackType);
				continue;
			}
			// Straddles both edges: keep left + right, remove the middle.
			if (elStart < start && elEnd > end) {
				const first = splitElementAtTime({ element, splitTime: start });
				if (!first) {
					kept.push(element);
					continue;
				}
				kept.push(first.left);
				const second = splitElementAtTime({ element: first.right, splitTime: end });
				if (!second) {
					capture(first.right, trackId, trackType);
					continue;
				}
				capture(second.left, trackId, trackType);
				kept.push(second.right);
				continue;
			}
			// Straddles the start edge: keep the left part, remove the right part.
			if (elStart < start) {
				const split = splitElementAtTime({ element, splitTime: start });
				if (!split) {
					kept.push(element);
					continue;
				}
				kept.push(split.left);
				capture(split.right, trackId, trackType);
				continue;
			}
			// Straddles the end edge: remove the left part, keep the right part.
			const split = splitElementAtTime({ element, splitTime: end });
			if (!split) {
				kept.push(element);
				continue;
			}
			capture(split.left, trackId, trackType);
			kept.push(split.right);
		}
		// Ripple-close: pull everything at/after the gap's right edge left by the
		// gap width. Uniform across tracks keeps multi-track content in sync.
		return rippleShiftElements({ elements: kept, afterTime: end, shiftAmount: durationTicks });
	};

	// Generic wrapper so each track keeps its specific type through the cast —
	// the same discipline as SplitElementsCommand's splitTrack.
	const processTrack = <TTrack extends { id: string; elements: TimelineElement[] }>(
		track: TTrack,
		trackType: RemovedPiece["trackType"],
	): TTrack => {
		return {
			...track,
			elements: process(track.elements, track.id, trackType),
		} as TTrack;
	};

	const afterTracks: SceneTracks = {
		main: processTrack(tracks.main, "main"),
		audio: tracks.audio.map((track) => processTrack(track, "audio")),
		overlay: tracks.overlay.map((track) => processTrack(track, "overlay")),
	};

	return { afterTracks, removed, durationTicks };
}
