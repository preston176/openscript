import { describe, expect, test } from "bun:test";
import type { AudioElement } from "@/timeline";
import { mediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import { rippleOpenElements } from "../open";
import { rippleShiftElements } from "../shift";

function el(id: string, startTicks: number): AudioElement {
	return {
		id,
		type: "audio",
		name: id,
		startTime: mediaTime({ ticks: startTicks }),
		duration: mediaTime({ ticks: 100 }),
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: `media-${id}`,
	} satisfies AudioElement;
}

describe("rippleOpenElements", () => {
	test("shifts elements at/after afterTime right; leaves earlier ones", () => {
		const elements = [el("a", 0), el("b", 1000), el("c", 2000)];
		const opened = rippleOpenElements({
			elements,
			afterTime: 1000,
			shiftAmount: 500,
		});
		expect(opened.map((e) => Number(e.startTime))).toEqual([0, 1500, 2500]);
	});

	test("is the exact inverse of rippleShiftElements", () => {
		const elements = [el("a", 0), el("b", 1000), el("c", 2000)];
		const closed = rippleShiftElements({
			elements,
			afterTime: 1000,
			shiftAmount: 500,
		});
		const reopened = rippleOpenElements({
			elements: closed,
			afterTime: 500, // gap now sits at 500 after the close
			shiftAmount: 500,
		});
		expect(reopened.map((e) => Number(e.startTime))).toEqual([0, 1000, 2000]);
	});
});
