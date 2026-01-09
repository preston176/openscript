/**
 * Timeline Component
 * Visual representation of transcript segments with playback position
 */
import { useMemo } from 'react';
import type { EditableSegment } from '../../types/editor';
import './Timeline.css';

interface TimelineProps {
    segments: EditableSegment[];
    currentTime: number;
    totalDuration: number;
    selectedSegmentId: string | null;
    onSeek: (time: number) => void;
    onSelectSegment: (id: string) => void;
}

export function Timeline({
    segments,
    currentTime,
    totalDuration,
    selectedSegmentId,
    onSeek,
    onSelectSegment,
}: TimelineProps) {
    const playheadPosition = useMemo(() => {
        if (totalDuration === 0) return 0;
        return (currentTime / totalDuration) * 100;
    }, [currentTime, totalDuration]);

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * totalDuration;
        onSeek(Math.max(0, Math.min(newTime, totalDuration)));
    };

    const getSegmentStyle = (segment: EditableSegment) => {
        if (totalDuration === 0) return { left: '0%', width: '0%' };
        const left = (segment.startTime / totalDuration) * 100;
        const width = ((segment.endTime - segment.startTime) / totalDuration) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    return (
        <div className="timeline" data-testid="timeline">
            <div className="timeline-track" onClick={handleTimelineClick}>
                {/* Segments */}
                {segments.map((segment) => (
                    <div
                        key={segment.id}
                        className={`timeline-segment ${segment.deleted ? 'deleted' : ''} ${selectedSegmentId === segment.id ? 'selected' : ''
                            }`}
                        style={getSegmentStyle(segment)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectSegment(segment.id);
                            if (!segment.deleted) {
                                onSeek(segment.startTime);
                            }
                        }}
                        data-testid={`segment-${segment.id}`}
                    />
                ))}

                {/* Playhead */}
                <div
                    className="timeline-playhead"
                    style={{ left: `${playheadPosition}%` }}
                    data-testid="playhead"
                />
            </div>

            {/* Time markers */}
            <div className="timeline-markers">
                <span className="time-marker start">0:00</span>
                <span className="time-marker end">
                    {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}
