import { rippleOpenElements } from "@/ripple";
import type { SceneTracks, TimelineElement } from "@/timeline";
import { generateUUID } from "@/utils/id";
import { addMediaTime, type MediaTime } from "@/wasm";
import type { RemovedPiece } from "./types";

/**
 * Inverse of deleteRangeFromTracks: re-open a closed gap at `gapStartTicks` (by
 * `durationTicks`) and re-insert the removed slices at their captured offsets,
 * reconstructing each element losslessly (everything but a fresh id). Pure.
 *
 * Assumes the target tracks still exist (the pure transform never prunes empty
 * tracks — that is a command-level concern). Restoring to a track that was
 * emptied and pruned is an out-of-scope edge handled by the command layer.
 */
export function restoreRangeToTracks({
	tracks,
	gapStartTicks,
	durationTicks,
	removed,
}: {
	tracks: SceneTracks;
	gapStartTicks: MediaTime;
	durationTicks: MediaTime;
	removed: RemovedPiece[];
}): SceneTracks {
	const rebuildTrack = <TTrack extends { id: string; elements: TimelineElement[] }>(
		track: TTrack,
	): TTrack => {
		// Make room: shift everything at/after the gap right by the gap width.
		const opened = rippleOpenElements({
			elements: track.elements,
			afterTime: gapStartTicks,
			shiftAmount: durationTicks,
		});
		const pieces = removed.filter((piece) => piece.trackId === track.id);
		if (pieces.length === 0) {
			return { ...track, elements: opened } as TTrack;
		}
		const reinserted = pieces.map(
			(piece): TimelineElement =>
				// piece.element is a captured element minus its id; re-adding the id +
				// gap-relative start reconstructs a valid element. The cast is needed
				// because spreading the Omit<TimelineElement> union erases the
				// discriminant correlation (e.g. EffectElement.effectType).
				({
					...piece.element,
					id: generateUUID(),
					startTime: addMediaTime({ a: gapStartTicks, b: piece.offsetTicks }),
				}) as TimelineElement,
		);
		const elements = [...opened, ...reinserted].sort(
			(a, b) => a.startTime - b.startTime,
		);
		return { ...track, elements } as TTrack;
	};

	return {
		main: rebuildTrack(tracks.main),
		audio: tracks.audio.map((track) => rebuildTrack(track)),
		overlay: tracks.overlay.map((track) => rebuildTrack(track)),
	};
}
