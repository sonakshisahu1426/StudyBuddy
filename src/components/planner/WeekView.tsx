import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudyTask, Subject, Topic, StudySession } from '../../types';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { getTodayDateString, isDateOverdue } from '../../utils/date';
import { formatMinutesToHumanReadable, formatSecondsToHumanReadable } from '../../utils/time';
import {
  CheckSquare,
  Square,
  Clock,
  Play,
  RotateCcw,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  tasks: StudyTask[];
  subjects: Subject[];
  topics: Topic[];
  sessions: StudySession[];
  firstDayOfWeek?: 0 | 1;
  onAddTaskForDate: (dateStr: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (task: StudyTask) => void;
  onToggleTaskComplete: (task: StudyTask, e: React.MouseEvent) => void;
  onRescheduleTask: (task: StudyTask) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  subjects,
  topics,
  sessions,
  firstDayOfWeek = 1,
  onAddTaskForDate,
  onEditTask,
  onDeleteTask,
  onToggleTaskComplete,
  onRescheduleTask,
}) => {
  const navigate = useNavigate();

  const subjectMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicMap = React.useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: firstDayOfWeek });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: firstDayOfWeek });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const todayStr = getTodayDateString();

  // Tasks falling inside this week
  const weekTasks = React.useMemo(() => {
    return tasks.filter(t => t.date >= weekStartStr && t.date <= weekEndStr);
  }, [tasks, weekStartStr, weekEndStr]);

  // Actual focus sessions recorded during this week
  const weekSessions = React.useMemo(() => {
    return sessions.filter(s => {
      const sDate = s.startTime.split('T')[0];
      return sDate >= weekStartStr && sDate <= weekEndStr;
    });
  }, [sessions, weekStartStr, weekEndStr]);

  // Planned vs Actual metrics
  const plannedCount = weekTasks.length;
  const completedCount = weekTasks.filter(t => t.completed).length;
  const totalEstimatedMins = weekTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const actualFocusSeconds = weekSessions.reduce((sum, s) => sum + s.actualDurationSeconds, 0);

  // Group tasks by day
  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    for (const d of weekDays) {
      const dStr = format(d, 'yyyy-MM-dd');
      map.set(dStr, []);
    }
    for (const t of weekTasks) {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    }
    return map;
  }, [weekDays, weekTasks]);

  const handleStartFocus = (task: StudyTask) => {
    navigate(
      `/timer?taskId=${task.id}&subjectId=${task.subjectId || ''}&chapterId=${task.chapterId || ''}&topicId=${task.topicId || ''}&activity=${task.activityType}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Planned vs Actual Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-4 shadow-card">
        <div>
          <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
            Tasks Planned
          </span>
          <span className="text-lg font-bold text-stone-800 dark:text-stone-200 font-mono">
            {plannedCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-lg font-bold text-forest-700 dark:text-forest-400 font-mono">
            {completedCount} <span className="text-xs text-stone-400">({plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0}%)</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
            Estimated Study
          </span>
          <span className="text-lg font-bold text-stone-800 dark:text-stone-200 font-mono">
            {formatMinutesToHumanReadable(totalEstimatedMins)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
            Actual Focus Time
          </span>
          <span className="text-lg font-bold text-stone-800 dark:text-stone-200 font-mono">
            {formatSecondsToHumanReadable(actualFocusSeconds)}
          </span>
        </div>
      </div>

      {/* Week Day Columns */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = dateStr === todayStr;
          const dayTasks = tasksByDay.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              className={`bg-white dark:bg-charcoal-900 border rounded-xl p-3 flex flex-col shadow-card min-h-[220px] transition-all ${
                isToday
                  ? 'border-forest-600 dark:border-forest-700 ring-1 ring-forest-600/30'
                  : 'border-stone-200 dark:border-stone-850'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-sm font-bold ${
                    isToday ? 'text-forest-700 dark:text-forest-400 font-mono' : 'text-stone-900 dark:text-stone-100'
                  }`}>
                    {format(day, 'MMM d')}
                  </span>
                </div>

                <button
                  onClick={() => onAddTaskForDate(dateStr)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Add task for this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Day Tasks List */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <p className="text-[11px] text-stone-300 dark:text-stone-600 text-center py-6 italic">
                    No tasks
                  </p>
                ) : (
                  dayTasks.map((task) => {
                    const sub = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
                    const top = task.topicId ? topicMap.get(task.topicId) : undefined;
                    const isOverdue = !task.completed && isDateOverdue(task.date);

                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all group ${
                          task.completed
                            ? 'bg-stone-50/50 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800 text-stone-400'
                            : isOverdue
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-stone-800 dark:text-stone-200'
                            : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-750 text-stone-800 dark:text-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Task Title & Checkbox */}
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={(e) => onToggleTaskComplete(task, e)}
                            className="mt-0.5 shrink-0 text-stone-400 hover:text-forest-700"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-forest-600" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className={`font-medium break-words leading-tight flex-1 ${
                            task.completed ? 'line-through text-stone-400' : ''
                          }`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Breadcrumbs / Subject / Activity */}
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          {sub && (
                            <span
                              className="px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                              style={{
                                backgroundColor: `${sub.color}15`,
                                color: sub.color,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                              <span className="truncate max-w-[80px]">{sub.name}</span>
                            </span>
                          )}

                          {top && (
                            <span className="text-stone-400 truncate max-w-[70px]">
                              › {top.name}
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono capitalize">
                            {task.activityType}
                          </span>

                          {task.estimatedMinutes && (
                            <span className="text-stone-400 flex items-center gap-0.5 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        {/* Task Action Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/60 mt-1 opacity-80 group-hover:opacity-100">
                          {/* Start Focus Room button */}
                          <button
                            onClick={() => handleStartFocus(task)}
                            className="text-[10px] text-forest-700 dark:text-forest-400 font-semibold flex items-center gap-1 hover:underline"
                            title="Start Focus Session"
                          >
                            <Play className="w-2.5 h-2.5" /> Focus
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Carry Forward / Reschedule */}
                            {!task.completed && (
                              <button
                                onClick={() => onRescheduleTask(task)}
                                className="p-0.5 rounded text-stone-400 hover:text-amber-600"
                                title="Reschedule / Carry forward"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => onEditTask(task)}
                              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                              title="Edit task"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onDeleteTask(task)}
                              className="p-0.5 rounded text-stone-400 hover:text-rose-600"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
