import { describe, expect, test } from "bun:test";
import type { AudioElement, AudioTrack, SceneTracks, VideoTrack } from "@/timeline";
import { mediaTimeFromSeconds, ZERO_MEDIA_TIME } from "@/wasm";
import { migrateTranscript } from "../migrate";
import type { DeletedRange, TranscriptDocument } from "../types";

// Media only covers [0s, 5s).
function tracksCovering5s(): SceneTracks {
	const element: AudioElement = {
		id: "clip",
		type: "audio",
		name: "clip",
		startTime: ZERO_MEDIA_TIME,
		duration: mediaTimeFromSeconds({ seconds: 5 }),
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: "media-clip",
	};
	const audio: AudioTrack = { id: "a1", type: "audio", name: "a1", elements: [element], muted: false };
	const main: VideoTrack = { id: "video-main", type: "video", name: "main", elements: [], muted: false, hidden: false };
	return { overlay: [], main, audio: [audio] };
}

function v1Doc(): TranscriptDocument {
	return {
		segments: [
			{
				id: "s0",
				start: 0,
				end: 8,
				words: [
					{ id: "a", text: "a", start: 0, end: 2 }, // midpoint 1s -> covered
					{ id: "b", text: "b", start: 6, end: 8 }, // midpoint 7s -> not covered
				],
			},
		],
		deletedRanges: [],
	};
}

describe("migrateTranscript", () => {
	test("v1 -> v2 derives deleted from current timeline coverage, empty deletedRanges", () => {
		const result = migrateTranscript({
			stored: { version: 1, document: v1Doc() },
			tracks: tracksCovering5s(),
		});
		const byId = Object.fromEntries(
			result.segments.flatMap((s) => s.words).map((w) => [w.id, w]),
		);
		expect(byId.a.deleted).toBe(false); // still covered
		expect(byId.b.deleted).toBe(true); // in a gap
		expect(result.deletedRanges).toEqual([]);
	});

	test("v2 documents pass through with deletedRanges intact", () => {
		const range: DeletedRange = {
			id: "r1",
			wordIds: ["b"],
			sourceStartSeconds: 6,
			sourceEndSeconds: 8,
			durationTicks: mediaTimeFromSeconds({ seconds: 2 }),
			removed: [],
		};
		const doc: TranscriptDocument = {
			segments: v1Doc().segments,
			deletedRanges: [range],
		};
		const result = migrateTranscript({
			stored: { version: 2, document: doc },
			tracks: tracksCovering5s(),
		});
		expect(result.deletedRanges).toEqual([range]);
	});

	test("v1 with no tracks leaves words present (cannot derive)", () => {
		const result = migrateTranscript({
			stored: { version: 1, document: v1Doc() },
			tracks: null,
		});
		const byId = Object.fromEntries(
			result.segments.flatMap((s) => s.words).map((w) => [w.id, w]),
		);
		expect(byId.a.deleted).toBe(false);
		expect(byId.b.deleted).toBe(false);
	});
});
