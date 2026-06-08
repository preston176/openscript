import type {
	TranscriptionModel,
	TranscriptionModelId,
} from "./types";

export const TRANSCRIPTION_MODELS: TranscriptionModel[] = [
	{
		id: "whisper-tiny",
		name: "Tiny",
		huggingFaceId: "Xenova/whisper-tiny",
		description: "Fastest, lower accuracy",
		approxDownloadMb: 40,
	},
	{
		id: "whisper-small",
		name: "Small",
		huggingFaceId: "Xenova/whisper-small",
		description: "Good balance of speed and accuracy",
		approxDownloadMb: 180,
	},
	{
		id: "whisper-medium",
		name: "Medium",
		huggingFaceId: "Xenova/whisper-medium",
		description: "Higher accuracy, slower",
		approxDownloadMb: 500,
	},
	{
		id: "whisper-large-v3-turbo",
		name: "Large v3 Turbo",
		huggingFaceId: "onnx-community/whisper-large-v3-turbo",
		description: "Best accuracy, requires WebGPU for good performance",
		approxDownloadMb: 800,
	},
];

// Tiny by default: ~40 MB and fast even on the single-threaded wasm fallback
// (no WebGPU / no cross-origin isolation). Users can pick a larger, more
// accurate model from the panel.
export const DEFAULT_TRANSCRIPTION_MODEL: TranscriptionModelId = "whisper-tiny";
