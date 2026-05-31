import { Command, type CommandResult } from "@/commands/base-command";
import { EditorCore } from "@/core";
import type { SceneTracks } from "@/timeline";
import {
	type DeletionRun,
	planTranscriptDelete,
	planTranscriptRestore,
} from "./plan";
import type { TranscriptDocument } from "./types";

export type TranscriptEdit =
	| { kind: "delete"; runs: DeletionRun[] }
	| { kind: "restore"; rangeId: string };

/**
 * One undoable transcript edit. The destructive timeline change (split + delete
 * + ripple, or ripple-open + reconstruct) and the transcript-document delta are
 * computed by the pure plan functions and snapshotted here, so a single undo
 * reverts BOTH the tracks and the document atomically — no desync. redo() and
 * undo() replay captured snapshots rather than recomputing (recomputing would
 * mint new DeletedRange ids).
 */
export class TranscriptEditCommand extends Command {
	private beforeTracks: SceneTracks | null = null;
	private afterTracks: SceneTracks | null = null;
	private beforeDoc: TranscriptDocument | null = null;
	private afterDoc: TranscriptDocument | null = null;

	constructor(private readonly edit: TranscriptEdit) {
		super();
	}

	execute(): CommandResult | undefined {
		const editor = EditorCore.getInstance();
		const scene = editor.scenes.getActiveSceneOrNull();
		const doc = editor.transcript.getDoc();
		if (!scene || !doc) return undefined;

		this.beforeTracks = scene.tracks;
		this.beforeDoc = doc;

		const plan =
			this.edit.kind === "delete"
				? planTranscriptDelete({ tracks: scene.tracks, doc, runs: this.edit.runs })
				: planTranscriptRestore({
						tracks: scene.tracks,
						doc,
						rangeId: this.edit.rangeId,
					});

		this.afterTracks = plan.afterTracks;
		this.afterDoc = plan.afterDoc;
		this.applySnapshot({ tracks: plan.afterTracks, doc: plan.afterDoc });
		return undefined;
	}

	undo(): void {
		if (this.beforeTracks && this.beforeDoc) {
			this.applySnapshot({ tracks: this.beforeTracks, doc: this.beforeDoc });
		}
	}

	redo(): CommandResult | undefined {
		if (this.afterTracks && this.afterDoc) {
			this.applySnapshot({ tracks: this.afterTracks, doc: this.afterDoc });
		}
		return undefined;
	}

	private applySnapshot({
		tracks,
		doc,
	}: {
		tracks: SceneTracks;
		doc: TranscriptDocument;
	}): void {
		const editor = EditorCore.getInstance();
		editor.timeline.updateTracks(tracks);
		editor.transcript.setDoc(doc);
	}
}

/**
 * Apply a transcript edit as a single undoable step. The plan is computed +
 * applied in execute(), then the command is recorded via push() (not execute())
 * so the editor's global ripple toggle does not double-apply the ripple already
 * baked into the plan; reactors then prune any track left empty by the cut.
 *
 * Known v1 limitation: if a cut removes the last element on a track and that
 * (now empty) track is pruned, restoring the cut cannot rebuild that track.
 */
export function dispatchTranscriptEdit({
	editor,
	edit,
}: {
	editor: EditorCore;
	edit: TranscriptEdit;
}): void {
	const command = new TranscriptEditCommand(edit);
	command.execute();
	editor.command.push({ command });
	editor.command.reactToExternalChange();
}
