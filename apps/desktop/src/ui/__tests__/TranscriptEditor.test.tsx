/**
 * TDD Tests for TranscriptEditor Component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranscriptEditor } from '../components/TranscriptEditor';
import type { EditableSegment } from '../../types/editor';

describe('TranscriptEditor Component', () => {
    const createTestSegments = (): EditableSegment[] => [
        { id: '1', text: 'First segment', startTime: 0, endTime: 2, deleted: false },
        { id: '2', text: 'Second segment', startTime: 2, endTime: 4, deleted: false },
        { id: '3', text: 'Third segment', startTime: 4, endTime: 6, deleted: true },
    ];

    const defaultProps = {
        segments: createTestSegments(),
        selectedSegmentId: null as string | null,
        onEditSegment: vi.fn(),
        onDeleteSegment: vi.fn(),
        onRestoreSegment: vi.fn(),
        onSelectSegment: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render all segments', () => {
            render(<TranscriptEditor {...defaultProps} />);

            expect(screen.getByText('First segment')).toBeInTheDocument();
            expect(screen.getByText('Second segment')).toBeInTheDocument();
            expect(screen.getByText('Third segment')).toBeInTheDocument();
        });

        it('should show deleted segments with visual indicator', () => {
            render(<TranscriptEditor {...defaultProps} />);

            const thirdSegment = screen.getByText('Third segment').closest('.segment');
            expect(thirdSegment).toHaveClass('deleted');
        });

        it('should show selected segment with visual indicator', () => {
            render(<TranscriptEditor {...defaultProps} selectedSegmentId="1" />);

            const firstSegment = screen.getByText('First segment').closest('.segment');
            expect(firstSegment).toHaveClass('selected');
        });
    });

    describe('interactions', () => {
        it('should call onSelectSegment when clicking a segment', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            await user.click(screen.getByText('First segment'));

            expect(defaultProps.onSelectSegment).toHaveBeenCalledWith('1');
        });

        it('should call onDeleteSegment when delete button clicked', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
            await user.click(deleteButtons[0]);

            expect(defaultProps.onDeleteSegment).toHaveBeenCalledWith('1');
        });

        it('should call onRestoreSegment when restore button clicked', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            const restoreButton = screen.getByRole('button', { name: /restore/i });
            await user.click(restoreButton);

            expect(defaultProps.onRestoreSegment).toHaveBeenCalledWith('3');
        });
    });

    describe('editing', () => {
        it('should enter edit mode on double click', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            await user.dblClick(screen.getByText('First segment'));

            const input = screen.getByRole('textbox');
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('First segment');
        });

        it('should call onEditSegment when edit is saved', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            await user.dblClick(screen.getByText('First segment'));
            const input = screen.getByRole('textbox');

            await user.clear(input);
            await user.type(input, 'Updated text');
            await user.keyboard('{Enter}');

            expect(defaultProps.onEditSegment).toHaveBeenCalledWith('1', 'Updated text');
        });

        it('should cancel edit on Escape key', async () => {
            const user = userEvent.setup();
            render(<TranscriptEditor {...defaultProps} />);

            await user.dblClick(screen.getByText('First segment'));
            const input = screen.getByRole('textbox');

            await user.type(input, ' more text');
            await user.keyboard('{Escape}');

            expect(defaultProps.onEditSegment).not.toHaveBeenCalled();
            expect(screen.getByText('First segment')).toBeInTheDocument();
        });
    });

    describe('timestamps', () => {
        it('should display segment timestamps', () => {
            render(<TranscriptEditor {...defaultProps} />);

            // Check that timestamps are rendered (multiple matches expected)
            const timestamps = screen.getAllByText(/0:0\d/);
            expect(timestamps.length).toBeGreaterThan(0);
        });
    });
});
