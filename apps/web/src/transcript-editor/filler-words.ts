import type { TranscriptDocument, TranscriptWord } from "./types";

const FILLER_WORDS = new Set([
	"um",
	"uh",
	"uhh",
	"umm",
	"er",
	"erm",
	"ah",
	"hmm",
	"like",
	"basically",
	"literally",
	"actually",
	"so",
	"right",
	"okay",
	"ok",
]);

const FILLER_PHRASES: string[][] = [
	["you", "know"],
	["i", "mean"],
	["sort", "of"],
	["kind", "of"],
];

/**
 * Strip leading/trailing whitespace and punctuation, lowercase.
 * Whisper word output usually carries a leading space (" um") and may have
 * trailing punctuation (" um,").
 */
function normalize(text: string): string {
	return text.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

/**
 * Find filler words and short filler phrases in a transcript.
 *
 * Returns a flat list of word IDs to remove. For multi-word phrases (e.g.
 * "you know"), all matched word IDs are included.
 *
 * Conservative: only flags words that are *entirely* filler. "So" is flagged
 * standalone but "Sometimes" is not (the lemma must equal the filler).
 */
export function findFillerWords({
	doc,
	deletedWordIds,
}: {
	doc: TranscriptDocument;
	deletedWordIds: ReadonlySet<string>;
}): Set<string> {
	const allWords: TranscriptWord[] = [];
	for (const segment of doc.segments) {
		for (const word of segment.words) {
			if (!deletedWordIds.has(word.id)) allWords.push(word);
		}
	}

	const flagged = new Set<string>();

	for (let i = 0; i < allWords.length; i++) {
		const word = allWords[i];
		const lemma = normalize(word.text);

		// Multi-word phrases first — match longest possible at this index.
		let matchedPhrase = false;
		for (const phrase of FILLER_PHRASES) {
			if (i + phrase.length > allWords.length) continue;
			let matches = true;
			for (let j = 0; j < phrase.length; j++) {
				if (normalize(allWords[i + j].text) !== phrase[j]) {
					matches = false;
					break;
				}
			}
			if (matches) {
				for (let j = 0; j < phrase.length; j++) {
					flagged.add(allWords[i + j].id);
				}
				i += phrase.length - 1; // skip past the phrase
				matchedPhrase = true;
				break;
			}
		}
		if (matchedPhrase) continue;

		if (FILLER_WORDS.has(lemma)) {
			flagged.add(word.id);
		}
	}

	return flagged;
}
