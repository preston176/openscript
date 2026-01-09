/**
 * TDD Tests for Timeline Component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from '../components/Timeline';
import type { EditableSegment } from '../../types/editor';

describe('Timeline Component', () => {
    const createTestSegments = (): EditableSegment[] => [
        { id: '1', text: 'First', startTime: 0, endTime: 5, deleted: false },
        { id: '2', text: 'Second', startTime: 5, endTime: 10, deleted: false },
        { id: '3', text: 'Third', startTime: 10, endTime: 15, deleted: true },
    ];

    const defaultProps = {
        segments: createTestSegments(),
        currentTime: 0,
        totalDuration: 15,
        selectedSegmentId: null as string | null,
        onSeek: vi.fn(),
        onSelectSegment: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render timeline', () => {
            render(<Timeline {...defaultProps} />);
            expect(screen.getByTestId('timeline')).toBeInTheDocument();
        });

        it('should render segment markers', () => {
            render(<Timeline {...defaultProps} />);
            expect(screen.getByTestId('segment-1')).toBeInTheDocument();
            expect(screen.getByTestId('segment-2')).toBeInTheDocument();
            expect(screen.getByTestId('segment-3')).toBeInTheDocument();
        });

        it('should render playhead', () => {
            render(<Timeline {...defaultProps} />);
            expect(screen.getByTestId('playhead')).toBeInTheDocument();
        });

        it('should show deleted segments with different style', () => {
            render(<Timeline {...defaultProps} />);
            const deletedSegment = screen.getByTestId('segment-3');
            expect(deletedSegment).toHaveClass('deleted');
        });

        it('should show selected segment with visual indicator', () => {
            render(<Timeline {...defaultProps} selectedSegmentId="1" />);
            const selectedSegment = screen.getByTestId('segment-1');
            expect(selectedSegment).toHaveClass('selected');
        });
    });

    describe('playhead position', () => {
        it('should position playhead at 0% when currentTime is 0', () => {
            render(<Timeline {...defaultProps} currentTime={0} />);
            const playhead = screen.getByTestId('playhead');
            expect(playhead.style.left).toBe('0%');
        });

        it('should position playhead at 50% when currentTime is half', () => {
            render(<Timeline {...defaultProps} currentTime={7.5} />);
            const playhead = screen.getByTestId('playhead');
            expect(playhead.style.left).toBe('50%');
        });

        it('should position playhead at 100% when at end', () => {
            render(<Timeline {...defaultProps} currentTime={15} />);
            const playhead = screen.getByTestId('playhead');
            expect(playhead.style.left).toBe('100%');
        });
    });

    describe('interactions', () => {
        it('should call onSelectSegment when segment clicked', () => {
            render(<Timeline {...defaultProps} />);
            fireEvent.click(screen.getByTestId('segment-1'));
            expect(defaultProps.onSelectSegment).toHaveBeenCalledWith('1');
        });

        it('should call onSeek when segment clicked', () => {
            render(<Timeline {...defaultProps} />);
            fireEvent.click(screen.getByTestId('segment-1'));
            expect(defaultProps.onSeek).toHaveBeenCalledWith(0); // startTime of segment 1
        });

        it('should not seek when clicking deleted segment', () => {
            render(<Timeline {...defaultProps} />);
            fireEvent.click(screen.getByTestId('segment-3'));
            expect(defaultProps.onSelectSegment).toHaveBeenCalledWith('3');
            expect(defaultProps.onSeek).not.toHaveBeenCalled();
        });
    });

    describe('time markers', () => {
        it('should display start time marker', () => {
            render(<Timeline {...defaultProps} />);
            expect(screen.getByText('0:00')).toBeInTheDocument();
        });

        it('should display end time marker', () => {
            render(<Timeline {...defaultProps} />);
            expect(screen.getByText('0:15')).toBeInTheDocument();
        });
    });
});
