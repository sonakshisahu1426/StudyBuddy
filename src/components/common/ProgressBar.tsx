import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  size = 'sm',
  showLabel = false,
  className = '',
}) => {
  const safeProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : Math.round(progress)));
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            color ? '' : 'bg-forest-600 dark:bg-forest-500'
          }`}
          style={{
            width: `${safeProgress}%`,
            backgroundColor: color,
          }}
          role="progressbar"
          aria-valuenow={safeProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-stone-400 mt-1">
          <span>Completion</span>
          <span className="font-medium text-stone-700 dark:text-stone-300">{safeProgress}%</span>
        </div>
      )}
    </div>
  );
};
