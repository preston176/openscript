/**
 * TypeScript type definitions for the OpenScript desktop app
 */

// Transcript types
export interface TranscriptSegment {
  timestamp: [number, number];
  text: string;
}

export interface TranscriptResult {
  text: string;
  chunks?: TranscriptSegment[];
}

// Worker message types
export type WorkerMessageType = 'loading' | 'loaded' | 'transcribing' | 'complete' | 'error';

export interface WorkerMessage {
  type: WorkerMessageType;
  message?: string;
  transcript?: TranscriptResult;
  error?: string;
}

// FFmpeg types
export interface ExtractionProgress {
  percent: number;
  currentTime: string;
  targetSize: string;
}

// Electron API types
export interface ElectronAPI {
  selectVideoFile: () => Promise<string | null>;
  extractAudio: (videoPath: string) => Promise<string>;
  readAudioFile: (audioPath: string) => Promise<ArrayBuffer>;
  getCacheDir: () => Promise<string>;
  transcribeAudio: (audioPath: string) => Promise<any>;
  onExtractionProgress: (callback: (progress: ExtractionProgress) => void) => void;
  onTranscriptionProgress: (callback: (status: string) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
