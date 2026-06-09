import type { TranscriptionSegment, TranscriptionWord } from "./types";

/** A raw word chunk as produced by Whisper's `return_timestamps: "word"`. */
export interface RawChunk {
	text: string;
	timestamp?: [number | null | undefined, number | null | undefined];
}

const SENTENCE_END = /[.!?]$/;
const MAX_GAP_SECONDS = 1.0;
const MAX_WORDS_PER_SEGMENT = 20;

/**
 * Turn Whisper word chunks into sentence-ish segments, normalizing the two
 * things Whisper gets wrong over chunked/stride long-form audio:
 *
 *  1. Each token carries a leading space and some chunks are whitespace-only —
 *     we trim every token and drop empties (empties otherwise render as empty
 *     clickable boxes, and the leading spaces break word-by-word rendering).
 *  2. Word timestamps can jump backwards at chunk boundaries (the stride
 *     overlap is transcribed twice), which scrambles click-to-seek. We clamp
 *     each word to start no earlier than the previous word ended, keeping the
 *     timeline monotonic.
 */
export function groupWordsIntoSegments({
	chunks,
}: {
	chunks: RawChunk[] | undefined;
}): TranscriptionSegment[] {
	if (!chunks || chunks.length === 0) return [];

	const words: TranscriptionWord[] = [];
	let prevEnd = 0;
	for (const chunk of chunks) {
		if (!chunk.timestamp || chunk.timestamp.length < 2) continue;
		const rawStart = chunk.timestamp[0];
		const rawEnd = chunk.timestamp[1] ?? rawStart;
		if (rawStart == null || rawEnd == null) continue;
		const text = chunk.text.trim();
		if (text.length === 0) continue;
		const start = Math.max(rawStart, prevEnd);
		const end = Math.max(rawEnd, start);
		prevEnd = end;
		words.push({ text, start, end });
	}

	if (words.length === 0) return [];

	const segments: TranscriptionSegment[] = [];
	let buffer: TranscriptionWord[] = [];
	const flush = () => {
		if (buffer.length === 0) return;
		segments.push({
			// Tokens are already trimmed, so join with single spaces.
			text: buffer.map((w) => w.text).join(" "),
			start: buffer[0].start,
			end: buffer[buffer.length - 1].end,
			words: buffer,
		});
		buffer = [];
	};

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		buffer.push(word);
		const next = words[i + 1];
		const gap = next ? next.start - word.end : 0;
		const endsSentence = SENTENCE_END.test(word.text);
		if (
			endsSentence ||
			gap > MAX_GAP_SECONDS ||
			buffer.length >= MAX_WORDS_PER_SEGMENT
		) {
			flush();
		}
	}
	flush();
	return segments;
}
