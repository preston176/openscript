import type { TranscriptionSegment } from "@/transcription/types";

export interface TranscriptWord {
	id: string;
	text: string;
	start: number;
	end: number;
}

export interface TranscriptSegment {
	id: string;
	words: TranscriptWord[];
	start: number;
	end: number;
}

export interface TranscriptDocument {
	segments: TranscriptSegment[];
}

export function buildTranscriptDocument({
	segments,
}: {
	segments: TranscriptionSegment[];
}): TranscriptDocument {
	const result: TranscriptSegment[] = [];
	for (let s = 0; s < segments.length; s++) {
		const segment = segments[s];
		if (!segment.words || segment.words.length === 0) continue;
		const words: TranscriptWord[] = segment.words.map((word, w) => ({
			id: `s${s}-w${w}`,
			text: word.text,
			start: word.start,
			end: word.end,
		}));
		result.push({
			id: `s${s}`,
			words,
			start: segment.start,
			end: segment.end,
		});
	}
	return { segments: result };
}
