"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useEditor } from "@/editor/use-editor";
import { extractTimelineAudio } from "@/media/mediabunny";
import { decodeAudioToFloat32 } from "@/media/audio";
import { transcriptionService } from "@/services/transcription/service";
import { DEFAULT_TRANSCRIPTION_SAMPLE_RATE } from "@/transcription/audio";
import type { TranscriptionProgress } from "@/transcription/types";
import { cn } from "@/utils/ui";
import { mediaTimeFromSeconds } from "@/wasm";
import {
	buildTranscriptDocument,
	type TranscriptDocument,
} from "./types";
import { applyTranscriptDeletions, type WordRange } from "./apply-deletion";

type Status =
	| { kind: "idle" }
	| { kind: "working"; step: string }
	| { kind: "ready" }
	| { kind: "error"; message: string };

export function TranscriptPanel() {
	const editor = useEditor();
	const [doc, setDoc] = useState<TranscriptDocument | null>(null);
	const [status, setStatus] = useState<Status>({ kind: "idle" });
	const [selection, setSelection] = useState<Set<string>>(new Set());

	const onProgress = useCallback((progress: TranscriptionProgress) => {
		if (progress.status === "loading-model") {
			setStatus({
				kind: "working",
				step: `Loading model ${Math.round(progress.progress)}%`,
			});
		} else if (progress.status === "transcribing") {
			setStatus({ kind: "working", step: "Transcribing..." });
		}
	}, []);

	const generate = useCallback(async () => {
		setStatus({ kind: "working", step: "Extracting audio..." });
		setSelection(new Set());
		try {
			const audioBlob = await extractTimelineAudio({
				tracks: editor.scenes.getActiveScene().tracks,
				mediaAssets: editor.media.getAssets(),
				totalDuration: editor.timeline.getTotalDuration(),
			});
			setStatus({ kind: "working", step: "Preparing audio..." });
			const { samples } = await decodeAudioToFloat32({
				audioBlob,
				sampleRate: DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
			});
			const result = await transcriptionService.transcribe({
				audioData: samples,
				onProgress,
			});
			const document = buildTranscriptDocument({ segments: result.segments });
			if (document.segments.length === 0) {
				setStatus({
					kind: "error",
					message:
						"Transcription returned no word-level timing. Try a different model or longer audio.",
				});
				return;
			}
			setDoc(document);
			setStatus({ kind: "ready" });
		} catch (error) {
			setStatus({
				kind: "error",
				message:
					error instanceof Error ? error.message : "Transcription failed",
			});
		}
	}, [editor, onProgress]);

	const toggleWord = useCallback((wordId: string) => {
		setSelection((prev) => {
			const next = new Set(prev);
			if (next.has(wordId)) next.delete(wordId);
			else next.add(wordId);
			return next;
		});
	}, []);

	const seekToWord = useCallback(
		(seconds: number) => {
			editor.playback.seek({ time: mediaTimeFromSeconds({ seconds }) });
		},
		[editor],
	);

	const selectedRanges = useMemo<WordRange[]>(() => {
		if (!doc) return [];
		const ranges: WordRange[] = [];
		for (const segment of doc.segments) {
			for (const word of segment.words) {
				if (selection.has(word.id) && !word.deleted) {
					ranges.push({ startSeconds: word.start, endSeconds: word.end });
				}
			}
		}
		return ranges;
	}, [doc, selection]);

	const deleteSelected = useCallback(() => {
		if (!doc || selectedRanges.length === 0) return;
		applyTranscriptDeletions({ editor, ranges: selectedRanges });
		setDoc((prev) => {
			if (!prev) return prev;
			return {
				segments: prev.segments.map((segment) => ({
					...segment,
					words: segment.words.map((word) =>
						selection.has(word.id) ? { ...word, deleted: true } : word,
					),
				})),
			};
		});
		setSelection(new Set());
	}, [doc, editor, selection, selectedRanges]);

	return (
		<div className="panel bg-background flex h-full flex-col overflow-hidden rounded-sm border">
			<div className="border-b px-3 py-2 flex items-center justify-between gap-2">
				<h3 className="text-sm font-medium">Transcript</h3>
				{doc && status.kind === "ready" && (
					<Button
						size="sm"
						variant="destructive-foreground"
						disabled={selectedRanges.length === 0}
						onClick={deleteSelected}
					>
						Delete {selectedRanges.length || ""} word
						{selectedRanges.length === 1 ? "" : "s"}
					</Button>
				)}
			</div>
			<ScrollArea className="flex-1">
				<div className="p-3">
					{status.kind === "idle" && !doc && (
						<EmptyState onGenerate={generate} />
					)}
					{status.kind === "working" && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Spinner className="size-4" />
							<span>{status.step}</span>
						</div>
					)}
					{status.kind === "error" && (
						<div className="space-y-2">
							<p className="text-destructive text-sm">{status.message}</p>
							<Button size="sm" onClick={generate}>
								Try again
							</Button>
						</div>
					)}
					{doc && (status.kind === "ready" || status.kind === "idle") && (
						<TranscriptView
							doc={doc}
							selection={selection}
							onToggleWord={toggleWord}
							onSeekToWord={seekToWord}
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center text-center gap-3 py-8">
			<p className="text-sm text-muted-foreground max-w-xs">
				Transcribe the timeline audio so you can edit the video by editing the
				text. Click a word to select it, then delete to cut that range from the
				timeline.
			</p>
			<Button size="sm" onClick={onGenerate}>
				Generate transcript
			</Button>
		</div>
	);
}

function TranscriptView({
	doc,
	selection,
	onToggleWord,
	onSeekToWord,
}: {
	doc: TranscriptDocument;
	selection: Set<string>;
	onToggleWord: (wordId: string) => void;
	onSeekToWord: (seconds: number) => void;
}) {
	return (
		<div className="space-y-3 leading-relaxed">
			{doc.segments.map((segment) => (
				<p key={segment.id} className="text-sm">
					{segment.words.map((word) => {
						const isSelected = selection.has(word.id);
						return (
							<button
								key={word.id}
								type="button"
								onClick={(event) => {
									if (event.shiftKey || event.metaKey || event.ctrlKey) {
										onToggleWord(word.id);
									} else {
										onSeekToWord(word.start);
									}
								}}
								onDoubleClick={() => onToggleWord(word.id)}
								className={cn(
									"inline cursor-pointer rounded-sm px-0.5 transition-colors",
									word.deleted &&
										"line-through text-muted-foreground/50 cursor-not-allowed",
									!word.deleted &&
										isSelected &&
										"bg-destructive/30 text-destructive-foreground",
									!word.deleted &&
										!isSelected &&
										"hover:bg-accent hover:text-accent-foreground",
								)}
								aria-pressed={isSelected}
								disabled={word.deleted}
							>
								{word.text}
							</button>
						);
					})}
				</p>
			))}
		</div>
	);
}
