/**
 * ExportDialog Component
 * Modal dialog for configuring and executing video export
 */
import { useState } from 'react';
import type { EditableSegment } from '../../types/editor';
import type { ExportProgress } from '../../types';
import { showToast } from '../utils/toast.js';
import './ExportDialog.css';

interface ExportDialogProps {
    videoPath: string;
    segments: EditableSegment[];
    onClose: () => void;
    onExportComplete: (outputPath: string) => void;
}

export function ExportDialog({
    videoPath,
    segments,
    onClose,
    onExportComplete,
}: ExportDialogProps) {
    const [format, setFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<ExportProgress | null>(null);

    const activeSegments = segments.filter(s => !s.deleted);
    const deletedCount = segments.length - activeSegments.length;

    const handleExport = async () => {
        setIsExporting(true);
        setProgress({ percent: 0, currentTime: '00:00:00', stage: 'preparing' });

        // Listen for progress updates
        window.electron.onExportProgress((prog: ExportProgress) => {
            setProgress(prog);
        });

        try {
            // Convert EditableSegment to export format
            const exportSegments = segments.map(seg => ({
                startTime: seg.startTime,
                endTime: seg.endTime,
                deleted: seg.deleted,
            }));

            const result = await window.electron.exportVideo({
                videoPath,
                segments: exportSegments,
                format,
                quality,
            });

            if (result.canceled) {
                setIsExporting(false);
                setProgress(null);
                return;
            }

            if (result.success && result.outputPath) {
                showToast('Video exported successfully!', 'success');
                onExportComplete(result.outputPath);
            }
        } catch (error) {
            console.error('Export failed:', error);
            const message = error instanceof Error ? error.message : 'Export failed';
            showToast(message, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-dialog-overlay" onClick={onClose}>
            <div className="export-dialog" onClick={e => e.stopPropagation()}>
                <header className="export-header">
                    <h2>Export Video</h2>
                    <button className="close-btn" onClick={onClose} disabled={isExporting}>
                        ×
                    </button>
                </header>

                <div className="export-content">
                    {/* Summary */}
                    <div className="export-summary">
                        <div className="summary-item">
                            <span className="label">Active segments:</span>
                            <span className="value">{activeSegments.length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Removed segments:</span>
                            <span className="value deleted">{deletedCount}</span>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="export-option">
                        <label>Format</label>
                        <div className="option-buttons">
                            {(['mp4', 'mov', 'webm'] as const).map(f => (
                                <button
                                    key={f}
                                    className={`option-btn ${format === f ? 'active' : ''}`}
                                    onClick={() => setFormat(f)}
                                    disabled={isExporting}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="export-option">
                        <label>Quality</label>
                        <div className="option-buttons">
                            {(['low', 'medium', 'high'] as const).map(q => (
                                <button
                                    key={q}
                                    className={`option-btn ${quality === q ? 'active' : ''}`}
                                    onClick={() => setQuality(q)}
                                    disabled={isExporting}
                                >
                                    {q.charAt(0).toUpperCase() + q.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress */}
                    {isExporting && progress && (
                        <div className="export-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            <div className="progress-info">
                                <span>{progress.stage === 'complete' ? 'Complete!' : `${progress.stage}...`}</span>
                                <span>{progress.percent}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="export-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleExport}
                        disabled={isExporting || activeSegments.length === 0}
                    >
                        {isExporting ? 'Exporting...' : 'Export Video'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
