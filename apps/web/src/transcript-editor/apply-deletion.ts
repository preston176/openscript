import type { EditorCore } from "@/core";
import { BatchCommand, type Command } from "@/commands";
import {
	DeleteElementsCommand,
	SplitElementsCommand,
} from "@/commands/timeline";
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
 * Delete a list of word ranges from the timeline as a single undo step.
 *
 * Builds split + delete commands, executes each one (so subsequent splits can
 * read the resulting element IDs from the live scene state), then wraps the
 * sequence in a `BatchCommand` and registers it with the command manager.
 * One Cmd+Z undoes the whole transcript edit.
 *
 * Ranges are processed latest-first so deletions don't shift the time
 * coordinates of earlier ranges. (Without ripple, deletions leave gaps —
 * coordinates are stable. Ripple is not yet supported.)
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

	const executed: Command[] = [];

	for (let i = merged.length - 1; i >= 0; i--) {
		const range = merged[i];
		const startTime = mediaTimeFromSeconds({ seconds: range.startSeconds });
		const endTime = mediaTimeFromSeconds({ seconds: range.endSeconds });
		if (endTime <= startTime) continue;
		buildDeleteRangeCommands({ editor, startTime, endTime, executed });
	}

	if (executed.length === 0) return;

	const batch = new BatchCommand(executed);
	editor.command.push({ command: batch });
	// Sub-commands were executed incrementally above (to read live element IDs
	// between splits), so this uses push() rather than execute(). push() does
	// not run reactors, so trigger them now — otherwise a transcript delete that
	// empties an audio/overlay track leaves an orphan empty track behind.
	editor.command.reactToExternalChange();
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

function buildDeleteRangeCommands({
	editor,
	startTime,
	endTime,
	executed,
}: {
	editor: EditorCore;
	startTime: MediaTime;
	endTime: MediaTime;
	executed: Command[];
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
		const ref: ElementRef = { trackId: cov.trackId, elementId: cov.elementId };
		if (!startsBefore && !endsAfter) fullyContained.push(ref);
		else if (startsBefore && endsAfter) straddleBoth.push(ref);
		else if (startsBefore) partialLeft.push(ref);
		else partialRight.push(ref);
	}

	const middleFromStraddleBoth: ElementRef[] = [];
	if (straddleBoth.length > 0) {
		// Split at endTime; original IDs become LEFT [origStart, endTime).
		runSplit({
			editor,
			elements: straddleBoth,
			splitTime: endTime,
			executed,
		});
		// Split those at startTime; right side is the middle [startTime, endTime).
		const middle = runSplit({
			editor,
			elements: straddleBoth,
			splitTime: startTime,
			executed,
		});
		middleFromStraddleBoth.push(...middle);
	}

	const rightOfPartialLeft: ElementRef[] = [];
	if (partialLeft.length > 0) {
		const right = runSplit({
			editor,
			elements: partialLeft,
			splitTime: startTime,
			executed,
		});
		rightOfPartialLeft.push(...right);
	}

	const leftOfPartialRight: ElementRef[] = [];
	if (partialRight.length > 0) {
		// Original IDs become the LEFT piece [origStart, endTime). Capture before split.
		leftOfPartialRight.push(...partialRight);
		runSplit({
			editor,
			elements: partialRight,
			splitTime: endTime,
			executed,
		});
	}

	const toDelete: ElementRef[] = [
		...fullyContained,
		...middleFromStraddleBoth,
		...rightOfPartialLeft,
		...leftOfPartialRight,
	];

	if (toDelete.length > 0) {
		const cmd = new DeleteElementsCommand({ elements: toDelete });
		cmd.execute();
		executed.push(cmd);
	}
}

function runSplit({
	editor: _editor,
	elements,
	splitTime,
	executed,
}: {
	editor: EditorCore;
	elements: ElementRef[];
	splitTime: MediaTime;
	executed: Command[];
}): ElementRef[] {
	const cmd = new SplitElementsCommand({
		elements,
		splitTime,
		retainSide: "both",
	});
	cmd.execute();
	executed.push(cmd);
	return cmd.getRightSideElements();
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
