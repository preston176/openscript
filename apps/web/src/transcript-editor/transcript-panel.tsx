"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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
import { mediaTimeFromSeconds, mediaTimeToSeconds } from "@/wasm";
import {
	buildTranscriptDocument,
	type TranscriptDocument,
	type TranscriptWord,
} from "./types";
import { applyTranscriptDeletions, type WordRange } from "./apply-deletion";
import { findFillerWords } from "./filler-words";
import { findMatches, type SearchMatch } from "./search";

type Status =
	| { kind: "idle" }
	| { kind: "working"; step: string }
	| { kind: "ready" }
	| { kind: "error"; message: string };

export function TranscriptPanel() {
	const editor = useEditor();
	const currentTimeTicks = useEditor((e) => e.playback.getCurrentTime());
	const [doc, setDoc] = useState<TranscriptDocument | null>(null);
	const [status, setStatus] = useState<Status>({ kind: "idle" });
	const [selection, setSelection] = useState<Set<string>>(new Set());
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeMatchIdx, setActiveMatchIdx] = useState(0);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

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
		setLastSelectedId(null);
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

	const flatWords = useMemo(() => {
		if (!doc) return [] as TranscriptWord[];
		return doc.segments.flatMap((s) => s.words);
	}, [doc]);

	const seekToWord = useCallback(
		(seconds: number) => {
			editor.playback.seek({ time: mediaTimeFromSeconds({ seconds }) });
		},
		[editor],
	);

	const selectRange = useCallback(
		(fromId: string, toId: string) => {
			if (!doc) return;
			const fromIdx = flatWords.findIndex((w) => w.id === fromId);
			const toIdx = flatWords.findIndex((w) => w.id === toId);
			if (fromIdx === -1 || toIdx === -1) return;
			const [lo, hi] =
				fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
			setSelection((prev) => {
				const next = new Set(prev);
				for (let i = lo; i <= hi; i++) {
					if (!flatWords[i].deleted) next.add(flatWords[i].id);
				}
				return next;
			});
		},
		[doc, flatWords],
	);

	const toggleWord = useCallback((wordId: string) => {
		setSelection((prev) => {
			const next = new Set(prev);
			if (next.has(wordId)) next.delete(wordId);
			else next.add(wordId);
			return next;
		});
	}, []);

	const handleWordClick = useCallback(
		(word: TranscriptWord, event: React.MouseEvent) => {
			if (event.shiftKey && lastSelectedId) {
				event.preventDefault();
				selectRange(lastSelectedId, word.id);
				setLastSelectedId(word.id);
				return;
			}
			if (event.metaKey || event.ctrlKey) {
				toggleWord(word.id);
				setLastSelectedId(word.id);
				return;
			}
			// Plain click: seek and set as the range anchor for subsequent shift-clicks.
			seekToWord(word.start);
			setLastSelectedId(word.id);
		},
		[lastSelectedId, selectRange, toggleWord, seekToWord],
	);

	const handleWordDoubleClick = useCallback(
		(word: TranscriptWord) => {
			toggleWord(word.id);
			setLastSelectedId(word.id);
		},
		[toggleWord],
	);

	const fillerWordIds = useMemo(() => {
		if (!doc) return new Set<string>();
		return findFillerWords({ doc });
	}, [doc]);

	const searchResults = useMemo<SearchMatch[]>(() => {
		if (!doc || !searchOpen || searchQuery.trim().length === 0) return [];
		return findMatches({ doc, query: searchQuery });
	}, [doc, searchOpen, searchQuery]);

	const searchMatchedWordIds = useMemo(() => {
		const ids = new Set<string>();
		for (const match of searchResults) {
			for (const id of match.wordIds) ids.add(id);
		}
		return ids;
	}, [searchResults]);

	const activeMatchWordIds = useMemo(() => {
		const ids = new Set<string>();
		const active = searchResults[activeMatchIdx];
		if (active) {
			for (const id of active.wordIds) ids.add(id);
		}
		return ids;
	}, [searchResults, activeMatchIdx]);

	const selectedRanges = useMemo<WordRange[]>(() => {
		if (!doc) return [];
		const ranges: WordRange[] = [];
		for (const word of flatWords) {
			if (selection.has(word.id) && !word.deleted) {
				ranges.push({ startSeconds: word.start, endSeconds: word.end });
			}
		}
		return ranges;
	}, [doc, flatWords, selection]);

	const fillerRanges = useMemo<WordRange[]>(() => {
		if (!doc) return [];
		return flatWords
			.filter((w) => fillerWordIds.has(w.id) && !w.deleted)
			.map((w) => ({ startSeconds: w.start, endSeconds: w.end }));
	}, [doc, flatWords, fillerWordIds]);

	const applyDeletion = useCallback(
		(ranges: WordRange[], idsToMark: Set<string>) => {
			if (ranges.length === 0) return;
			applyTranscriptDeletions({ editor, ranges });
			setDoc((prev) => {
				if (!prev) return prev;
				return {
					segments: prev.segments.map((segment) => ({
						...segment,
						words: segment.words.map((word) =>
							idsToMark.has(word.id) ? { ...word, deleted: true } : word,
						),
					})),
				};
			});
			setSelection(new Set());
			setLastSelectedId(null);
		},
		[editor],
	);

	const deleteSelected = useCallback(() => {
		applyDeletion(selectedRanges, selection);
	}, [applyDeletion, selectedRanges, selection]);

	const removeFillers = useCallback(() => {
		applyDeletion(fillerRanges, fillerWordIds);
	}, [applyDeletion, fillerRanges, fillerWordIds]);

	const jumpToMatch = useCallback(
		(idx: number) => {
			const match = searchResults[idx];
			if (!match) return;
			seekToWord(match.startSeconds);
		},
		[searchResults, seekToWord],
	);

	const cycleMatch = useCallback(
		(direction: 1 | -1) => {
			if (searchResults.length === 0) return;
			const next =
				(activeMatchIdx + direction + searchResults.length) %
				searchResults.length;
			setActiveMatchIdx(next);
			jumpToMatch(next);
		},
		[searchResults, activeMatchIdx, jumpToMatch],
	);

	useEffect(() => {
		setActiveMatchIdx(0);
	}, [searchQuery]);

	// Cmd+F opens search; Esc closes it.
	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "f") {
				event.preventDefault();
				setSearchOpen(true);
				queueMicrotask(() => searchInputRef.current?.focus());
			} else if (event.key === "Escape" && searchOpen) {
				setSearchOpen(false);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [searchOpen]);

	const currentTimeSeconds = mediaTimeToSeconds({ time: currentTimeTicks });
	const activeWordId = useMemo(() => {
		if (!doc) return null;
		for (const word of flatWords) {
			if (
				!word.deleted &&
				currentTimeSeconds >= word.start &&
				currentTimeSeconds < word.end
			) {
				return word.id;
			}
		}
		return null;
	}, [doc, flatWords, currentTimeSeconds]);

	// Auto-scroll active word into view.
	useEffect(() => {
		if (!activeWordId) return;
		const el = scrollContainerRef.current?.querySelector(
			`[data-word-id="${activeWordId}"]`,
		);
		if (el && el instanceof HTMLElement) {
			el.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
	}, [activeWordId]);

	const fillerCount = fillerRanges.length;

	return (
		<div className="panel bg-background flex h-full flex-col overflow-hidden rounded-sm border">
			<div className="border-b px-3 py-2 flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-sm font-medium">Transcript</h3>
				{doc && status.kind === "ready" && (
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							size="sm"
							variant="text"
							onClick={() => {
								setSearchOpen((v) => !v);
								queueMicrotask(() => searchInputRef.current?.focus());
							}}
							title="Find (Cmd+F)"
						>
							Find
						</Button>
						{fillerCount > 0 && (
							<Button
								size="sm"
								variant="text"
								onClick={removeFillers}
								title="Remove all detected filler words"
							>
								Remove {fillerCount} filler{fillerCount === 1 ? "" : "s"}
							</Button>
						)}
						<Button
							size="sm"
							variant="destructive-foreground"
							disabled={selectedRanges.length === 0}
							onClick={deleteSelected}
						>
							Delete{" "}
							{selectedRanges.length > 0 ? selectedRanges.length : ""} word
							{selectedRanges.length === 1 ? "" : "s"}
						</Button>
					</div>
				)}
			</div>
			{searchOpen && doc && (
				<div className="border-b px-3 py-1.5 flex items-center gap-2 text-xs">
					<input
						ref={searchInputRef}
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								cycleMatch(e.shiftKey ? -1 : 1);
							} else if (e.key === "Escape") {
								setSearchOpen(false);
							}
						}}
						placeholder="Find in transcript..."
						className="flex-1 bg-muted/30 px-2 py-1 rounded-sm outline-none focus:ring-1 focus:ring-ring"
					/>
					<span className="text-muted-foreground tabular-nums">
						{searchResults.length === 0
							? "0/0"
							: `${activeMatchIdx + 1}/${searchResults.length}`}
					</span>
					<button
						type="button"
						onClick={() => cycleMatch(-1)}
						className="text-muted-foreground hover:text-foreground px-1"
						aria-label="Previous match"
					>
						↑
					</button>
					<button
						type="button"
						onClick={() => cycleMatch(1)}
						className="text-muted-foreground hover:text-foreground px-1"
						aria-label="Next match"
					>
						↓
					</button>
					<button
						type="button"
						onClick={() => setSearchOpen(false)}
						className="text-muted-foreground hover:text-foreground px-1"
						aria-label="Close search"
					>
						✕
					</button>
				</div>
			)}
			<ScrollArea className="flex-1">
				<div ref={scrollContainerRef} className="px-6 py-6 max-w-prose mx-auto">
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
							activeWordId={activeWordId}
							fillerWordIds={fillerWordIds}
							searchMatchedWordIds={searchMatchedWordIds}
							activeMatchWordIds={activeMatchWordIds}
							onWordClick={handleWordClick}
							onWordDoubleClick={handleWordDoubleClick}
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
				text. Click a word to seek; shift-click to select a range; Cmd+F to
				find.
			</p>
			<Button size="sm" onClick={onGenerate}>
				Generate transcript
			</Button>
		</div>
	);
}

