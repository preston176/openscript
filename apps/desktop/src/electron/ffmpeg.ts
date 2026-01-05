import ffmpeg from "fluent-ffmpeg";
import { app } from "electron";
import path from "path";
import fs from "fs";

export interface ExtractionProgress {
  percent: number;
  currentTime: string;
  targetSize: string;
}

export async function extractAudio(
  videoPath: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(app.getPath("temp"), "openscript");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique output filename
    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `audio-${timestamp}.wav`);

    console.log(`Extracting audio from: ${videoPath}`);
    console.log(`Output path: ${outputPath}`);

    ffmpeg(videoPath)
      .output(outputPath)
      .audioCodec("pcm_s16le") // WAV format for Whisper
      .audioChannels(1) // Mono
      .audioFrequency(16000) // 16kHz sample rate (Whisper requirement)
      .on("start", (commandLine) => {
        console.log("FFmpeg command:", commandLine);
      })
      .on("progress", (progress) => {
        if (onProgress) {
          onProgress({
            percent: progress.percent || 0,
            currentTime: progress.timemark || "00:00:00",
            targetSize: progress.targetSize?.toString() || "0kB",
          });
        }
        console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
      })
      .on("end", () => {
        console.log("Audio extraction completed!");
        resolve(outputPath);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error:", err.message);
        console.error("FFmpeg stderr:", stderr);
        reject(new Error(`FFmpeg extraction failed: ${err.message}`));
      })
      .run();
  });
}

export function cleanupTempFiles(): void {
  const tempDir = path.join(app.getPath("temp"), "openscript");
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach((file) => {
      const filePath = path.join(tempDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted temp file: ${filePath}`);
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    });
  }
}
