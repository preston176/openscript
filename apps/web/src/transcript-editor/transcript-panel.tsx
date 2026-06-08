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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useEditor } from "@/editor/use-editor";
import { extractTimelineAudio } from "@/media/mediabunny";
import { decodeAudioToFloat32, timelineHasAudio } from "@/media/audio";
import { transcriptionService } from "@/services/transcription/service";
import { storageService } from "@/services/storage/service";
import { DEFAULT_TRANSCRIPTION_SAMPLE_RATE } from "@/transcription/audio";
import { LANGUAGES } from "@/transcription/languages";
import {
	DEFAULT_TRANSCRIPTION_MODEL,
	TRANSCRIPTION_MODELS,
} from "@/transcription/models";
import type {
	TranscriptionLanguage,
	TranscriptionModelId,
	TranscriptionProgress,
} from "@/transcription/types";
import { cn } from "@/utils/ui";
import {
	buildTranscriptDocument,
	type TranscriptDocument,
	type TranscriptWord,
} from "./types";
import { buildWordTimeline, sourceToTimeline } from "./mapping";
import { migrateTranscript } from "./migrate";
import type { DeletionRun } from "./plan";
import { dispatchTranscriptEdit } from "./transcript-edit-command";
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
	// The transcript document is owned by the editor's TranscriptStore so the
	// undoable TranscriptEditCommand can mutate it from global undo/redo; the
	// panel reads it reactively here.
	const doc = useEditor((e) => e.transcript.getDoc());
	const [status, setStatus] = useState<Status>({ kind: "idle" });
	const [modelId, setModelId] = useState<TranscriptionModelId>(
		DEFAULT_TRANSCRIPTION_MODEL,
	);
	const [language, setLanguage] = useState<TranscriptionLanguage>("auto");
	const [selection, setSelection] = useState<Set<string>>(new Set());
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeMatchIdx, setActiveMatchIdx] = useState(0);
	const [editingWordId, setEditingWordId] = useState<string | null>(null);
	const [editingText, setEditingText] = useState("");
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
		const scene = editor.scenes.getActiveSceneOrNull();
		const mediaAssets = editor.media.getAssets();
		if (!scene || !timelineHasAudio({ tracks: scene.tracks, mediaAssets })) {
			setStatus({
				kind: "error",
				message:
					"This timeline has no audio to transcribe. Add a clip with audio first.",
			});
			return;
		}
		setStatus({ kind: "working", step: "Extracting audio..." });
		setSelection(new Set());
		setLastSelectedId(null);
		try {
			const audioBlob = await extractTimelineAudio({
				tracks: scene.tracks,
				mediaAssets,
				totalDuration: editor.timeline.getTotalDuration(),
			});
			setStatus({ kind: "working", step: "Preparing audio..." });
			const { samples } = await decodeAudioToFloat32({
				audioBlob,
				sampleRate: DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
			});
			const result = await transcriptionService.transcribe({
				audioData: samples,
				modelId,
				language,
				onProgress,
			});
			const document = buildTranscriptDocument({ segments: result.segments });
			if (document.segments.length === 0) {
				const recognized = result.text?.trim();
				setStatus({
					kind: "error",
					message: recognized
						? `No word-level timing came back, so editing isn't available. Recognized text: "${recognized}"`
						: "Transcription returned no word-level timing. Try a different model or longer audio.",
				});
				return;
			}
			editor.transcript.setDoc(document);
			setStatus({ kind: "ready" });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Transcription failed";
			// Cancellation is a user action, not an error — return to the start.
			if (/cancel/i.test(message)) {
				setStatus({ kind: "idle" });
				return;
			}
			setStatus({ kind: "error", message });
		}
	}, [editor, onProgress, modelId, language]);

	const cancelGeneration = useCallback(() => {
		transcriptionService.cancel();
	}, []);

	// Rehydrate a previously-generated transcript for this project on mount. The
	// panel is conditionally mounted (tab toggle) with component-local state, so
	// without this the transcript would be lost on every remount/reload even
	// though the timeline edits persist. Only text + timings are restored; the
	// deleted state is re-derived from the loaded timeline coverage.
	useEffect(() => {
		// Already hydrated (e.g. returning to the tab): just reflect it.
		if (editor.transcript.getDoc()) {
			setStatus({ kind: "ready" });
			return;
		}
		const projectId = editor.project.getActiveOrNull()?.metadata.id;
		if (!projectId) return;
		let cancelled = false;
		void storageService.loadTranscript({ projectId }).then((stored) => {
			if (cancelled || !stored) return;
			const tracks = editor.scenes.getActiveSceneOrNull()?.tracks ?? null;
			editor.transcript.setDoc(migrateTranscript({ stored, tracks }));
			setStatus({ kind: "ready" });
		});
		return () => {
			cancelled = true;
		};
	}, [editor]);

	const flatWords = useMemo(() => {
		if (!doc) return [] as TranscriptWord[];
		return doc.segments.flatMap((s) => s.words);
	}, [doc]);

	// Deleted state is STORED on each word (the cut is destructive + rippled), so
	// it survives undo/redo (the command reverts the flag) and reload.
	const deletedWordIds = useMemo(() => {
		const ids = new Set<string>();
		for (const word of flatWords) {
			if (word.deleted) ids.add(word.id);
		}
		return ids;
	}, [flatWords]);

	// Current timeline position of each word (source time minus removed cuts
	// before it), for seek + the active-word highlight.
	const wordTimeline = useMemo(
		() => buildWordTimeline(doc ?? { segments: [], deletedRanges: [] }),
		[doc],
	);

	// word id -> owning DeletedRange id, for click-to-restore. Pre-v2 cuts (no
	// captured media) are excluded, so their words stay non-restorable.
	const rangeByWordId = useMemo(() => {
		const map = new Map<string, string>();
		if (!doc) return map;
		for (const range of doc.deletedRanges) {
			if (range.removed.length === 0) continue;
			for (const id of range.wordIds) map.set(id, range.id);
		}
		return map;
	}, [doc]);

	const seekToSource = useCallback(
		(sourceSeconds: number) => {
			editor.playback.seek({
				time: sourceToTimeline({
					sourceSeconds,
					deletedRanges: doc?.deletedRanges ?? [],
				}),
			});
		},
		[editor, doc],
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
					if (!deletedWordIds.has(flatWords[i].id)) next.add(flatWords[i].id);
				}
				return next;
			});
		},
		[doc, flatWords, deletedWordIds],
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
			// Clicking a struck-through word restores its whole cut (if restorable).
			if (deletedWordIds.has(word.id)) {
				const rangeId = rangeByWordId.get(word.id);
				if (rangeId) {
					dispatchTranscriptEdit({ editor, edit: { kind: "restore", rangeId } });
				}
				return;
			}
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
			seekToSource(word.start);
			setLastSelectedId(word.id);
		},
		[
			deletedWordIds,
			rangeByWordId,
			editor,
			lastSelectedId,
			selectRange,
			toggleWord,
			seekToSource,
		],
	);

	// Double-click a word to correct its text. This is a transcript-only edit:
	// it changes the displayed/exported text, not the timeline or word timing.
	const handleWordDoubleClick = useCallback((word: TranscriptWord) => {
		if (word.deleted) return;
		setEditingWordId(word.id);
		setEditingText(word.text);
		setLastSelectedId(word.id);
	}, []);

	const cancelWordEdit = useCallback(() => {
		setEditingWordId(null);
	}, []);

	const commitWordEdit = useCallback(() => {
		if (editingWordId === null) return;
		if (!doc) {
			setEditingWordId(null);
			return;
		}
		const targetId = editingWordId;
		const nextText = editingText;
		const next: TranscriptDocument = {
			...doc,
			segments: doc.segments.map((segment) => ({
				...segment,
				words: segment.words.map((word) =>
					word.id === targetId ? { ...word, text: nextText } : word,
				),
			})),
		};
		editor.transcript.setDoc(next);
		setEditingWordId(null);
	}, [editingWordId, editingText, doc, editor]);

	const fillerWordIds = useMemo(() => {
		if (!doc) return new Set<string>();
		return findFillerWords({ doc, deletedWordIds });
	}, [doc, deletedWordIds]);

	const searchResults = useMemo<SearchMatch[]>(() => {
		if (!doc || !searchOpen || searchQuery.trim().length === 0) return [];
		return findMatches({ doc, query: searchQuery, deletedWordIds });
	}, [doc, searchOpen, searchQuery, deletedWordIds]);

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

	// Group a set of word ids into contiguous runs (consecutive in transcript
	// order, skipping already-deleted words). Each run becomes one cut/DeletedRange.
	const buildRuns = useCallback(
		(ids: ReadonlySet<string>): DeletionRun[] => {
			const runs: DeletionRun[] = [];
			let current: DeletionRun | null = null;
			for (const word of flatWords) {
				if (ids.has(word.id) && !word.deleted) {
					if (current) {
						current.wordIds.push(word.id);
						current.endSeconds = word.end;
					} else {
						current = {
							wordIds: [word.id],
							startSeconds: word.start,
							endSeconds: word.end,
						};
					}
				} else if (current) {
					runs.push(current);
					current = null;
				}
			}
			if (current) runs.push(current);
			return runs;
		},
		[flatWords],
	);

	const selectedCount = useMemo(
		() => flatWords.filter((w) => selection.has(w.id) && !w.deleted).length,
		[flatWords, selection],
	);

	const fillerCount = useMemo(
		() => flatWords.filter((w) => fillerWordIds.has(w.id) && !w.deleted).length,
		[flatWords, fillerWordIds],
	);

	const applyRuns = useCallback(
		(runs: DeletionRun[]) => {
			if (runs.length === 0) return;
			// One undoable step: split + delete + ripple-close the timeline and mark
			// the words deleted (TranscriptEditCommand reverts both on undo).
			dispatchTranscriptEdit({ editor, edit: { kind: "delete", runs } });
			setSelection(new Set());
			setLastSelectedId(null);
		},
		[editor],
	);

	const deleteSelected = useCallback(() => {
		applyRuns(buildRuns(selection));
	}, [applyRuns, buildRuns, selection]);

	const removeFillers = useCallback(() => {
		applyRuns(buildRuns(fillerWordIds));
	}, [applyRuns, buildRuns, fillerWordIds]);

	const jumpToMatch = useCallback(
		(idx: number) => {
			const match = searchResults[idx];
			if (!match) return;
			seekToSource(match.startSeconds);
		},
		[searchResults, seekToSource],
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

	const activeWordId = useMemo(() => {
		if (!doc) return null;
		for (const word of flatWords) {
			if (deletedWordIds.has(word.id)) continue;
			const bounds = wordTimeline.get(word.id);
			if (
				bounds &&
				currentTimeTicks >= bounds.tStartTicks &&
				currentTimeTicks < bounds.tEndTicks
			) {
				return word.id;
			}
		}
		return null;
	}, [doc, flatWords, currentTimeTicks, deletedWordIds, wordTimeline]);

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
							disabled={selectedCount === 0}
							onClick={deleteSelected}
						>
							Delete {selectedCount > 0 ? selectedCount : ""} word
							{selectedCount === 1 ? "" : "s"}
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
						<EmptyState
							modelId={modelId}
							onModelChange={setModelId}
							language={language}
							onLanguageChange={setLanguage}
							onGenerate={generate}
						/>
					)}
					{status.kind === "working" && (
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Spinner className="size-4" />
								<span>{status.step}</span>
							</div>
							<Button size="sm" variant="text" onClick={cancelGeneration}>
								Cancel
							</Button>
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
							deletedWordIds={deletedWordIds}
							activeWordId={activeWordId}
							fillerWordIds={fillerWordIds}
							searchMatchedWordIds={searchMatchedWordIds}
							activeMatchWordIds={activeMatchWordIds}
							editingWordId={editingWordId}
							editingText={editingText}
							onEditingTextChange={setEditingText}
							onCommitEdit={commitWordEdit}
							onCancelEdit={cancelWordEdit}
							onWordClick={handleWordClick}
							onWordDoubleClick={handleWordDoubleClick}
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

function EmptyState({
	modelId,
	onModelChange,
	language,
	onLanguageChange,
	onGenerate,
}: {
	modelId: TranscriptionModelId;
	onModelChange: (modelId: TranscriptionModelId) => void;
	language: TranscriptionLanguage;
	onLanguageChange: (language: TranscriptionLanguage) => void;
	onGenerate: () => void;
}) {
	const selectedModel = TRANSCRIPTION_MODELS.find((m) => m.id === modelId);
	return (
		<div className="flex flex-col items-center justify-center text-center gap-3 py-8">
			<p className="text-sm text-muted-foreground max-w-xs">
				Transcribe the timeline audio so you can edit the video by editing the
				text. Click a word to seek; shift-click to select a range; double-click
				to edit a word; Cmd+F to find.
			</p>
			<div className="flex w-full max-w-xs flex-col gap-2 text-left">
				<label className="text-xs text-muted-foreground">
					Model
					<Select
						value={modelId}
						onValueChange={(value) => {
							const model = TRANSCRIPTION_MODELS.find((m) => m.id === value);
							if (model) onModelChange(model.id);
						}}
					>
						<SelectTrigger className="mt-1 w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TRANSCRIPTION_MODELS.map((model) => (
								<SelectItem key={model.id} value={model.id}>
									{model.name} — {model.description} (~{model.approxDownloadMb} MB)
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</label>
				<label className="text-xs text-muted-foreground">
					Language
					<Select
						value={language}
						onValueChange={(value) => {
							if (value === "auto") {
								onLanguageChange("auto");
								return;
							}
							const lang = LANGUAGES.find((l) => l.code === value);
							if (lang) onLanguageChange(lang.code);
						}}
					>
						<SelectTrigger className="mt-1 w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="auto">Auto-detect</SelectItem>
							{LANGUAGES.map((lang) => (
								<SelectItem key={lang.code} value={lang.code}>
									{lang.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</label>
			</div>
			<Button size="sm" onClick={onGenerate}>
				Generate transcript
			</Button>
			{selectedModel && (
				<p className="max-w-xs text-xs text-muted-foreground/70">
					Runs locally in your browser. First use downloads the{" "}
					{selectedModel.name} model (~{selectedModel.approxDownloadMb} MB).
				</p>
			)}
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
	deletedWordIds,
	activeWordId,
	fillerWordIds,
	searchMatchedWordIds,
	activeMatchWordIds,
	editingWordId,
	editingText,
	onEditingTextChange,
	onCommitEdit,
	onCancelEdit,
	onWordClick,
	onWordDoubleClick,
}: {
	doc: TranscriptDocument;
	selection: Set<string>;
	deletedWordIds: Set<string>;
	activeWordId: string | null;
	fillerWordIds: Set<string>;
	searchMatchedWordIds: Set<string>;
	activeMatchWordIds: Set<string>;
	editingWordId: string | null;
	editingText: string;
	onEditingTextChange: (text: string) => void;
	onCommitEdit: () => void;
	onCancelEdit: () => void;
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
							if (word.id === editingWordId) {
								return (
									<input
										key={word.id}
										data-word-id={word.id}
										value={editingText}
										onChange={(event) =>
											onEditingTextChange(event.target.value)
										}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												onCommitEdit();
											} else if (event.key === "Escape") {
												event.preventDefault();
												onCancelEdit();
											}
										}}
										onBlur={onCommitEdit}
										ref={(el) => {
											if (el && document.activeElement !== el) {
												el.focus();
												el.select();
											}
										}}
										className="inline rounded-sm bg-muted px-1 outline-none ring-1 ring-ring"
										style={{
											width: `${Math.max(2, editingText.length + 1)}ch`,
										}}
										aria-label="Edit word"
									/>
								);
							}
							const isDeleted = deletedWordIds.has(word.id);
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
										isDeleted &&
											"line-through text-muted-foreground/40 hover:text-muted-foreground/70",
										!isDeleted &&
											isActiveMatch &&
											"bg-yellow-400/60 text-foreground",
										!isDeleted &&
											isMatch &&
											!isActiveMatch &&
											"bg-yellow-300/30",
										!isDeleted &&
											isSelected &&
											!isMatch &&
											"bg-destructive/30 text-destructive-foreground",
										!isDeleted &&
											isActive &&
											!isSelected &&
											!isMatch &&
											"bg-accent text-accent-foreground",
										!isDeleted &&
											isFiller &&
											!isSelected &&
											!isActive &&
											!isMatch &&
											"underline decoration-amber-500/60 decoration-dotted underline-offset-2",
										!isDeleted &&
											!isSelected &&
											!isActive &&
											!isMatch &&
											!isFiller &&
											"hover:bg-accent/40",
									)}
									aria-pressed={isSelected}
									title={isDeleted ? "Click to restore" : undefined}
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
