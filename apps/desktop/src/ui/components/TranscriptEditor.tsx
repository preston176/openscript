/**
 * TranscriptEditor Component
 * Editable transcript with delete/restore functionality
 */
import { useState, useRef, useEffect } from 'react';
import type { EditableSegment } from '../../types/editor';
import { formatTime } from '../../types/editor';
import './TranscriptEditor.css';

interface TranscriptEditorProps {
    segments: EditableSegment[];
    selectedSegmentId: string | null;
    onEditSegment: (id: string, text: string) => void;
    onDeleteSegment: (id: string) => void;
    onRestoreSegment: (id: string) => void;
    onSelectSegment: (id: string | null) => void;
    onSeekToTime?: (time: number) => void;
}

export function TranscriptEditor({
    segments,
    selectedSegmentId,
    onEditSegment,
    onDeleteSegment,
    onRestoreSegment,
    onSelectSegment,
    onSeekToTime,
}: TranscriptEditorProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleDoubleClick = (segment: EditableSegment) => {
        if (segment.deleted) return;
        setEditingId(segment.id);
        setEditText(segment.text);
    };

    const handleEditSubmit = () => {
        if (editingId && editText.trim()) {
            onEditSegment(editingId, editText.trim());
        }
        setEditingId(null);
        setEditText('');
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEditSubmit();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    const handleSegmentClick = (segment: EditableSegment) => {
        onSelectSegment(segment.id);
        if (onSeekToTime && !segment.deleted) {
            onSeekToTime(segment.startTime);
        }
    };

    return (
        <div className="transcript-editor">
            <div className="segments-list">
                {segments.map((segment) => (
                    <div
                        key={segment.id}
                        className={`segment ${segment.deleted ? 'deleted' : ''} ${selectedSegmentId === segment.id ? 'selected' : ''
                            }`}
                        onClick={() => handleSegmentClick(segment)}
                        onDoubleClick={() => handleDoubleClick(segment)}
                    >
                        <div className="segment-timestamp">
                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </div>

                        <div className="segment-content">
                            {editingId === segment.id ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="segment-edit-input"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleEditSubmit}
                                />
                            ) : (
                                <span className="segment-text">{segment.text}</span>
                            )}
                        </div>

                        <div className="segment-actions">
                            {segment.deleted ? (
                                <button
                                    className="action-button restore"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestoreSegment(segment.id);
                                    }}
                                    title="Restore segment"
                                >
                                    Restore
                                </button>
                            ) : (
                                <button
                                    className="action-button delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSegment(segment.id);
                                    }}
                                    title="Delete segment"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
