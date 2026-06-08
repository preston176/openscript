import type { TimelineElement } from "@/timeline/types";

/**
 * Inverse of `rippleShiftElements`: re-open a gap by shifting elements that
 * start at/after `afterTime` RIGHT by `shiftAmount`. Used to restore a
 * ripple-closed transcript deletion. Mirrors shift.ts exactly with the sign
 * flipped; pass a positive `shiftAmount` (do not reuse a negative shift through
 * `rippleShiftElements`, which only subtracts).
 */
export function rippleOpenElements<TElement extends TimelineElement>({
	elements,
	afterTime,
	shiftAmount,
}: {
	elements: TElement[];
	afterTime: number;
	shiftAmount: number;
}): TElement[] {
	return elements.map((element) =>
		element.startTime >= afterTime
			? ({ ...element, startTime: element.startTime + shiftAmount } as TElement)
			: element,
	);
}
