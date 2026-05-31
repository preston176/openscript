import { splitAnimationsAtTime } from "@/animation";
import { getSourceSpanAtClipTime } from "@/retime";
import { isRetimableElement, type TimelineElement } from "@/timeline";
import { generateUUID } from "@/utils/id";
import {
	addMediaTime,
	type MediaTime,
	roundMediaTime,
	subMediaTime,
} from "@/wasm";

/**
 * Split one element at an absolute timeline `splitTime` into a left piece
 * `[startTime, splitTime)` and a right piece `[splitTime, end)`.
 *
 * Pure mirror of the per-element math in `SplitElementsCommand` (retime-aware,
 * snap-source-once so `leftSourceSpan + rightSourceSpan == totalSourceSpan`),
 * extracted so the transcript ripple-delete transform can split without going
 * through the editor/command layer. Returns `null` if `splitTime` is at or
 * outside the element's bounds. The left piece keeps the original id; the right
 * piece gets `rightId` (or a fresh uuid).
 *
 * NOTE: keep in sync with split-elements.ts until that command is refactored to
 * delegate here.
 */
export function splitElementAtTime<E extends TimelineElement>({
	element,
	splitTime,
	rightId,
}: {
	element: E;
	splitTime: MediaTime;
	rightId?: string;
}): { left: E; right: E } | null {
	const effectiveStart = element.startTime;
	const effectiveEnd = element.startTime + element.duration;
	if (splitTime <= effectiveStart || splitTime >= effectiveEnd) {
		return null;
	}

	const relativeTime = subMediaTime({ a: splitTime, b: element.startTime });
	const leftVisibleDuration = relativeTime;
	const rightVisibleDuration = subMediaTime({
		a: element.duration,
		b: relativeTime,
	});
	const retimeRef = isRetimableElement(element) ? element.retime : undefined;
	const leftSourceSpan = roundMediaTime({
		time: getSourceSpanAtClipTime({ clipTime: leftVisibleDuration, retime: retimeRef }),
	});
	const totalSourceSpan = roundMediaTime({
		time: getSourceSpanAtClipTime({ clipTime: element.duration, retime: retimeRef }),
	});
	const rightSourceSpan = subMediaTime({
		a: totalSourceSpan,
		b: leftSourceSpan,
	});
	const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
		animations: element.animations,
		splitTime: relativeTime,
		shouldIncludeSplitBoundary: true,
	});
	const leftTrimEnd = addMediaTime({ a: element.trimEnd, b: rightSourceSpan });
	const rightTrimStart = addMediaTime({ a: element.trimStart, b: leftSourceSpan });

	const left = {
		...element,
		duration: leftVisibleDuration,
		trimEnd: leftTrimEnd,
		animations: leftAnimations,
		...(retimeRef !== undefined ? { retime: retimeRef } : {}),
	} as E;
	const right = {
		...element,
		id: rightId ?? generateUUID(),
		startTime: splitTime,
		duration: rightVisibleDuration,
		trimStart: rightTrimStart,
		animations: rightAnimations,
		...(retimeRef !== undefined ? { retime: retimeRef } : {}),
	} as E;
	return { left, right };
}
