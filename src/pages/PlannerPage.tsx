import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { StudyTask } from '../types';
import { MonthView } from '../components/planner/MonthView';
import { WeekView } from '../components/planner/WeekView';
import { TaskModal } from '../components/planner/TaskModal';
import { RescheduleModal } from '../components/planner/RescheduleModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { getTodayDateString, parseLocalDateString, formatReadableDate } from '../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const PlannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return dateParam ? parseLocalDateString(dateParam) : new Date();
  });
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Queries
  const tasks = useLiveQuery(() => db.studyTasks.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const sessions = useLiveQuery(() => db.studySessions.toArray()) || [];
  const settings = useLiveQuery(() => db.appSettings.get('app_settings'));

  const firstDayOfWeek = settings?.firstDayOfWeek !== undefined ? settings.firstDayOfWeek : 1;

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<StudyTask | null>(null);
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState<string>(getTodayDateString());

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<StudyTask | null>(null);

  const [taskToDelete, setTaskToDelete] = useState<StudyTask | null>(null);

  // Selected Day Details Modal (when clicking a date in Month view)
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (selectedSubjectFilter === 'all') return tasks;
    return tasks.filter(t => t.subjectId === selectedSubjectFilter);
  }, [tasks, selectedSubjectFilter]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleToggleTaskComplete = async (task: StudyTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !task.completed;
    await db.studyTasks.update(task.id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    await db.studyTasks.delete(taskToDelete.id);
    setTaskToDelete(null);
  };

  // Heading label
  const headingText = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    const start = startOfWeek(currentDate, { weekStartsOn: firstDayOfWeek });
    const end = endOfWeek(currentDate, { weekStartsOn: firstDayOfWeek });
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }, [currentDate, viewMode, firstDayOfWeek]);

  const inspectedDayTasks = useMemo(() => {
    if (!inspectedDate) return [];
    return tasks.filter(t => t.date === inspectedDate);
  }, [tasks, inspectedDate]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
            Study Planner
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Synchronized monthly schedule and focused weekly study blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="p-0.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-850 flex text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-charcoal-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-charcoal-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Weekly
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTaskToEdit(null);
              setSelectedDateForNewTask(getTodayDateString());
              setIsTaskModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Date Navigation & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3 rounded-xl shadow-card">
        {/* Navigation Arrows & Today Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-stone-200 dark:border-stone-750 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-850">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors border-l border-stone-200 dark:border-stone-750"
              aria-label="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-750 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            Today
          </button>

          <h2 className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200 ml-2 font-heading">
            {headingText}
          </h2>
        </div>

        {/* Filter by Subject */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-stone-700 dark:text-stone-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest-600"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Render */}
      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          tasks={filteredTasks}
          subjects={subjects}
          firstDayOfWeek={firstDayOfWeek}
          onSelectDate={(dateStr) => setInspectedDate(dateStr)}
          onAddTaskForDate={(dateStr) => {
            setTaskToEdit(null);
            setSelectedDateForNewTask(dateStr);
            setIsTaskModalOpen(true);
          }}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsTaskModalOpen(true);
          }}
          onToggleTaskComplete={handleToggleTaskComplete}
          onRescheduleTask={(task) => {
            setTaskToReschedule(task);
            setIsRescheduleModalOpen(true);
          }}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          tasks={filteredTasks}
          subjects={subjects}
          topics={topics}
          sessions={sessions}
          firstDayOfWeek={firstDayOfWeek}
          onAddTaskForDate={(dateStr) => {
            setTaskToEdit(null);
            setSelectedDateForNewTask(dateStr);
            setIsTaskModalOpen(true);
          }}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={(task) => setTaskToDelete(task)}
          onToggleTaskComplete={handleToggleTaskComplete}
          onRescheduleTask={(task) => {
            setTaskToReschedule(task);
            setIsRescheduleModalOpen(true);
          }}
        />
      )}

      {/* Inspected Day Tasks Modal */}
      {inspectedDate && (
        <Modal
          isOpen={!!inspectedDate}
          onClose={() => setInspectedDate(null)}
          title={formatReadableDate(inspectedDate)}
          description={`${inspectedDayTasks.length} task${inspectedDayTasks.length === 1 ? '' : 's'} scheduled`}
          maxWidth="md"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-850">
              <span className="text-xs text-stone-500">Day Schedule</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDateForNewTask(inspectedDate);
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Task
              </Button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {inspectedDayTasks.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center italic">
                  No tasks scheduled for this day.
                </p>
              ) : (
                inspectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        onClick={(e) => handleToggleTaskComplete(t, e)}
                        className="text-stone-400 hover:text-forest-600"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-forest-600" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-stone-300 dark:border-stone-600" />
                        )}
                      </button>
                      <span className={`font-medium truncate ${t.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setTaskToEdit(t);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setTaskToReschedule(t);
                          setIsRescheduleModalOpen(true);
                        }}
                        className="p-1 text-stone-400 hover:text-amber-600"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setTaskToDelete(t)}
                        className="p-1 text-stone-400 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        defaultDate={selectedDateForNewTask}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setTaskToReschedule(null);
        }}
        task={taskToReschedule}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Study Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        confirmLabel="Delete Task"
        variant="danger"
      />
    </div>
  );
};
