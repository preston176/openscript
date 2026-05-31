import { describe, expect, test } from "bun:test";
import type {
	AudioElement,
	AudioTrack,
	SceneTracks,
	VideoElement,
	VideoTrack,
} from "@/timeline";
import {
	mediaTime,
	mediaTimeFromSeconds,
	type MediaTime,
	ZERO_MEDIA_TIME,
} from "@/wasm";
import { isWordPresentInTimeline, timelineCoversTime } from "../coverage";

function audioElement({
	id,
	start,
	duration,
}: {
	id: string;
	start: MediaTime;
	duration: MediaTime;
}): AudioElement {
	return {
		id,
		type: "audio",
		name: id,
		startTime: start,
		duration,
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: `media-${id}`,
	} satisfies AudioElement;
}

function videoElement({
	id,
	start,
	duration,
}: {
	id: string;
	start: MediaTime;
	duration: MediaTime;
}): VideoElement {
	return {
		id,
		type: "video",
		name: id,
		startTime: start,
		duration,
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		mediaId: `media-${id}`,
		params: {
			"transform.positionX": 0,
			"transform.positionY": 0,
			"transform.scaleX": 1,
			"transform.scaleY": 1,
			"transform.rotate": 0,
			opacity: 1,
		},
	} satisfies VideoElement;
}

function mainTrack(elements: VideoElement[] = []): VideoTrack {
	return {
		id: "video-main",
		type: "video",
		name: "main",
		elements,
		muted: false,
		hidden: false,
	};
}

function audioTrack(id: string, elements: AudioElement[]): AudioTrack {
	return { id, type: "audio", name: id, elements, muted: false };
}

function tracksWithAudio(elements: AudioElement[]): SceneTracks {
	return { overlay: [], main: mainTrack(), audio: [audioTrack("a1", elements)] };
}

describe("timelineCoversTime", () => {
	const tracks = tracksWithAudio([
		// covers [100, 150)
		audioElement({
			id: "e",
			start: mediaTime({ ticks: 100 }),
			duration: mediaTime({ ticks: 50 }),
		}),
	]);

	test("covers a time inside an element", () => {
		expect(timelineCoversTime({ tracks, time: mediaTime({ ticks: 120 }) })).toBe(
			true,
		);
	});

	test("includes the start edge and excludes the end edge", () => {
		expect(timelineCoversTime({ tracks, time: mediaTime({ ticks: 100 }) })).toBe(
			true,
		);
		expect(timelineCoversTime({ tracks, time: mediaTime({ ticks: 150 }) })).toBe(
			false,
		);
	});

	test("does not cover a time in a gap", () => {
		expect(timelineCoversTime({ tracks, time: mediaTime({ ticks: 200 }) })).toBe(
			false,
		);
	});

	test("checks the main video track, not only the audio tracks", () => {
		const mainTracks: SceneTracks = {
			overlay: [],
			main: mainTrack([
				videoElement({
					id: "v",
					start: ZERO_MEDIA_TIME,
					duration: mediaTime({ ticks: 10 }),
				}),
			]),
			audio: [],
		};
		expect(
			timelineCoversTime({ tracks: mainTracks, time: mediaTime({ ticks: 5 }) }),
		).toBe(true);
		expect(
			timelineCoversTime({ tracks: mainTracks, time: mediaTime({ ticks: 50 }) }),
		).toBe(false);
	});
});

describe("isWordPresentInTimeline", () => {
	// One element spanning [0s, 10s).
	const tracks = tracksWithAudio([
		audioElement({
			id: "e",
			start: ZERO_MEDIA_TIME,
			duration: mediaTimeFromSeconds({ seconds: 10 }),
		}),
	]);

	test("a word inside the covered span is present", () => {
		expect(isWordPresentInTimeline({ word: { start: 1, end: 2 }, tracks })).toBe(
			true,
		);
	});

	test("a word beyond the covered span is absent (reads as deleted)", () => {
		expect(
			isWordPresentInTimeline({ word: { start: 20, end: 21 }, tracks }),
		).toBe(false);
	});

	test("a word whose midpoint lands in a gap between elements is absent", () => {
		const gapped = tracksWithAudio([
			audioElement({
				id: "left",
				start: ZERO_MEDIA_TIME,
				duration: mediaTimeFromSeconds({ seconds: 5 }),
			}),
			audioElement({
				id: "right",
				start: mediaTimeFromSeconds({ seconds: 6 }),
				duration: mediaTimeFromSeconds({ seconds: 4 }),
			}),
		]);
		// midpoint 5.5s lands in the gap [5s, 6s)
		expect(
			isWordPresentInTimeline({ word: { start: 5.2, end: 5.8 }, tracks: gapped }),
		).toBe(false);
		// midpoint 1.5s lands inside the left element
		expect(
			isWordPresentInTimeline({ word: { start: 1, end: 2 }, tracks: gapped }),
		).toBe(true);
	});
});
