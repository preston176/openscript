import type { EditorCore } from "@/core";
import { storageService } from "@/services/storage/service";
import type { TranscriptDocument } from "@/transcript-editor/types";

const TRANSCRIPT_SCHEMA_VERSION = 2;

/**
 * Editor-owned holder for the active project's transcript document.
 *
 * The transcript used to live in the panel's React state, which a Command could
 * not reach — so undo/redo of a transcript edit could not revert the document.
 * Owning it here (mirroring the manager listener pattern) lets TranscriptEditCommand
 * mutate it from global undo/redo, and the panel re-renders via useEditor's
 * subscription. setDoc persists to storage (keyed by the active project) unless
 * `persist:false` is passed (e.g. when hydrating a just-loaded document).
 */
export class TranscriptStore {
	private doc: TranscriptDocument | null = null;
	private readonly listeners = new Set<() => void>();

	constructor(private editor: EditorCore) {}

	getDoc(): TranscriptDocument | null {
		return this.doc;
	}

	setDoc(
		doc: TranscriptDocument | null,
		options?: { persist?: boolean },
	): void {
		this.doc = doc;
		if (doc && options?.persist !== false) {
			const projectId = this.editor.project.getActiveOrNull()?.metadata.id;
			if (projectId) {
				void storageService.saveTranscript({
					projectId,
					transcript: { version: TRANSCRIPT_SCHEMA_VERSION, document: doc },
				});
			}
		}
		this.notify();
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	notify(): void {
		this.listeners.forEach((listener) => {
			listener();
		});
	}
}
