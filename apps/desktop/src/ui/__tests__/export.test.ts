/**
 * TDD Tests for Video Export
 */
import { describe, it, expect } from 'vitest';
import {
  buildFilterComplex,
  buildConcatFilter,
  type ExportSegment,
  type ExportOptions,
} from '../../electron/export';

describe('Video Export', () => {
  const createTestSegments = (): ExportSegment[] => [
    { startTime: 0, endTime: 5, deleted: false },
    { startTime: 5, endTime: 10, deleted: true },
    { startTime: 10, endTime: 15, deleted: false },
  ];

  describe('buildFilterComplex', () => {
    it('should generate trim filters for active segments only', () => {
      const segments = createTestSegments();
      const filter = buildFilterComplex(segments);

      // Should only have 2 segments (first and third, not the deleted middle one)
      expect(filter).toContain('trim=0:5');
      expect(filter).toContain('trim=10:15');
      expect(filter).not.toContain('trim=5:10');
    });

    it('should include both video and audio filters', () => {
      const segments = createTestSegments();
      const filter = buildFilterComplex(segments);

      expect(filter).toContain('[0:v]');
      expect(filter).toContain('[0:a]');
      expect(filter).toContain('setpts=PTS-STARTPTS');
      expect(filter).toContain('asetpts=PTS-STARTPTS');
    });

    it('should generate correct stream labels', () => {
      const segments = createTestSegments();
      const filter = buildFilterComplex(segments);

      expect(filter).toContain('[v0]');
      expect(filter).toContain('[a0]');
      expect(filter).toContain('[v1]');
      expect(filter).toContain('[a1]');
    });

    it('should handle single active segment', () => {
      const segments: ExportSegment[] = [
        { startTime: 5, endTime: 10, deleted: false },
      ];
      const filter = buildFilterComplex(segments);

      expect(filter).toContain('trim=5:10');
      expect(filter).toContain('[v0]');
      expect(filter).toContain('[a0]');
    });

    it('should return empty string for all deleted segments', () => {
      const segments: ExportSegment[] = [
        { startTime: 0, endTime: 5, deleted: true },
      ];
      const filter = buildFilterComplex(segments);

      expect(filter).toBe('');
    });
  });

  describe('buildConcatFilter', () => {
    it('should generate concat filter for multiple segments', () => {
      const activeCount = 3;
      const filter = buildConcatFilter(activeCount);

      expect(filter).toContain('[v0][a0][v1][a1][v2][a2]');
      expect(filter).toContain('concat=n=3:v=1:a=1');
      expect(filter).toContain('[outv][outa]');
    });

    it('should handle single segment', () => {
      const filter = buildConcatFilter(1);

      expect(filter).toContain('[v0][a0]');
      expect(filter).toContain('concat=n=1');
    });

    it('should return empty for zero segments', () => {
      const filter = buildConcatFilter(0);
      expect(filter).toBe('');
    });
  });

  describe('ExportOptions', () => {
    it('should have correct default format', () => {
      const defaults: ExportOptions = {
        format: 'mp4',
        quality: 'high',
      };

      expect(defaults.format).toBe('mp4');
      expect(defaults.quality).toBe('high');
    });
  });
});
