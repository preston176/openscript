import whisper from 'whisper-node';
import { app } from 'electron';
import path from 'path';

interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    timestamp: [number, number];
    text: string;
  }>;
}

/**
 * Transcribe audio file using Whisper.cpp
 * @param audioPath - Path to the audio file (WAV format)
 * @param onProgress - Progress callback
 * @returns Transcription result with text and timestamps
 */
export async function transcribeAudio(
  audioPath: string,
  onProgress?: (status: string) => void
): Promise<TranscriptionResult> {
  try {
    // Get model directory
    const modelDir = path.join(app.getPath('userData'), 'models');
    
    if (onProgress) onProgress('Loading Whisper model...');
    
    // Transcribe using whisper-node
    const result = await whisper(audioPath, {
      modelName: 'tiny.en',  // Fast, English-only model
      modelPath: modelDir,
      whisperOptions: {
        language: 'en',
        word_timestamps: true,
        max_len: 1,  // Enable word-level timestamps
      }
    });

    if (onProgress) onProgress('Transcription complete');

    // Convert whisper-node output to our format
    // whisper-node returns array of segments with timestamps
    const text = result.map((segment) => segment.speech).join(' ');
    
    const chunks = result.map((segment) => ({
      timestamp: [segment.timestamps.from / 1000, segment.timestamps.to / 1000] as [number, number],
      text: segment.speech
    }));

    return {
      text,
      chunks
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}
