import React from 'react';
import { TimerInterval } from '../../types';

interface IntervalSequenceBarProps {
  intervals: TimerInterval[];
  currentIndex: number;
}

export const IntervalSequenceBar: React.FC<IntervalSequenceBarProps> = ({
  intervals,
  currentIndex,
}) => {
  if (!intervals || intervals.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span className="font-medium">
          Interval {currentIndex + 1} of {intervals.length}
        </span>
        <span className="font-mono">
          {intervals.reduce((sum, i) => sum + i.durationMinutes, 0)}m total
        </span>
      </div>

      <div className="flex items-center gap-1.5 w-full">
        {intervals.map((int, idx) => {
          const isCurrent = idx === currentIndex;
          const isDone = idx < currentIndex;
          const isStudy = int.type === 'study';

          return (
            <div
              key={int.id || idx}
              className={`flex-1 h-3 rounded-full transition-all relative group ${
                isDone
                  ? 'bg-forest-700/80 dark:bg-forest-600/80'
                  : isCurrent
                  ? isStudy
                    ? 'bg-forest-600 ring-2 ring-forest-600/30 dark:ring-forest-500/40 animate-pulse'
                    : 'bg-amber-500 ring-2 ring-amber-500/30 animate-pulse'
                  : 'bg-stone-200 dark:bg-stone-800'
              }`}
              title={`${int.name} (${int.durationMinutes}m)`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
        {intervals.map((int, idx) => {
          const isCurrent = idx === currentIndex;
          const isStudy = int.type === 'study';

          return (
            <span
              key={int.id || idx}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                isCurrent
                  ? isStudy
                    ? 'bg-forest-100 text-forest-900 dark:bg-forest-950/80 dark:text-forest-200 font-bold border border-forest-300 dark:border-forest-700'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                  : 'text-stone-400 dark:text-stone-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{
                backgroundColor: isStudy ? '#2c5649' : '#b47422'
              }} />
              {int.name} ({int.durationMinutes}m)
            </span>
          );
        })}
      </div>
    </div>
  );
};
