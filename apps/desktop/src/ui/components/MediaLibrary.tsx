import './MediaLibrary.css';

interface MediaLibraryProps {
    fileName?: string;
    filePath?: string;
    duration?: number;
    fileSize?: number;
    onChangeFile?: () => void;
}

export function MediaLibrary({ fileName, filePath, duration, fileSize, onChangeFile }: MediaLibraryProps) {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <div className="media-library">
            <div className="media-library__section">
                <h3 className="media-library__title">Current File</h3>

                {fileName ? (
                    <div className="media-library__file">
                        <div className="media-library__file-name">{fileName}</div>
                        <div className="media-library__file-info">
                            {duration && (
                                <div className="media-library__file-info-row">
                                    <span>Duration</span>
                                    <span>{formatDuration(duration)}</span>
                                </div>
                            )}
                            {fileSize && (
                                <div className="media-library__file-info-row">
                                    <span>Size</span>
                                    <span>{formatFileSize(fileSize)}</span>
                                </div>
                            )}
                            {filePath && (
                                <div className="media-library__file-info-row">
                                    <span>Format</span>
                                    <span>{filePath.split('.').pop()?.toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="media-library__empty">
                        <svg className="media-library__empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="media-library__empty-text">No file selected</div>
                    </div>
                )}
            </div>

            <div className="media-library__section">
                <h3 className="media-library__title">Actions</h3>
                <button className="media-library__button" onClick={onChangeFile}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {fileName ? 'Change File' : 'Select File'}
                </button>
            </div>
        </div>
    );
}
