import { pipeline } from '@xenova/transformers';

let transcriber: any = null;

self.onmessage = async (e) => {
  const { audioPath } = e.data;
  
  try {
    // Initialize the transcriber if not already loaded
    if (!transcriber) {
      self.postMessage({ type: 'loading', message: 'Loading Whisper model...' });
      
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',  // Using tiny model for faster performance
        { 
          quantized: true,  // Use quantized model for better performance
        }
      );
      
      self.postMessage({ type: 'loaded', message: 'Model loaded successfully' });
    }
    
    // Perform transcription
    self.postMessage({ type: 'transcribing', message: 'Transcribing audio...' });
    
    const result = await transcriber(audioPath, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5
    });
    
    self.postMessage({ 
      type: 'complete',
      transcript: result 
    });
    
  } catch (error) {
    self.postMessage({ 
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
