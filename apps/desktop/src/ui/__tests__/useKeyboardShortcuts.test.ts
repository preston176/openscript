/**
 * TDD Tests for useKeyboardShortcuts Hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const simulateKeyDown = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
  };

  describe('undo/redo', () => {
    it('should call onUndo when Ctrl+Z is pressed', () => {
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      simulateKeyDown('z', { ctrlKey: true });
      expect(onUndo).toHaveBeenCalled();
    });

    it('should call onRedo when Ctrl+Shift+Z is pressed', () => {
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      expect(onRedo).toHaveBeenCalled();
    });

    it('should call onRedo when Ctrl+Y is pressed', () => {
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      simulateKeyDown('y', { ctrlKey: true });
      expect(onRedo).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call onDelete when Delete is pressed', () => {
      const onDelete = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onDelete }));

      simulateKeyDown('Delete');
      expect(onDelete).toHaveBeenCalled();
    });

    it('should call onDelete when Backspace is pressed', () => {
      const onDelete = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onDelete }));

      simulateKeyDown('Backspace');
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('playback', () => {
    it('should call onPlayPause when Space is pressed', () => {
      const onPlayPause = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPlayPause }));

      simulateKeyDown(' ');
      expect(onPlayPause).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should call onSave when Ctrl+S is pressed', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      simulateKeyDown('s', { ctrlKey: true });
      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('enabled flag', () => {
    it('should not call handlers when disabled', () => {
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo, enabled: false }));

      simulateKeyDown('z', { ctrlKey: true });
      expect(onUndo).not.toHaveBeenCalled();
    });
  });
});
