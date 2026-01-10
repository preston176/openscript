/**
 * TDD Tests for useTranscriptEditor Hook
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptEditor } from '../hooks/useTranscriptEditor';
import type { EditableSegment } from '../../types/editor';

describe('useTranscriptEditor Hook', () => {
  const createTestSegments = (): EditableSegment[] => [
    { id: '1', text: 'First segment', startTime: 0, endTime: 2, deleted: false },
    { id: '2', text: 'Second segment', startTime: 2, endTime: 4, deleted: false },
    { id: '3', text: 'Third segment', startTime: 4, endTime: 6, deleted: false },
  ];

  describe('initialization', () => {
    it('should initialize with empty segments', () => {
      const { result } = renderHook(() => useTranscriptEditor());
      expect(result.current.segments).toEqual([]);
      expect(result.current.selectedSegmentId).toBeNull();
      expect(result.current.isModified).toBe(false);
    });

    it('should set initial segments', () => {
      const segments = createTestSegments();
      const { result } = renderHook(() => useTranscriptEditor(segments));
      expect(result.current.segments).toHaveLength(3);
    });
  });

  describe('setSegments', () => {
    it('should replace all segments', () => {
      const { result } = renderHook(() => useTranscriptEditor());
      const segments = createTestSegments();

      act(() => {
        result.current.setSegments(segments);
      });

      expect(result.current.segments).toHaveLength(3);
      expect(result.current.isModified).toBe(false);
    });
  });

  describe('editSegment', () => {
    it('should update segment text', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.editSegment('1', 'Updated text');
      });

      expect(result.current.segments[0].text).toBe('Updated text');
      expect(result.current.isModified).toBe(true);
    });

    it('should not modify other segments', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.editSegment('1', 'Updated text');
      });

      expect(result.current.segments[1].text).toBe('Second segment');
      expect(result.current.segments[2].text).toBe('Third segment');
    });
  });

  describe('deleteSegment', () => {
    it('should mark segment as deleted', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.deleteSegment('2');
      });

      expect(result.current.segments[1].deleted).toBe(true);
      expect(result.current.isModified).toBe(true);
    });

    it('should keep segment in array (soft delete)', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.deleteSegment('2');
      });

      expect(result.current.segments).toHaveLength(3);
    });
  });

  describe('restoreSegment', () => {
    it('should restore deleted segment', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.deleteSegment('2');
      });
      expect(result.current.segments[1].deleted).toBe(true);

      act(() => {
        result.current.restoreSegment('2');
      });
      expect(result.current.segments[1].deleted).toBe(false);
    });
  });

  describe('selectSegment', () => {
    it('should select a segment', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.selectSegment('2');
      });

      expect(result.current.selectedSegmentId).toBe('2');
    });

    it('should deselect when passing null', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.selectSegment('2');
      });
      act(() => {
        result.current.selectSegment(null);
      });

      expect(result.current.selectedSegmentId).toBeNull();
    });
  });

  describe('undo/redo', () => {
    it('should undo last action', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.editSegment('1', 'Changed');
      });
      expect(result.current.segments[0].text).toBe('Changed');

      act(() => {
        result.current.undo();
      });
      expect(result.current.segments[0].text).toBe('First segment');
    });

    it('should redo undone action', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.editSegment('1', 'Changed');
      });
      act(() => {
        result.current.undo();
      });
      expect(result.current.segments[0].text).toBe('First segment');

      act(() => {
        result.current.redo();
      });
      expect(result.current.segments[0].text).toBe('Changed');
    });

    it('should report canUndo and canRedo correctly', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.editSegment('1', 'Changed');
      });
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('getActiveSegments', () => {
    it('should return only non-deleted segments', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.deleteSegment('2');
      });

      const active = result.current.getActiveSegments();
      expect(active).toHaveLength(2);
      expect(active.map(s => s.id)).toEqual(['1', '3']);
    });
  });

  describe('getFullText', () => {
    it('should return combined text of active segments', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      const fullText = result.current.getFullText();
      expect(fullText).toBe('First segment Second segment Third segment');
    });

    it('should exclude deleted segments', () => {
      const { result } = renderHook(() => useTranscriptEditor(createTestSegments()));

      act(() => {
        result.current.deleteSegment('2');
      });

      const fullText = result.current.getFullText();
      expect(fullText).toBe('First segment Third segment');
    });
  });
});
