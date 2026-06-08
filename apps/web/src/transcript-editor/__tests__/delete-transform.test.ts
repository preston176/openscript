import { describe, expect, test } from "bun:test";
import type { AudioElement, AudioTrack, SceneTracks, VideoTrack } from "@/timeline";
import { mediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import { deleteRangeFromTracks } from "../delete-transform";

function audio(id: string, start: number, duration: number): AudioElement {
	return {
		id,
		type: "audio",
		name: id,
		startTime: mediaTime({ ticks: start }),
		duration: mediaTime({ ticks: duration }),
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: `media-${id}`,
	} satisfies AudioElement;
}

function emptyMain(): VideoTrack {
	return { id: "video-main", type: "video", name: "main", elements: [], muted: false, hidden: false };
}

function tracksWith(elements: AudioElement[]): SceneTracks {
	const audioTrack: AudioTrack = { id: "a1", type: "audio", name: "a1", elements, muted: false };
	return { overlay: [], main: emptyMain(), audio: [audioTrack] };
}

function audioElements(result: { afterTracks: SceneTracks }): AudioElement[] {
	return result.afterTracks.audio[0].elements;
}

describe("deleteRangeFromTracks", () => {
	test("splits a straddling element and ripple-closes the gap", () => {
		// one element [0,10); delete [4,6)
		const result = deleteRangeFromTracks({
			tracks: tracksWith([audio("e", 0, 10)]),
			start: mediaTime({ ticks: 4 }),
			end: mediaTime({ ticks: 6 }),
		});
		const els = audioElements(result);
		// left [0,4) stays; right [6,10) (dur 4) shifts left by 2 -> [4,8)
		expect(els.map((e) => [Number(e.startTime), Number(e.duration)])).toEqual([
			[0, 4],
			[4, 4],
		]);
		expect(Number(result.durationTicks)).toBe(2);
		// the removed middle [4,6) is captured at offset 0 with duration 2
		expect(result.removed).toHaveLength(1);
		expect(result.removed[0]).toMatchObject({ trackId: "a1", trackType: "audio" });
		expect(Number(result.removed[0].offsetTicks)).toBe(0);
		expect(Number(result.removed[0].element.duration)).toBe(2);
	});

	test("removes a fully-contained element and ripple-closes", () => {
		// [0,2) survives untouched; [4,6) is fully inside [3,7) -> removed; [8,10) shifts left by 4
		const result = deleteRangeFromTracks({
			tracks: tracksWith([audio("a", 0, 2), audio("b", 4, 2), audio("c", 8, 2)]),
			start: mediaTime({ ticks: 3 }),
			end: mediaTime({ ticks: 7 }),
		});
		const els = audioElements(result);
		expect(els.map((e) => e.id)).toEqual(["a", "c"]);
		expect(els.map((e) => Number(e.startTime))).toEqual([0, 4]); // c: 8 - 4
		expect(result.removed.map((r) => r.element.duration as number)).toEqual([2]);
		expect(Number(result.durationTicks)).toBe(4);
	});

	test("leaves non-overlapping elements untouched", () => {
		const result = deleteRangeFromTracks({
			tracks: tracksWith([audio("a", 0, 2)]),
			start: mediaTime({ ticks: 5 }),
			end: mediaTime({ ticks: 8 }),
		});
		expect(audioElements(result).map((e) => Number(e.startTime))).toEqual([0]);
		expect(result.removed).toHaveLength(0);
	});
});
