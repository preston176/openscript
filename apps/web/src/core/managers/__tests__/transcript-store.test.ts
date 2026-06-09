import { describe, expect, test, mock } from "bun:test";
import type { EditorCore } from "@/core";
import type { TranscriptDocument } from "@/transcript-editor/types";

const deleteTranscript = mock(() => Promise.resolve());
const saveTranscript = mock(() => Promise.resolve());
mock.module("@/services/storage/service", () => ({
	storageService: { deleteTranscript, saveTranscript },
}));

import { TranscriptStore } from "../transcript-store";

// persist:false keeps the store from touching storageService / the editor, so a
// bare cast is safe here — the store only dereferences the editor when persisting.
function makeStore(): TranscriptStore {
	return new TranscriptStore({} as unknown as EditorCore);
}

function makeStoreWithProject(projectId: string | null): TranscriptStore {
	return new TranscriptStore({
		project: {
			getActiveOrNull: () =>
				projectId ? { metadata: { id: projectId } } : null,
		},
	} as unknown as EditorCore);
}

const doc: TranscriptDocument = { segments: [], deletedRanges: [] };

describe("TranscriptStore", () => {
	test("getDoc returns the last set document", () => {
		const store = makeStore();
		expect(store.getDoc()).toBeNull();
		store.setDoc(doc, { persist: false });
		expect(store.getDoc()).toBe(doc);
	});

	test("notifies subscribers on setDoc and stops after unsubscribe", () => {
		const store = makeStore();
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls++;
		});
		store.setDoc(doc, { persist: false });
		expect(calls).toBe(1);
		unsubscribe();
		store.setDoc(null, { persist: false });
		expect(calls).toBe(1);
		expect(store.getDoc()).toBeNull();
	});

	test("clearDoc nulls the document and notifies", () => {
		const store = makeStoreWithProject(null);
		let calls = 0;
		store.subscribe(() => {
			calls++;
		});
		store.setDoc(doc, { persist: false });
		expect(store.getDoc()).toBe(doc);
		store.clearDoc();
		expect(store.getDoc()).toBeNull();
		expect(calls).toBe(2); // setDoc + clearDoc
	});

	test("clearDoc deletes the persisted transcript for the active project", () => {
		deleteTranscript.mockClear();
		const store = makeStoreWithProject("proj-1");
		store.setDoc(doc, { persist: false });
		store.clearDoc();
		expect(deleteTranscript).toHaveBeenCalledTimes(1);
		expect(deleteTranscript).toHaveBeenCalledWith({ projectId: "proj-1" });
	});
});
