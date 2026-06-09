import { describe, it, expect } from "bun:test";
import { groupWordsIntoSegments, type RawChunk } from "../group-words";

const chunk = (
	text: string,
	start: number | null | undefined,
	end: number | null | undefined,
): RawChunk => ({ text, timestamp: [start, end] });

describe("groupWordsIntoSegments", () => {
	it("returns no segments for empty/undefined input", () => {
		expect(groupWordsIntoSegments({ chunks: undefined })).toEqual([]);
		expect(groupWordsIntoSegments({ chunks: [] })).toEqual([]);
	});

	it("trims Whisper's leading-space tokens and space-joins segment text", () => {
		// Whisper emits tokens like " Hello" / " world." with leading spaces.
		const segments = groupWordsIntoSegments({
			chunks: [chunk(" Hello", 0, 0.5), chunk(" world.", 0.5, 1)],
		});
		expect(segments).toHaveLength(1);
		expect(segments[0]!.text).toBe("Hello world.");
		expect(segments[0]!.words!.map((w) => w.text)).toEqual([
			"Hello",
			"world.",
		]);
	});

	it("drops whitespace-only tokens (they otherwise render as empty boxes)", () => {
		const segments = groupWordsIntoSegments({
			chunks: [
				chunk(" To", 0, 0.3),
				chunk("   ", 0.3, 0.35), // stray whitespace token
				chunk(" aim.", 0.35, 0.8),
			],
		});
		expect(segments[0]!.words!.map((w) => w.text)).toEqual(["To", "aim."]);
		expect(segments[0]!.text).toBe("To aim.");
	});

	it("skips chunks with missing/null timestamps", () => {
		const segments = groupWordsIntoSegments({
			chunks: [
				chunk(" ok", 0, 0.4),
				{ text: " bad", timestamp: undefined },
				chunk(" null", null, 1),
				chunk(" end.", 0.4, 0.9),
			],
		});
		expect(segments[0]!.words!.map((w) => w.text)).toEqual(["ok", "end."]);
	});

	it("clamps backwards timestamps so the timeline stays monotonic", () => {
		// Simulates the chunk-boundary bug: a later word reports an EARLIER start.
		const segments = groupWordsIntoSegments({
			chunks: [
				chunk(" practice", 48, 49),
				chunk(" room.", 40, 41), // backwards jump (49 -> 40)
			],
		});
		const words = segments.flatMap((s) => s.words ?? []);
		// starts/ends must be non-decreasing across the whole transcript
		for (let i = 1; i < words.length; i++) {
			expect(words[i]!.start).toBeGreaterThanOrEqual(words[i - 1]!.end);
		}
		// the backwards word is pinned to the previous end, not left at 40
		expect(words[1]!.start).toBe(49);
		expect(words[1]!.end).toBe(49); // end clamped up to start (was 41 < 49)
	});

	it("preserves real forward gaps (< split threshold) while clamping", () => {
		const segments = groupWordsIntoSegments({
			chunks: [chunk(" a", 0, 1), chunk(" b.", 1.5, 2)],
		});
		const [w0, w1] = segments[0]!.words!;
		expect(w0!.start).toBe(0);
		expect(w1!.start).toBe(1.5); // genuine gap kept, not collapsed to 1
		expect(w1!.end).toBe(2);
	});

	it("splits into a new segment on sentence-ending punctuation", () => {
		const segments = groupWordsIntoSegments({
			chunks: [
				chunk(" One", 0, 0.4),
				chunk(" two.", 0.4, 0.8),
				chunk(" Three", 0.9, 1.3),
				chunk(" four.", 1.3, 1.7),
			],
		});
		expect(segments).toHaveLength(2);
		expect(segments[0]!.text).toBe("One two.");
		expect(segments[1]!.text).toBe("Three four.");
	});

	it("splits on a long silent gap between words", () => {
		const segments = groupWordsIntoSegments({
			chunks: [
				chunk(" before", 0, 0.5),
				chunk(" after", 5, 5.5), // > 1s gap
			],
		});
		expect(segments).toHaveLength(2);
	});

	it("carries correct segment start/end from its first/last word", () => {
		const segments = groupWordsIntoSegments({
			chunks: [chunk(" hi", 2, 2.5), chunk(" there.", 2.5, 3.2)],
		});
		expect(segments[0]!.start).toBe(2);
		expect(segments[0]!.end).toBe(3.2);
	});
});
