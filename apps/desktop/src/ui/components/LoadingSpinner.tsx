/**
 * LoadingSpinner Component
 * Animated loading indicator
 */
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner-ring">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            {label && <span className="spinner-label">{label}</span>}
        </div>
    );
}
