import { describe, expect, test } from "bun:test";
import type {
	AudioElement,
	AudioTrack,
	RetimeConfig,
	SceneTracks,
	VideoTrack,
} from "@/timeline";
import { mediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import { deleteRangeFromTracks } from "../delete-transform";
import { restoreRangeToTracks } from "../restore-transform";

function audio(
	id: string,
	start: number,
	duration: number,
	retime?: RetimeConfig,
): AudioElement {
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
		...(retime ? { retime } : {}),
	} satisfies AudioElement;
}

function emptyMain(): VideoTrack {
	return { id: "video-main", type: "video", name: "main", elements: [], muted: false, hidden: false };
}

function tracksWith(elements: AudioElement[]): SceneTracks {
	const track: AudioTrack = { id: "a1", type: "audio", name: "a1", elements, muted: false };
	return { overlay: [], main: emptyMain(), audio: [track] };
}

function audioEls(tracks: SceneTracks): AudioElement[] {
	return tracks.audio[0].elements;
}

// Delete [start,end) then restore at the gap (which sits at `start` after the
// ripple-close) and assert the timeline reconstructs.
function deleteThenRestore(tracks: SceneTracks, start: number, end: number) {
	const del = deleteRangeFromTracks({
		tracks,
		start: mediaTime({ ticks: start }),
		end: mediaTime({ ticks: end }),
	});
	const restored = restoreRangeToTracks({
		tracks: del.afterTracks,
		gapStartTicks: mediaTime({ ticks: start }),
		durationTicks: del.durationTicks,
		removed: del.removed,
	});
	return restored;
}

describe("delete -> restore round-trip", () => {
	test("straddle-both reconstructs contiguous source coverage", () => {
		const restored = deleteThenRestore(tracksWith([audio("e", 0, 10)]), 4, 6);
		const els = audioEls(restored);
		// left [0,4) src[0,4), middle [4,6) src[4,6), right [6,10) src[6,10)
		expect(els.map((e) => Number(e.startTime))).toEqual([0, 4, 6]);
		expect(els.map((e) => Number(e.duration))).toEqual([4, 2, 4]);
		expect(els.map((e) => Number(e.trimStart))).toEqual([0, 4, 6]);
	});

	test("timeline stays contiguous and the same total length after round-trip", () => {
		const original = tracksWith([audio("a", 0, 4), audio("b", 4, 4), audio("c", 8, 4)]);
		const restored = deleteThenRestore(original, 5, 9);
		const els = audioEls(restored);
		// contiguous: each element starts where the previous ends; covers [0,12)
		let cursor = 0;
		for (const el of els) {
			expect(Number(el.startTime)).toBe(cursor);
			cursor += Number(el.duration);
		}
		expect(cursor).toBe(12);
	});

	test("retimed element round-trips without drift (contiguous, same length)", () => {
		const original = tracksWith([audio("r", 0, 10, { rate: 2 })]);
		const restored = deleteThenRestore(original, 3, 7);
		const els = audioEls(restored);
		let cursor = 0;
		for (const el of els) {
			expect(Number(el.startTime)).toBe(cursor);
			cursor += Number(el.duration);
		}
		expect(cursor).toBe(10);
		// every piece carries the retime config through the round-trip
		expect(els.every((e) => e.retime?.rate === 2)).toBe(true);
	});
});
