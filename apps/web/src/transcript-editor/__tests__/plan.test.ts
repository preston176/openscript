import { describe, expect, test } from "bun:test";
import type { AudioElement, AudioTrack, SceneTracks, VideoTrack } from "@/timeline";
import { mediaTimeFromSeconds, ZERO_MEDIA_TIME } from "@/wasm";
import { planTranscriptDelete, planTranscriptRestore } from "../plan";
import type { TranscriptDocument } from "../types";

// An audio element spanning [0s, 10s) so word source-seconds map onto it.
function tracks10s(): SceneTracks {
	const element: AudioElement = {
		id: "clip",
		type: "audio",
		name: "clip",
		startTime: ZERO_MEDIA_TIME,
		duration: mediaTimeFromSeconds({ seconds: 10 }),
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		params: { volume: 1, muted: false },
		sourceType: "upload",
		mediaId: "media-clip",
	};
	const audioTrack: AudioTrack = { id: "a1", type: "audio", name: "a1", elements: [element], muted: false };
	const main: VideoTrack = { id: "video-main", type: "video", name: "main", elements: [], muted: false, hidden: false };
	return { overlay: [], main, audio: [audioTrack] };
}

// Two words: "a" [0s,5s), "b" [5s,10s).
function doc2words(): TranscriptDocument {
	return {
		segments: [
			{
				id: "s0",
				start: 0,
				end: 10,
				words: [
					{ id: "a", text: "a", start: 0, end: 5 },
					{ id: "b", text: "b", start: 5, end: 10 },
				],
			},
		],
		deletedRanges: [],
	};
}

function words(doc: TranscriptDocument) {
	return Object.fromEntries(
		doc.segments.flatMap((s) => s.words).map((w) => [w.id, w]),
	);
}

describe("planTranscriptDelete / planTranscriptRestore", () => {
	test("delete marks the word, records a DeletedRange, and ripple-closes", () => {
		const plan = planTranscriptDelete({
			tracks: tracks10s(),
			doc: doc2words(),
			runs: [{ wordIds: ["b"], startSeconds: 5, endSeconds: 10 }],
		});
		const w = words(plan.afterDoc);
		expect(w.b.deleted).toBe(true);
		expect(w.a.deleted).toBeUndefined();
		expect(plan.afterDoc.deletedRanges).toHaveLength(1);
		expect(plan.afterDoc.deletedRanges[0].wordIds).toEqual(["b"]);
		// only the left half [0s,5s) survives on the timeline
		const els = plan.afterTracks.audio[0].elements;
		expect(els).toHaveLength(1);
		expect(Number(els[0].duration)).toBe(mediaTimeFromSeconds({ seconds: 5 }));
	});

	test("restore un-marks the word, drops the range, and re-opens the gap", () => {
		const deleted = planTranscriptDelete({
			tracks: tracks10s(),
			doc: doc2words(),
			runs: [{ wordIds: ["b"], startSeconds: 5, endSeconds: 10 }],
		});
		const rangeId = deleted.afterDoc.deletedRanges[0].id;

		const restored = planTranscriptRestore({
			tracks: deleted.afterTracks,
			doc: deleted.afterDoc,
			rangeId,
		});
		const w = words(restored.afterDoc);
		expect(w.b.deleted).toBe(false);
		expect(restored.afterDoc.deletedRanges).toHaveLength(0);
		// timeline covers [0s,10s) again, contiguous
		const els = restored.afterTracks.audio[0].elements;
		let cursor = 0;
		for (const el of els) {
			expect(Number(el.startTime)).toBe(cursor);
			cursor += Number(el.duration);
		}
		expect(cursor).toBe(mediaTimeFromSeconds({ seconds: 10 }));
	});

	test("unknown rangeId is a no-op", () => {
		const doc = doc2words();
		const tracks = tracks10s();
		const plan = planTranscriptRestore({ tracks, doc, rangeId: "nope" });
		expect(plan.afterDoc).toBe(doc);
		expect(plan.afterTracks).toBe(tracks);
	});
});
