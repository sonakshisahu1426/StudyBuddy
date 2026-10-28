import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ProgressBar } from '../components/common/ProgressBar';
import { formatSecondsToHumanReadable } from '../utils/time';
import { getTodayDateString, isDateOverdue } from '../utils/date';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const chapters = useLiveQuery(() => db.chapters.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const tasks = useLiveQuery(() => db.studyTasks.toArray()) || [];
  const sessions = useLiveQuery(() => db.studySessions.toArray()) || [];

  const todayStr = getTodayDateString();
  const now = new Date();

  // 1. Overall Syllabus Progress Calculations
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.status === 'completed').length;
  const inProgressTopics = topics.filter(t => t.status === 'in_progress').length;
  const notStartedTopics = topics.filter(t => t.status === 'not_started').length;
  const overallCompletionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // 2. Study Time Calculations
  const totalFocusSeconds = useMemo(() => {
    return sessions.reduce((sum, s) => sum + s.actualDurationSeconds, 0);
  }, [sessions]);

  // Today's focus time
  const todayFocusSeconds = useMemo(() => {
    return sessions
      .filter(s => s.startTime.split('T')[0] === todayStr)
      .reduce((sum, s) => sum + s.actualDurationSeconds, 0);
  }, [sessions, todayStr]);

  // This week's focus time
  const weekStartStr = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0], [now]);
  const weekEndStr = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0], [now]);

  const thisWeekFocusSeconds = useMemo(() => {
    return sessions
      .filter(s => {
        const d = s.startTime.split('T')[0];
        return d >= weekStartStr && d <= weekEndStr;
      })
      .reduce((sum, s) => sum + s.actualDurationSeconds, 0);
  }, [sessions, weekStartStr, weekEndStr]);

  // This month's focus time
  const monthStartStr = useMemo(() => startOfMonth(now).toISOString().split('T')[0], [now]);
  const monthEndStr = useMemo(() => endOfMonth(now).toISOString().split('T')[0], [now]);

  const thisMonthFocusSeconds = useMemo(() => {
    return sessions
      .filter(s => {
        const d = s.startTime.split('T')[0];
        return d >= monthStartStr && d <= monthEndStr;
      })
      .reduce((sum, s) => sum + s.actualDurationSeconds, 0);
  }, [sessions, monthStartStr, monthEndStr]);

  // 3. Focus time by subject
  const subjectTimeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const key = s.subjectId || 'unassigned';
      map.set(key, (map.get(key) || 0) + s.actualDurationSeconds);
    }

    return subjects.map(sub => ({
      subject: sub,
      seconds: map.get(sub.id) || 0,
      pct: totalFocusSeconds > 0 ? Math.round(((map.get(sub.id) || 0) / totalFocusSeconds) * 100) : 0,
    })).sort((a, b) => b.seconds - a.seconds);
  }, [subjects, sessions, totalFocusSeconds]);

  // 4. Focus time by activity type (Study vs Practice vs Revise)
  const activityBreakdown = useMemo(() => {
    let studySec = 0;
    let practiceSec = 0;
    let reviseSec = 0;

    for (const s of sessions) {
      if (s.activityType === 'study') studySec += s.actualDurationSeconds;
      else if (s.activityType === 'practice') practiceSec += s.actualDurationSeconds;
      else if (s.activityType === 'revise') reviseSec += s.actualDurationSeconds;
    }

    const total = studySec + practiceSec + reviseSec;
    return {
      studySec,
      studyPct: total > 0 ? Math.round((studySec / total) * 100) : 0,
      practiceSec,
      practicePct: total > 0 ? Math.round((practiceSec / total) * 100) : 0,
      reviseSec,
      revisePct: total > 0 ? Math.round((reviseSec / total) * 100) : 0,
    };
  }, [sessions]);

  // 5. Revision Statistics
  const revisionTopics = topics.filter(t => t.needsRevision);
  const overdueRevisionTopics = revisionTopics.filter(t => t.revisionDate && isDateOverdue(t.revisionDate));
  const revisionTasks = tasks.filter(t => t.activityType === 'revise');
  const completedRevisionTasks = revisionTasks.filter(t => t.completed);

  // 6. Weekly summary: planned vs completed tasks
  const weekTasks = useMemo(() => {
    return tasks.filter(t => t.date >= weekStartStr && t.date <= weekEndStr);
  }, [tasks, weekStartStr, weekEndStr]);

  const weekTasksPlanned = weekTasks.length;
  const weekTasksCompleted = weekTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
          Study Progress & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Real metrics derived strictly from your local study records and focus sessions.
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Focus Time */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-4 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">All-Time Focus</span>
            <Clock className="w-4 h-4 text-forest-700 dark:text-forest-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHumanReadable(totalFocusSeconds)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Excludes breaks and paused time
          </p>
        </div>

        {/* Syllabus Completion */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-4 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Syllabus Covered</span>
            <CheckCircle2 className="w-4 h-4 text-forest-700 dark:text-forest-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {overallCompletionPct}%
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {completedTopics} of {totalTopics} topics complete
          </p>
        </div>

        {/* Today's Focus */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-4 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Today</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHumanReadable(todayFocusSeconds)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {formatSecondsToHumanReadable(thisWeekFocusSeconds)} this week • {formatSecondsToHumanReadable(thisMonthFocusSeconds)} this month
          </p>
        </div>

        {/* Revision Queue */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 p-4 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Revision</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {revisionTopics.length}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {overdueRevisionTopics.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {overdueRevisionTopics.length} overdue
              </span>
            ) : (
              'All revisions up to date'
            )}
          </p>
        </div>
      </div>

      {/* Syllabus Progress Detailed Breakdown */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2 font-heading">
            <BookOpen className="w-4 h-4 text-forest-700" />
            Syllabus Completion by Subject
          </h2>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>{subjects.length} Subjects</span>
            <span>•</span>
            <span>{chapters.length} Chapters</span>
            <span>•</span>
            <span>{inProgressTopics} In Progress</span>
            <span>•</span>
            <span>{notStartedTopics} Not Started</span>
          </div>
        </div>

        {subjects.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-4">
            No subjects created yet. Add subjects to see completion rates.
          </p>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => {
              const subTopics = topics.filter(t => t.subjectId === sub.id);
              const comp = subTopics.filter(t => t.status === 'completed').length;
              const inProg = subTopics.filter(t => t.status === 'in_progress').length;
              const pct = subTopics.length > 0 ? Math.round((comp / subTopics.length) * 100) : 0;

              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                      <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                        {sub.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-stone-400 shrink-0">
                      <span>{comp}/{subTopics.length} topics ({inProg} in progress)</span>
                      <strong className="text-stone-700 dark:text-stone-300">{pct}%</strong>
                    </div>
                  </div>
                  <ProgressBar progress={pct} color={sub.color} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Study Activity Breakdown & Focus Time by Subject */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activity Distribution */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2 font-heading">
            <Award className="w-4 h-4 text-forest-700" />
            Focus Time by Activity Type
          </h2>

          {totalFocusSeconds === 0 ? (
            <p className="text-xs text-stone-400 italic py-4">
              No recorded focus sessions yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {/* Study */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-stone-600 dark:text-stone-300">
                  <span className="font-medium">Study (New Concepts)</span>
                  <span className="font-mono">{formatSecondsToHumanReadable(activityBreakdown.studySec)} ({activityBreakdown.studyPct}%)</span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-600 rounded-full" style={{ width: `${activityBreakdown.studyPct}%` }} />
                </div>
              </div>

              {/* Practice */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-stone-600 dark:text-stone-300">
                  <span className="font-medium">Practice (Exercises & Problem Sets)</span>
                  <span className="font-mono">{formatSecondsToHumanReadable(activityBreakdown.practiceSec)} ({activityBreakdown.practicePct}%)</span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 rounded-full" style={{ width: `${activityBreakdown.practicePct}%` }} />
                </div>
              </div>

              {/* Revise */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-stone-600 dark:text-stone-300">
                  <span className="font-medium">Revise (Spaced Review)</span>
                  <span className="font-mono">{formatSecondsToHumanReadable(activityBreakdown.reviseSec)} ({activityBreakdown.revisePct}%)</span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: `${activityBreakdown.revisePct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Focus Time by Subject Breakdown */}
        <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2 font-heading">
            <Layers className="w-4 h-4 text-forest-700" />
            Focus Time by Subject
          </h2>

          {totalFocusSeconds === 0 ? (
            <p className="text-xs text-stone-400 italic py-4">
              No recorded focus sessions yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {subjectTimeBreakdown.map((item) => (
                <div key={item.subject.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-stone-700 dark:text-stone-300 truncate">
                      {item.subject.name}
                    </span>
                    <span className="font-mono text-stone-500 shrink-0 ml-2">
                      {formatSecondsToHumanReadable(item.seconds)} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: item.subject.color || '#2c5649',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revision and Weekly Execution */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2 font-heading">
          <CalendarCheck className="w-4 h-4 text-forest-700" />
          Weekly Execution & Revision Health
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Weekly Tasks Planned</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-base">{weekTasksPlanned}</span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Weekly Tasks Done</span>
            <span className="font-bold text-forest-700 dark:text-forest-400 font-mono text-base">
              {weekTasksCompleted} ({weekTasksPlanned > 0 ? Math.round((weekTasksCompleted / weekTasksPlanned) * 100) : 0}%)
            </span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Focus Time This Week</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-base">
              {formatSecondsToHumanReadable(thisWeekFocusSeconds)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Revision Tasks Completed</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-base">
              {completedRevisionTasks.length} / {revisionTasks.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
