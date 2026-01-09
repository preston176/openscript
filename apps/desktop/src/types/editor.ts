/**
 * Editor Types for Text-Based Video Editing
 */

/**
 * A single editable transcript segment
 */
export interface EditableSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  deleted: boolean;
  originalText?: string; // Store original for comparison
  speaker?: string;
}

/**
 * Editor state containing all segments and metadata
 */
export interface EditorState {
  segments: EditableSegment[];
  selectedSegmentId: string | null;
  isModified: boolean;
  currentTime: number; // Video playback position
}

/**
 * Actions for editor reducer
 */
export type EditorAction =
  | { type: 'SET_SEGMENTS'; payload: EditableSegment[] }
  | { type: 'EDIT_SEGMENT'; payload: { id: string; text: string } }
  | { type: 'DELETE_SEGMENT'; payload: string }
  | { type: 'RESTORE_SEGMENT'; payload: string }
  | { type: 'SELECT_SEGMENT'; payload: string | null }
  | { type: 'MERGE_SEGMENTS'; payload: { id1: string; id2: string } }
  | { type: 'SPLIT_SEGMENT'; payload: { id: string; splitPoint: number } }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' };

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  segments: EditableSegment[];
  timestamp: number;
}

/**
 * Convert transcription result to editable segments
 */
export function transcriptToSegments(
  transcriptChunks: Array<{ text: string; timestamp: [number, number] }>
): EditableSegment[] {
  return transcriptChunks.map((chunk, index) => ({
    id: `segment-${index}-${Date.now()}`,
    text: chunk.text.trim(),
    startTime: chunk.timestamp[0],
    endTime: chunk.timestamp[1],
    deleted: false,
    originalText: chunk.text.trim(),
  }));
}

/**
 * Get active (non-deleted) segments
 */
export function getActiveSegments(segments: EditableSegment[]): EditableSegment[] {
  return segments.filter(seg => !seg.deleted);
}

/**
 * Get total duration from segments
 */
export function getTotalDuration(segments: EditableSegment[]): number {
  const active = getActiveSegments(segments);
  if (active.length === 0) return 0;
  return active.reduce((total, seg) => total + (seg.endTime - seg.startTime), 0);
}

/**
 * Format time in seconds to display format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
