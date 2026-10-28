import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { StudyTask, DailyThought } from '../types';
import { Button } from '../components/common/Button';
import { TaskModal } from '../components/planner/TaskModal';
import { SubjectModal } from '../components/subjects/SubjectModal';
import {
  getTodayDateString,
  formatReadableDate,
  getGreetingForTimeOfDay,
  formatShortDate,
} from '../utils/date';
import { formatSecondsToHumanReadable } from '../utils/time';
import {
  CURATED_THOUGHTS,
  getDeterministicThoughtForDate,
  getRandomAlternativeThought,
} from '../services/thoughts';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Plus,
  BookOpen,
  ArrowRight,
  Sparkles,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = getTodayDateString();

  // Queries
  const tasks = useLiveQuery(() => db.studyTasks.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const sessions = useLiveQuery(() => db.studySessions.toArray()) || [];
  const thoughtSelection = useLiveQuery(() => db.dailyThoughtSelections.get(todayStr));

  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicMap = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);

  // Today's Thought state
  const [currentThought, setCurrentThought] = useState<DailyThought>(() => {
    return getDeterministicThoughtForDate(todayStr);
  });

  useEffect(() => {
    if (thoughtSelection) {
      const found = CURATED_THOUGHTS.find(t => t.id === thoughtSelection.thoughtId);
      if (found) setCurrentThought(found);
    } else {
      const det = getDeterministicThoughtForDate(todayStr);
      setCurrentThought(det);
    }
  }, [thoughtSelection, todayStr]);

  const handleNextThought = async () => {
    const next = getRandomAlternativeThought(currentThought.id);
    setCurrentThought(next);
    await db.dailyThoughtSelections.put({
      date: todayStr,
      thoughtId: next.id,
    });
  };

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<StudyTask | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.date === todayStr);
  }, [tasks, todayStr]);

  // Upcoming work (tasks scheduled within next 7 days, excluding today)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.date > todayStr && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [tasks, todayStr]);

  // Overdue incomplete tasks
  const overdueTasks = useMemo(() => {
    return tasks
      .filter(t => t.date < todayStr && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, todayStr]);

  // Progress summary metrics
  const todayCompletedTasks = todayTasks.filter(t => t.completed).length;
  const todayRemainingTasks = todayTasks.length - todayCompletedTasks;

  const todayFocusSeconds = useMemo(() => {
    return sessions
      .filter(s => s.startTime.split('T')[0] === todayStr)
      .reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  }, [sessions, todayStr]);

  const overallCompletedTopics = topics.filter(t => t.status === 'completed').length;
  const topicsNeedingRevision = topics.filter(t => t.needsRevision).length;

  const handleToggleTaskComplete = async (task: StudyTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !task.completed;
    await db.studyTasks.update(task.id, {
      completed: next,
      completedAt: next ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  };

  const startTaskFocus = (task: StudyTask) => {
    navigate(
      `/timer?taskId=${task.id}&subjectId=${task.subjectId || ''}&chapterId=${task.chapterId || ''}&topicId=${task.topicId || ''}&activity=${task.activityType}`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* A. Greeting & Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
            {getGreetingForTimeOfDay()}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {formatReadableDate(todayStr)}
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/timer')}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Focus Room
          </Button>
        </div>
      </div>

      {/* B. Today's Thought Card (Restrained & Persisted) */}
      <div className="p-4 rounded-xl border border-stone-200/90 dark:border-stone-850 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur-sm shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-forest-50 dark:bg-forest-950/40 text-forest-700 dark:text-forest-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 italic font-serif leading-relaxed">
              "{currentThought.text}"
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
              — {currentThought.author}
            </p>
          </div>
        </div>

        <button
          onClick={handleNextThought}
          className="text-[11px] text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 flex items-center gap-1 shrink-0 self-end sm:self-auto hover:underline"
          title="Display another reflection"
        >
          <RotateCcw className="w-3 h-3" /> Another reflection
        </button>
      </div>

      {/* Overdue Alert banner if any incomplete past tasks exist */}
      {overdueTasks.length > 0 && (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              You have <strong>{overdueTasks.length}</strong> overdue study task{overdueTasks.length > 1 ? 's' : ''} from previous days.
            </span>
          </div>
          <button
            onClick={() => navigate('/planner')}
            className="font-medium underline hover:text-rose-900 shrink-0"
          >
            Review in Planner
          </button>
        </div>
      )}

      {/* E. Progress Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3.5 rounded-xl shadow-card">
          <span className="text-[11px] text-stone-400 uppercase font-medium tracking-wider block mb-1">
            Tasks Done Today
          </span>
          <span className="text-xl font-bold font-mono text-forest-700 dark:text-forest-400">
            {todayCompletedTasks}
          </span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3.5 rounded-xl shadow-card">
          <span className="text-[11px] text-stone-400 uppercase font-medium tracking-wider block mb-1">
            Tasks Remaining
          </span>
          <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-200">
            {todayRemainingTasks}
          </span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3.5 rounded-xl shadow-card">
          <span className="text-[11px] text-stone-400 uppercase font-medium tracking-wider block mb-1">
            Focus Time Today
          </span>
          <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-200">
            {formatSecondsToHumanReadable(todayFocusSeconds)}
          </span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3.5 rounded-xl shadow-card">
          <span className="text-[11px] text-stone-400 uppercase font-medium tracking-wider block mb-1">
            Topics Completed
          </span>
          <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-200">
            {overallCompletedTopics} <span className="text-xs text-stone-400 font-normal">/ {topics.length}</span>
          </span>
        </div>

        <div
          onClick={() => navigate('/subjects')}
          className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-3.5 rounded-xl shadow-card cursor-pointer hover:border-amber-300 transition-colors col-span-2 sm:col-span-1"
        >
          <span className="text-[11px] text-stone-400 uppercase font-medium tracking-wider block mb-1">
            Needs Revision
          </span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-between">
            {topicsNeedingRevision}
            <ArrowRight className="w-4 h-4 text-stone-300" />
          </span>
        </div>
      </div>

      {/* Main Grid: C. Today's Tasks (Left) & D. Upcoming Work + F. Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 font-heading">
              <Calendar className="w-4 h-4 text-forest-700" />
              Today's Study Schedule ({todayTasks.length})
            </h2>

            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="text-xs text-forest-700 dark:text-forest-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-charcoal-900 text-center flex flex-col items-center">
              <CalendarDays className="w-8 h-8 text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                No tasks scheduled for today
              </p>
              <p className="text-xs text-stone-400 max-w-xs mt-1 mb-3">
                Plan your studies by creating a new task or adding topics from your syllabus.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Schedule Task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => {
                const sub = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
                const top = task.topicId ? topicMap.get(task.topicId) : undefined;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      task.completed
                        ? 'bg-stone-50/60 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800 text-stone-400'
                        : 'bg-white dark:bg-charcoal-900 border-stone-200 dark:border-stone-850 hover:border-stone-300 shadow-card'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        onClick={(e) => handleToggleTaskComplete(task, e)}
                        className="text-stone-400 hover:text-forest-700 shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-forest-700 dark:text-forest-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600" />
                        )}
                      </button>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold truncate ${
                            task.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'
                          }`}>
                            {task.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                          {sub && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: `${sub.color}15`,
                                color: sub.color,
                              }}
                            >
                              {sub.name}
                            </span>
                          )}
                          {top && (
                            <span className="text-[11px] text-stone-500 truncate max-w-[150px]">
                              › {top.name}
                            </span>
                          )}
                          <span className="capitalize font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded text-stone-600 dark:text-stone-300">
                            {task.activityType}
                          </span>
                          {task.estimatedMinutes && (
                            <span className="text-[10px] text-stone-400 flex items-center gap-0.5 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTaskFocus(task);
                        }}
                        className="text-forest-700 hover:text-forest-800 hover:bg-forest-50 dark:hover:bg-forest-950/40 text-xs"
                        icon={<Play className="w-3.5 h-3.5 fill-current" />}
                      >
                        Focus
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Work & Quick Actions */}
        <div className="space-y-6">
          {/* F. Quick Actions Box */}
          <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-4 shadow-card space-y-3">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                icon={<Plus className="w-3 h-3 text-forest-600" />}
                className="justify-start text-left"
              >
                Add Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubjectModalOpen(true)}
                icon={<BookOpen className="w-3 h-3 text-sky-600" />}
                className="justify-start text-left"
              >
                Add Subject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/timer')}
                icon={<Play className="w-3 h-3 text-emerald-600" />}
                className="justify-start text-left"
              >
                Focus Room
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/planner')}
                icon={<Calendar className="w-3 h-3 text-purple-600" />}
                className="justify-start text-left"
              >
                Open Planner
              </Button>
            </div>
          </div>

          {/* D. Upcoming Work */}
          <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Upcoming Deadlines & Work
              </h2>
              <button
                onClick={() => navigate('/planner')}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:underline"
              >
                View all
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">
                No upcoming tasks scheduled for the next 7 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((t) => {
                  const sub = t.subjectId ? subjectMap.get(t.subjectId) : undefined;
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/planner?date=${t.date}`)}
                      className="p-2 rounded-lg bg-stone-50 dark:bg-stone-850/60 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-stone-800 dark:text-stone-200 truncate">
                          {t.title}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">
                          {sub?.name || 'General'}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-stone-500 shrink-0 font-medium">
                        {formatShortDate(t.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        defaultDate={todayStr}
      />

      {/* Subject Creation Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
    </div>
  );
};
