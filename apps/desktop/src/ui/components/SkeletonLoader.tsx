/**
 * SkeletonLoader Component
 * Animated placeholder for loading states
 */
import './SkeletonLoader.css';

interface SkeletonProps {
    width?: string;
    height?: string;
    variant?: 'text' | 'rect' | 'circle';
    count?: number;
}

export function Skeleton({
    width = '100%',
    height = '16px',
    variant = 'text',
    count = 1
}: SkeletonProps) {
    const items = Array.from({ length: count });

    return (
        <>
            {items.map((_, i) => (
                <div
                    key={i}
                    className={`skeleton skeleton-${variant}`}
                    style={{ width, height }}
                />
            ))}
        </>
    );
}

export function TranscriptSkeleton() {
    return (
        <div className="transcript-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-segment">
                    <Skeleton width="60px" height="12px" />
                    <div className="skeleton-content">
                        <Skeleton width={`${70 + Math.random() * 30}%`} height="16px" />
                    </div>
                </div>
            ))}
        </div>
    );
}
