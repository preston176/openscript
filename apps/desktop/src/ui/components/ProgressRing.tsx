/**
 * ProgressRing Component
 * Circular progress indicator
 */
import './ProgressRing.css';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
}

export function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 6,
    label,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="progress-ring-container">
            <svg
                className="progress-ring"
                width={size}
                height={size}
            >
                {/* Background circle */}
                <circle
                    className="progress-ring-bg"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className="progress-ring-progress"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="progress-ring-content">
                <span className="progress-ring-value">{Math.round(progress)}%</span>
                {label && <span className="progress-ring-label">{label}</span>}
            </div>
        </div>
    );
}
