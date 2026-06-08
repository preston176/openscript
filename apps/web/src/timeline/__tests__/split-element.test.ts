import { describe, expect, test } from "bun:test";
import type { AudioElement } from "@/timeline";
import { mediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import { splitElementAtTime } from "../split-element";

function audio(start: number, duration: number, trimStart = 0, trimEnd = 0): AudioElement {
	return {
		id: "e",
		type: "audio",
		name: "e",
		startTime: mediaTime({ ticks: start }),
		duration: mediaTime({ ticks: duration }),
		trimStart: mediaTime({ ticks: trimStart }),
		trimEnd: mediaTime({ ticks: trimEnd }),
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: "media-e",
	} satisfies AudioElement;
}

describe("splitElementAtTime", () => {
	test("splits a non-retimed element into contiguous left/right halves", () => {
		const result = splitElementAtTime({
			element: audio(0, 10),
			splitTime: mediaTime({ ticks: 4 }),
		});
		expect(result).not.toBeNull();
		if (!result) throw new Error("expected split");
		// left [0,4): trimEnd advances by the right source span (6)
		expect(Number(result.left.startTime)).toBe(0);
		expect(Number(result.left.duration)).toBe(4);
		expect(Number(result.left.trimEnd)).toBe(6);
		// right [4,10): trimStart advances by the left source span (4)
		expect(Number(result.right.startTime)).toBe(4);
		expect(Number(result.right.duration)).toBe(6);
		expect(Number(result.right.trimStart)).toBe(4);
		// left keeps the id; right gets a new one
		expect(result.left.id).toBe("e");
		expect(result.right.id).not.toBe("e");
	});

	test("uses the provided rightId", () => {
		const result = splitElementAtTime({
			element: audio(0, 10),
			splitTime: mediaTime({ ticks: 5 }),
			rightId: "right-1",
		});
		expect(result?.right.id).toBe("right-1");
	});

	test("returns null when splitTime is at or outside the bounds", () => {
		expect(
			splitElementAtTime({ element: audio(0, 10), splitTime: ZERO_MEDIA_TIME }),
		).toBeNull();
		expect(
			splitElementAtTime({
				element: audio(0, 10),
				splitTime: mediaTime({ ticks: 10 }),
			}),
		).toBeNull();
		expect(
			splitElementAtTime({
				element: audio(2, 4),
				splitTime: mediaTime({ ticks: 1 }),
			}),
		).toBeNull();
	});
});
