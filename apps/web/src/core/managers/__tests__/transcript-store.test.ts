import { describe, expect, test } from "bun:test";
import type { EditorCore } from "@/core";
import type { TranscriptDocument } from "@/transcript-editor/types";
import { TranscriptStore } from "../transcript-store";

// persist:false keeps the store from touching storageService / the editor, so a
// bare cast is safe here — the store only dereferences the editor when persisting.
function makeStore(): TranscriptStore {
	return new TranscriptStore({} as unknown as EditorCore);
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
});
