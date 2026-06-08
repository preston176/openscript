import type { SceneTracks, TimelineElement } from "@/timeline";
import { mediaTimeFromSeconds, type MediaTime } from "@/wasm";
import type { TranscriptWord } from "./types";

/**
 * True if `time` falls within some element on any track (main, audio, overlay).
 * Mirrors the coverage test in `findCoveringElements` (apply-deletion):
 * an element covers `time` when `startTime <= time < startTime + duration`.
 */
export function timelineCoversTime({
	tracks,
	time,
}: {
	tracks: SceneTracks;
	time: MediaTime;
}): boolean {
	const coversIn = (elements: readonly TimelineElement[]): boolean =>
		elements.some((element) => {
			const end = element.startTime + element.duration;
			return element.startTime <= time && time < end;
		});

	return (
		coversIn(tracks.main.elements) ||
		tracks.audio.some((track) => coversIn(track.elements)) ||
		tracks.overlay.some((track) => coversIn(track.elements))
	);
}

/**
 * A transcript word is "present" in the edit when its midpoint time is still
 * covered by media on the timeline. A pre-Descript (v1) deletion removed the
 * covering elements across the word's range, so its midpoint becomes uncovered
 * and the word reads as deleted.
 *
 * Deriving the deleted state from the timeline (rather than storing it) keeps
 * the transcript consistent with the actual media across undo/redo and reload:
 * if the cut is undone, the element returns and the word is present again.
 *
 * The midpoint (rather than the full span) is used so word boundaries that sit
 * exactly on element edges — or differ by a tick from neighbouring words — do
 * not flip the result.
 */
export function isWordPresentInTimeline({
	word,
	tracks,
}: {
	word: Pick<TranscriptWord, "start" | "end">;
	tracks: SceneTracks;
}): boolean {
	const midpointSeconds = (word.start + word.end) / 2;
	const time = mediaTimeFromSeconds({ seconds: midpointSeconds });
	return timelineCoversTime({ tracks, time });
}
