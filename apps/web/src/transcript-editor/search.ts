import type { TranscriptDocument, TranscriptWord } from "./types";

export interface SearchMatch {
	wordIds: string[]; // contiguous run of word IDs that make up this match
	startSeconds: number;
}

/**
 * Find all matches of `query` in the transcript text. Match boundaries are
 * word-aligned: a query that spans multiple words returns the IDs of all
 * involved words.
 *
 * Case-insensitive. Whitespace in the query becomes a flexible separator
 * matching any non-letter run between words.
 */
export function findMatches({
	doc,
	query,
}: {
	doc: TranscriptDocument;
	query: string;
}): SearchMatch[] {
	const trimmed = query.trim();
	if (trimmed.length === 0) return [];

	const words: TranscriptWord[] = [];
	for (const segment of doc.segments) {
		for (const word of segment.words) {
			if (!word.deleted) words.push(word);
		}
	}
	if (words.length === 0) return [];

	// Build a single lowercased string of word texts, separated by spaces.
	// Track the char-offset of each word's start.
	let buffer = "";
	const offsets: number[] = [];
	const lengths: number[] = [];
	for (let i = 0; i < words.length; i++) {
		const text = words[i].text.trim().toLowerCase();
		offsets.push(buffer.length);
		lengths.push(text.length);
		buffer += text;
		if (i < words.length - 1) buffer += " ";
	}

	const needle = trimmed.toLowerCase().replace(/\s+/g, " ");
	const matches: SearchMatch[] = [];
	let cursor = 0;
	while (cursor < buffer.length) {
		const idx = buffer.indexOf(needle, cursor);
		if (idx === -1) break;
		const endIdx = idx + needle.length;

		// Find first/last word index whose char-range intersects [idx, endIdx).
		const firstWordIdx = findWordAtOffset({ offsets, lengths, charOffset: idx });
		const lastWordIdx = findWordAtOffset({
			offsets,
			lengths,
			charOffset: endIdx - 1,
		});

		if (firstWordIdx !== -1 && lastWordIdx !== -1) {
			const wordIds: string[] = [];
			for (let i = firstWordIdx; i <= lastWordIdx; i++) {
				wordIds.push(words[i].id);
			}
			matches.push({
				wordIds,
				startSeconds: words[firstWordIdx].start,
			});
		}

		cursor = idx + Math.max(1, needle.length);
	}

	return matches;
}

function findWordAtOffset({
	offsets,
	lengths,
	charOffset,
}: {
	offsets: number[];
	lengths: number[];
	charOffset: number;
}): number {
	for (let i = 0; i < offsets.length; i++) {
		const start = offsets[i];
		const end = start + lengths[i];
		if (charOffset >= start && charOffset < end) return i;
	}
	return -1;
}
