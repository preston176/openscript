/**
 * useKeyboardShortcuts Hook
 * Keyboard shortcuts for transcript editing
 */
import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onPlayPause?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
  onPlayPause,
  onSave,
  onEscape,
  enabled = true,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape' && onEscape) {
          onEscape();
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + Z - Undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Delete or Backspace - Delete segment
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Space - Play/Pause
      if (e.key === ' ') {
        e.preventDefault();
        onPlayPause?.();
        return;
      }

      // Ctrl/Cmd + S - Save
      if (isMod && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
    },
    [enabled, onUndo, onRedo, onDelete, onPlayPause, onSave, onEscape]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
