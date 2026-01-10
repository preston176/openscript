import { pipeline, env } from '@xenova/transformers';
import type { WorkerMessage, TranscriptResult } from '../../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transcriber: any = null;

self.onmessage = async (e: MessageEvent<{ audioData: string; cacheDir?: string }>) => {
  const { audioData, cacheDir } = e.data;
  
  try {
    // Configure cache directory if provided
    if (cacheDir && !transcriber) {
      env.cacheDir = cacheDir;
      env.allowLocalModels = true;
      env.allowRemoteModels = true;
    }
    
    // Initialize the transcriber if not already loaded
    if (!transcriber) {
      const loadingMessage: WorkerMessage = { 
        type: 'loading', 
        message: 'Loading Whisper model...' 
      };
      self.postMessage(loadingMessage);
      
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',  // Using tiny model for faster performance
        { 
          quantized: true,  // Use quantized model for better performance
        }
      );
      
      const loadedMessage: WorkerMessage = { 
        type: 'loaded', 
        message: 'Model loaded successfully' 
      };
      self.postMessage(loadedMessage);
    }
    
    // Perform transcription
    const transcribingMessage: WorkerMessage = { 
      type: 'transcribing', 
      message: 'Transcribing audio...' 
    };
    self.postMessage(transcribingMessage);
    
    // Convert data URL to audio data for transcription
    const result = await transcriber(audioData, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5
    }) as TranscriptResult;
    
    const completeMessage: WorkerMessage = { 
      type: 'complete',
      transcript: result 
    };
    self.postMessage(completeMessage);
    
  } catch (error) {
    const errorMessage: WorkerMessage = { 
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    self.postMessage(errorMessage);
  }
};
