/**
 * useTranscriptEditor Hook
 * State management for text-based video editing with undo/redo
 */
import { useReducer, useCallback } from 'react';
import type { EditableSegment, EditorState, EditorAction } from '../../types/editor';

interface HistoryState {
  past: EditableSegment[][];
  present: EditableSegment[];
  future: EditableSegment[][];
}

interface FullState extends EditorState {
  history: HistoryState;
}

type FullAction = EditorAction;

function historyReducer(state: FullState, action: FullAction): FullState {
  const pushToHistory = (newSegments: EditableSegment[]): FullState => ({
    ...state,
    segments: newSegments,
    isModified: true,
    history: {
      past: [...state.history.past, state.segments],
      present: newSegments,
      future: [],
    },
  });

  switch (action.type) {
    case 'SET_SEGMENTS':
      return {
        ...state,
        segments: action.payload,
        isModified: false,
        history: {
          past: [],
          present: action.payload,
          future: [],
        },
      };

    case 'EDIT_SEGMENT': {
      const newSegments = state.segments.map(seg =>
        seg.id === action.payload.id
          ? { ...seg, text: action.payload.text }
          : seg
      );
      return pushToHistory(newSegments);
    }

    case 'DELETE_SEGMENT': {
      const newSegments = state.segments.map(seg =>
        seg.id === action.payload ? { ...seg, deleted: true } : seg
      );
      return pushToHistory(newSegments);
    }

    case 'RESTORE_SEGMENT': {
      const newSegments = state.segments.map(seg =>
        seg.id === action.payload ? { ...seg, deleted: false } : seg
      );
      return pushToHistory(newSegments);
    }

    case 'SELECT_SEGMENT':
      return { ...state, selectedSegmentId: action.payload };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };

    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      return {
        ...state,
        segments: previous,
        isModified: newPast.length > 0,
        history: {
          past: newPast,
          present: previous,
          future: [state.segments, ...state.history.future],
        },
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        ...state,
        segments: next,
        isModified: true,
        history: {
          past: [...state.history.past, state.segments],
          present: next,
          future: newFuture,
        },
      };
    }

    case 'RESET':
      return {
        segments: [],
        selectedSegmentId: null,
        isModified: false,
        currentTime: 0,
        history: { past: [], present: [], future: [] },
      };

    default:
      return state;
  }
}

const initialState: FullState = {
  segments: [],
  selectedSegmentId: null,
  isModified: false,
  currentTime: 0,
  history: { past: [], present: [], future: [] },
};

export function useTranscriptEditor(initialSegments?: EditableSegment[]) {
  const [state, dispatch] = useReducer(
    historyReducer,
    initialSegments
      ? {
          ...initialState,
          segments: initialSegments,
          history: { past: [], present: initialSegments, future: [] },
        }
      : initialState
  );

  const setSegments = useCallback((segments: EditableSegment[]) => {
    dispatch({ type: 'SET_SEGMENTS', payload: segments });
  }, []);

  const editSegment = useCallback((id: string, text: string) => {
    dispatch({ type: 'EDIT_SEGMENT', payload: { id, text } });
  }, []);

  const deleteSegment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SEGMENT', payload: id });
  }, []);

  const restoreSegment = useCallback((id: string) => {
    dispatch({ type: 'RESTORE_SEGMENT', payload: id });
  }, []);

  const selectSegment = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_SEGMENT', payload: id });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const getActiveSegments = useCallback(() => {
    return state.segments.filter(seg => !seg.deleted);
  }, [state.segments]);

  const getFullText = useCallback(() => {
    return state.segments
      .filter(seg => !seg.deleted)
      .map(seg => seg.text)
      .join(' ');
  }, [state.segments]);

  const getSegmentAtTime = useCallback((time: number) => {
    return state.segments.find(
      seg => !seg.deleted && time >= seg.startTime && time < seg.endTime
    );
  }, [state.segments]);

  return {
    // State
    segments: state.segments,
    selectedSegmentId: state.selectedSegmentId,
    isModified: state.isModified,
    currentTime: state.currentTime,
    canUndo,
    canRedo,
    
    // Actions
    setSegments,
    editSegment,
    deleteSegment,
    restoreSegment,
    selectSegment,
    setCurrentTime,
    undo,
    redo,
    reset,
    
    // Derived
    getActiveSegments,
    getFullText,
    getSegmentAtTime,
  };
}
