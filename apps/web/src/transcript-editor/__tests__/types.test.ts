import { describe, expect, test } from "bun:test";
import type { TranscriptionSegment } from "@/transcription/types";
import { buildTranscriptDocument } from "../types";

describe("buildTranscriptDocument", () => {
	const segments: TranscriptionSegment[] = [
		{
			text: "hello world",
			start: 0,
			end: 1,
			words: [
				{ text: "hello", start: 0, end: 0.5 },
				{ text: "world", start: 0.5, end: 1 },
			],
		},
	];

	test("initializes an empty deletedRanges log", () => {
		const doc = buildTranscriptDocument({ segments });
		expect(doc.deletedRanges).toEqual([]);
	});

	test("words carry no deleted flag initially", () => {
		const doc = buildTranscriptDocument({ segments });
		const words = doc.segments.flatMap((s) => s.words);
		expect(words).toHaveLength(2);
		expect(words.every((w) => w.deleted === undefined)).toBe(true);
		expect(words[0]).toMatchObject({ id: "s0-w0", text: "hello", start: 0, end: 0.5 });
	});

	test("skips segments with no words", () => {
		const doc = buildTranscriptDocument({
			segments: [{ text: "", start: 0, end: 0, words: [] }, ...segments],
		});
		expect(doc.segments).toHaveLength(1);
	});
});
