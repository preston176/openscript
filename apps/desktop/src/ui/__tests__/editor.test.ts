/**
 * TDD Tests for Editor Types and Utilities
 */
import { describe, it, expect } from 'vitest';
import {
  transcriptToSegments,
  getActiveSegments,
  getTotalDuration,
  formatTime,
  type EditableSegment,
} from '../../types/editor';

describe('Editor Types', () => {
  describe('transcriptToSegments', () => {
    it('should convert transcript chunks to editable segments', () => {
      const chunks = [
        { text: ' Hello world ', timestamp: [0, 1.5] as [number, number] },
        { text: 'This is a test', timestamp: [1.5, 3.0] as [number, number] },
      ];

      const segments = transcriptToSegments(chunks);

      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('Hello world');
      expect(segments[0].startTime).toBe(0);
      expect(segments[0].endTime).toBe(1.5);
      expect(segments[0].deleted).toBe(false);
      expect(segments[0].originalText).toBe('Hello world');
    });

    it('should generate unique IDs for each segment', () => {
      const chunks = [
        { text: 'A', timestamp: [0, 1] as [number, number] },
        { text: 'B', timestamp: [1, 2] as [number, number] },
      ];

      const segments = transcriptToSegments(chunks);

      expect(segments[0].id).not.toBe(segments[1].id);
    });

    it('should handle empty chunks', () => {
      const segments = transcriptToSegments([]);
      expect(segments).toHaveLength(0);
    });
  });

  describe('getActiveSegments', () => {
    it('should filter out deleted segments', () => {
      const segments: EditableSegment[] = [
        { id: '1', text: 'Keep', startTime: 0, endTime: 1, deleted: false },
        { id: '2', text: 'Delete', startTime: 1, endTime: 2, deleted: true },
        { id: '3', text: 'Keep too', startTime: 2, endTime: 3, deleted: false },
      ];

      const active = getActiveSegments(segments);

      expect(active).toHaveLength(2);
      expect(active.map(s => s.id)).toEqual(['1', '3']);
    });

    it('should return empty array if all deleted', () => {
      const segments: EditableSegment[] = [
        { id: '1', text: 'Deleted', startTime: 0, endTime: 1, deleted: true },
      ];

      expect(getActiveSegments(segments)).toHaveLength(0);
    });
  });

  describe('getTotalDuration', () => {
    it('should calculate total duration of active segments', () => {
      const segments: EditableSegment[] = [
        { id: '1', text: 'A', startTime: 0, endTime: 2, deleted: false },
        { id: '2', text: 'B', startTime: 2, endTime: 5, deleted: false },
      ];

      expect(getTotalDuration(segments)).toBe(5); // 2 + 3 = 5
    });

    it('should exclude deleted segments from duration', () => {
      const segments: EditableSegment[] = [
        { id: '1', text: 'A', startTime: 0, endTime: 2, deleted: false },
        { id: '2', text: 'B', startTime: 2, endTime: 5, deleted: true },
        { id: '3', text: 'C', startTime: 5, endTime: 7, deleted: false },
      ];

      expect(getTotalDuration(segments)).toBe(4); // 2 + 0 + 2 = 4
    });

    it('should return 0 for empty segments', () => {
      expect(getTotalDuration([])).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format seconds to mm:ss.ms', () => {
      expect(formatTime(0)).toBe('0:00.00');
      expect(formatTime(5.5)).toBe('0:05.50');
      expect(formatTime(65.25)).toBe('1:05.25');
      expect(formatTime(126)).toBe('2:06.00');
    });
  });
});
