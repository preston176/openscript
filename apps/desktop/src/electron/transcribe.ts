import { pipeline } from '@xenova/transformers';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    timestamp: [number, number];
    text: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transcriber: any = null;

/**
 * Initialize the Whisper transcription pipeline
 * Downloads model on first use and caches it locally
 */
async function initializeTranscriber() {
  if (transcriber) return transcriber;

  const cacheDir = path.join(app.getPath('userData'), 'models');
  
  // Configure transformers.js to use local cache
  process.env.TRANSFORMERS_CACHE = cacheDir;
  
  console.log('Initializing Whisper model...');
  transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-base',
    { 
      quantized: true,
      cache_dir: cacheDir,
    }
  );
  console.log('Whisper model initialized successfully');
  
  return transcriber;
}

/**
 * Convert WAV file to raw PCM data for transformers.js
 * @param audioPath - Path to WAV file
 * @returns Float32Array of audio samples
 */
async function readAudioFile(audioPath: string): Promise<Float32Array> {
  // Read the WAV file
  const buffer = fs.readFileSync(audioPath);
  
  // Simple WAV parser - assumes 16-bit PCM mono at 16kHz (which is what we extract)
  const dataOffset = 44; // Standard WAV header is 44 bytes
  const samples = new Int16Array(buffer.buffer, buffer.byteOffset + dataOffset, (buffer.length - dataOffset) / 2);
  
  // Convert to Float32Array normalized to [-1, 1]
  const float32Samples = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Samples[i] = samples[i] / 32768.0;
  }
  
  return float32Samples;
}

/**
 * Transcribe audio file
 * @param audioPath - Path to the audio file (WAV format)
 * @param onProgress - Progress callback
 * @returns Transcription result with text and timestamps
 */
export async function transcribeAudio(
  audioPath: string,
  onProgress?: (status: string) => void
): Promise<TranscriptionResult> {
  try {
    // Initialize transcriber
    if (onProgress) onProgress('Loading Whisper model...');
    const model = await initializeTranscriber();
    
    if (onProgress) onProgress('Model loaded successfully');
    if (onProgress) onProgress('Reading audio file...');
    
    // Read and decode audio file
    const audioData = await readAudioFile(audioPath);
    console.log('Audio data loaded - samples:', audioData.length, 'duration:', (audioData.length / 16000).toFixed(2), 'seconds');
    
    if (onProgress) onProgress('Transcribing audio...');
    
    // Perform transcription with raw audio data
    // transformers.js expects: { raw: Float32Array, sampling_rate: number }
    const audioInput = {
      raw: audioData,
      sampling_rate: 16000  // Our audio is extracted at 16kHz
    };
    
    console.log('Calling model with audio input - samples:', audioInput.raw.length);
    
    const rawResult = await model(audioInput, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    
    console.log('Raw transcription result:', JSON.stringify(rawResult).substring(0, 500));
    console.log('Result keys:', Object.keys(rawResult));
    console.log('Result text:', rawResult.text);
    console.log('Result chunks:', rawResult.chunks);
    
    // Format the result to match our TranscriptResult interface
    const result: TranscriptionResult = {
      text: rawResult.text || '',
      chunks: []
    };
    
    // Extract chunks from the result
    // transformers.js returns chunks in the 'chunks' property
    if (rawResult.chunks && Array.isArray(rawResult.chunks)) {
      result.chunks = rawResult.chunks.map((chunk: any) => ({
        timestamp: chunk.timestamp as [number, number],
        text: chunk.text
      }));
    }
    
    console.log('Formatted result - text length:', result.text.length, 'chunks:', result.chunks?.length);
    
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}
