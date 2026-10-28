import React from 'react';
import { StudyTask, Subject } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { getTodayDateString, isDateOverdue } from '../../utils/date';
import { CheckSquare, Square, Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  tasks: StudyTask[];
  subjects: Subject[];
  firstDayOfWeek?: 0 | 1; // 1 = Monday, 0 = Sunday
  onSelectDate: (dateStr: string) => void;
  onAddTaskForDate: (dateStr: string) => void;
  onEditTask: (task: StudyTask) => void;
  onToggleTaskComplete: (task: StudyTask, e: React.MouseEvent) => void;
  onRescheduleTask: (task: StudyTask) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  subjects,
  firstDayOfWeek = 1,
  onSelectDate,
  onAddTaskForDate,
  onEditTask,
  onToggleTaskComplete,
}) => {
  const subjectMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const todayStr = getTodayDateString();

  const weekdayHeaders = firstDayOfWeek === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    for (const task of tasks) {
      const list = map.get(task.date) || [];
      list.push(task);
      map.set(task.date, list);
    }
    return map;
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl overflow-hidden shadow-card">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-800 bg-stone-50/75 dark:bg-stone-850/50 text-center py-2.5 text-xs font-semibold text-stone-500 dark:text-stone-400 select-none">
        {weekdayHeaders.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-100 dark:divide-stone-850">
        {calendarDays.map((day) => {
          const dayDateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = dayDateStr === todayStr;
          const dayTasks = tasksByDate.get(dayDateStr) || [];

          return (
            <div
              key={dayDateStr}
              onClick={() => onSelectDate(dayDateStr)}
              className={`min-h-[105px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                !isCurrentMonth
                  ? 'bg-stone-50/40 dark:bg-stone-900/20 text-stone-300 dark:text-stone-600'
                  : 'hover:bg-stone-50/80 dark:hover:bg-stone-850/40'
              } ${isToday ? 'bg-forest-50/30 dark:bg-forest-950/20' : ''}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday
                      ? 'bg-forest-700 text-white font-bold'
                      : isCurrentMonth
                      ? 'text-stone-700 dark:text-stone-300'
                      : 'text-stone-400 dark:text-stone-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTaskForDate(dayDateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-stone-400 hover:text-forest-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition-opacity"
                  title="Add task on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks preview list inside cell */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => {
                  const sub = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
                  const isOverdue = !task.completed && isDateOverdue(task.date);

                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className={`text-[11px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 group/task transition-all ${
                        task.completed
                          ? 'bg-stone-100/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 line-through'
                          : isOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                          : task.category === 'deadline'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-semibold'
                          : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                      }`}
                      title={task.title}
                    >
                      <button
                        onClick={(e) => onToggleTaskComplete(task, e)}
                        className="shrink-0 hover:text-forest-600"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-2.5 h-2.5 text-forest-600" />
                        ) : (
                          <Square className="w-2.5 h-2.5" />
                        )}
                      </button>

                      {sub && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                      )}

                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-stone-400 font-mono font-medium pl-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
