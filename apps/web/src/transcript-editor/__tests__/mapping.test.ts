import { describe, expect, test } from "bun:test";
import { mediaTime, mediaTimeFromSeconds } from "@/wasm";
import {
	buildWordTimeline,
	sourceToTimeline,
	timelineToSource,
} from "../mapping";
import type { DeletedRange, TranscriptDocument } from "../types";

const oneSecTicks = mediaTimeFromSeconds({ seconds: 1 });

// One cut covering source [2s, 3s) removing 1s of timeline.
const cut: DeletedRange = {
	id: "r1",
	wordIds: ["w"],
	sourceStartSeconds: 2,
	sourceEndSeconds: 3,
	durationTicks: oneSecTicks,
	removed: [],
};

describe("sourceToTimeline", () => {
	test("no cuts: identity (seconds -> ticks)", () => {
		expect(sourceToTimeline({ sourceSeconds: 5, deletedRanges: [] })).toBe(
			mediaTimeFromSeconds({ seconds: 5 }),
		);
	});

	test("a word before the cut is not shifted", () => {
		expect(sourceToTimeline({ sourceSeconds: 1, deletedRanges: [cut] })).toBe(
			mediaTimeFromSeconds({ seconds: 1 }),
		);
	});

	test("a word after the cut shifts left by the removed duration", () => {
		const expected = mediaTime({
			ticks: mediaTimeFromSeconds({ seconds: 5 }) - oneSecTicks,
		});
		expect(sourceToTimeline({ sourceSeconds: 5, deletedRanges: [cut] })).toBe(
			expected,
		);
	});

	test("a time inside the cut clamps to the gap's left edge", () => {
		expect(sourceToTimeline({ sourceSeconds: 2.5, deletedRanges: [cut] })).toBe(
			mediaTimeFromSeconds({ seconds: 2 }),
		);
	});
});

describe("timelineToSource", () => {
	test("round-trips a non-deleted source time", () => {
		const t = sourceToTimeline({ sourceSeconds: 5, deletedRanges: [cut] });
		expect(timelineToSource({ timelineTicks: t, deletedRanges: [cut] })).toBeCloseTo(
			5,
			5,
		);
	});

	test("identity with no cuts", () => {
		const t = mediaTimeFromSeconds({ seconds: 3.2 });
		expect(timelineToSource({ timelineTicks: t, deletedRanges: [] })).toBeCloseTo(
			3.2,
			5,
		);
	});
});

describe("buildWordTimeline", () => {
	test("maps every word's bounds, shifting words after a cut", () => {
		const doc: TranscriptDocument = {
			segments: [
				{
					id: "s0",
					start: 0,
					end: 6,
					words: [
						{ id: "before", text: "a", start: 1, end: 1.5 },
						{ id: "after", text: "b", start: 5, end: 5.5 },
					],
				},
			],
			deletedRanges: [cut],
		};
		const map = buildWordTimeline(doc);
		expect(map.get("before")?.tStartTicks).toBe(
			mediaTimeFromSeconds({ seconds: 1 }),
		);
		expect(map.get("after")?.tStartTicks).toBe(
			mediaTime({ ticks: mediaTimeFromSeconds({ seconds: 5 }) - oneSecTicks }),
		);
	});
});
