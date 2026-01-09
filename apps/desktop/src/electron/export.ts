/**
 * Video Export Module
 * FFmpeg-based video cutting and concatenation
 */
import ffmpeg from 'fluent-ffmpeg';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

export interface ExportSegment {
  startTime: number;
  endTime: number;
  deleted: boolean;
}

export interface ExportOptions {
  format: 'mp4' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high';
  resolution?: '720p' | '1080p' | '4k';
}

export interface ExportProgress {
  percent: number;
  currentTime: string;
  stage: 'preparing' | 'exporting' | 'finalizing' | 'complete';
}

/**
 * Build FFmpeg filter_complex for trimming segments
 */
export function buildFilterComplex(segments: ExportSegment[]): string {
  const activeSegments = segments.filter(s => !s.deleted);
  
  if (activeSegments.length === 0) {
    return '';
  }

  const filters = activeSegments.map((seg, i) => {
    const vFilter = `[0:v]trim=${seg.startTime}:${seg.endTime},setpts=PTS-STARTPTS[v${i}]`;
    const aFilter = `[0:a]atrim=${seg.startTime}:${seg.endTime},asetpts=PTS-STARTPTS[a${i}]`;
    return `${vFilter};${aFilter}`;
  });

  return filters.join(';');
}

/**
 * Build concat filter for joining segments
 */
export function buildConcatFilter(activeCount: number): string {
  if (activeCount === 0) {
    return '';
  }

  const inputs = Array.from({ length: activeCount }, (_, i) => `[v${i}][a${i}]`).join('');
  return `${inputs}concat=n=${activeCount}:v=1:a=1[outv][outa]`;
}

/**
 * Get quality settings for export
 */
function getQualitySettings(quality: ExportOptions['quality']) {
  switch (quality) {
    case 'low':
      return { videoBitrate: '1000k', audioBitrate: '128k', crf: 28 };
    case 'medium':
      return { videoBitrate: '2500k', audioBitrate: '192k', crf: 23 };
    case 'high':
      return { videoBitrate: '5000k', audioBitrate: '256k', crf: 18 };
    default:
      return { videoBitrate: '2500k', audioBitrate: '192k', crf: 23 };
  }
}

/**
 * Export edited video with deleted segments removed
 */
export async function exportEditedVideo(
  videoPath: string,
  segments: ExportSegment[],
  outputPath: string,
  options: ExportOptions = { format: 'mp4', quality: 'high' },
  onProgress?: (progress: ExportProgress) => void,
  mainWindow?: BrowserWindow
): Promise<string> {
  return new Promise((resolve, reject) => {
    const activeSegments = segments.filter(s => !s.deleted);

    if (activeSegments.length === 0) {
      reject(new Error('No active segments to export. All content has been deleted.'));
      return;
    }

    // Build filter complex
    const trimFilters = buildFilterComplex(segments);
    const concatFilter = buildConcatFilter(activeSegments.length);
    const fullFilter = `${trimFilters};${concatFilter}`;

    // Get quality settings
    const quality = getQualitySettings(options.quality);

    // Notify progress
    if (onProgress) {
      onProgress({ percent: 0, currentTime: '00:00:00', stage: 'preparing' });
    }

    console.log('Starting export with filter:', fullFilter);
    console.log('Output path:', outputPath);

    const command = ffmpeg(videoPath)
      .complexFilter(fullFilter)
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]',
        `-crf`, quality.crf.toString(),
        `-b:v`, quality.videoBitrate,
        `-b:a`, quality.audioBitrate,
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg export command:', commandLine);
        if (onProgress) {
          onProgress({ percent: 5, currentTime: '00:00:00', stage: 'exporting' });
        }
      })
      .on('progress', (progress) => {
        const percent = Math.min(95, Math.round(progress.percent || 0));
        if (onProgress) {
          onProgress({
            percent,
            currentTime: progress.timemark || '00:00:00',
            stage: 'exporting',
          });
        }
        if (mainWindow) {
          mainWindow.webContents.send('export-progress', {
            percent,
            currentTime: progress.timemark || '00:00:00',
            stage: 'exporting',
          });
        }
      })
      .on('end', () => {
        console.log('Export completed:', outputPath);
        if (onProgress) {
          onProgress({ percent: 100, currentTime: '00:00:00', stage: 'complete' });
        }
        if (mainWindow) {
          mainWindow.webContents.send('export-progress', {
            percent: 100,
            currentTime: '00:00:00',
            stage: 'complete',
          });
        }
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg export error:', err.message);
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`Export failed: ${err.message}`));
      });

    command.run();
  });
}

/**
 * Get default output path for export
 */
export function getDefaultOutputPath(inputPath: string, format: string): string {
  const dir = path.dirname(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  const timestamp = Date.now();
  return path.join(dir, `${basename}_edited_${timestamp}.${format}`);
}
