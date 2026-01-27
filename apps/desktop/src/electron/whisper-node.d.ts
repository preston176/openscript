declare module 'whisper-node' {
  interface WhisperOptions {
    modelName?: string;
    modelPath?: string;
    whisperOptions?: {
      language?: string;
      word_timestamps?: boolean;
      max_len?: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  }

  interface WhisperSegment {
    speech: string;
    timestamps: {
      from: number;
      to: number;
    };
  }

  function whisper(
    audioPath: string,
    options?: WhisperOptions
  ): Promise<WhisperSegment[]>;

  export default whisper;
}