function formatTimestamp(seconds: number): string {
	const total = Math.floor(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function TranscriptView({
	doc,
	selection,
	activeWordId,
	fillerWordIds,
	searchMatchedWordIds,
	activeMatchWordIds,
	onWordClick,
	onWordDoubleClick,
}: {
	doc: TranscriptDocument;
	selection: Set<string>;
	activeWordId: string | null;
	fillerWordIds: Set<string>;
	searchMatchedWordIds: Set<string>;
	activeMatchWordIds: Set<string>;
	onWordClick: (word: TranscriptWord, event: React.MouseEvent) => void;
	onWordDoubleClick: (word: TranscriptWord) => void;
}) {
	return (
		<div className="space-y-5 leading-[1.9] text-[15px]">
			{doc.segments.map((segment) => (
				<div key={segment.id} className="grid grid-cols-[3.5rem_1fr] gap-3">
					<div className="text-muted-foreground/70 text-xs tabular-nums pt-1 select-none">
						{formatTimestamp(segment.start)}
					</div>
					<p>
						{segment.words.map((word) => {
							const isSelected = selection.has(word.id);
							const isActive = activeWordId === word.id;
							const isFiller = fillerWordIds.has(word.id);
							const isMatch = searchMatchedWordIds.has(word.id);
							const isActiveMatch = activeMatchWordIds.has(word.id);
							return (
								<button
									key={word.id}
									type="button"
									data-word-id={word.id}
									onClick={(event) => onWordClick(word, event)}
									onDoubleClick={() => onWordDoubleClick(word)}
									className={cn(
										"inline cursor-pointer rounded-sm transition-colors",
										word.deleted &&
											"line-through text-muted-foreground/40 cursor-not-allowed",
										!word.deleted &&
											isActiveMatch &&
											"bg-yellow-400/60 text-foreground",
										!word.deleted &&
											isMatch &&
											!isActiveMatch &&
											"bg-yellow-300/30",
										!word.deleted &&
											isSelected &&
											!isMatch &&
											"bg-destructive/30 text-destructive-foreground",
										!word.deleted &&
											isActive &&
											!isSelected &&
											!isMatch &&
											"bg-accent text-accent-foreground",
										!word.deleted &&
											isFiller &&
											!isSelected &&
											!isActive &&
											!isMatch &&
											"underline decoration-amber-500/60 decoration-dotted underline-offset-2",
										!word.deleted &&
											!isSelected &&
											!isActive &&
											!isMatch &&
											!isFiller &&
											"hover:bg-accent/40",
									)}
									aria-pressed={isSelected}
									disabled={word.deleted}
								>
									{word.text}
								</button>
							);
						})}
					</p>
				</div>
			))}
		</div>
	);
}
