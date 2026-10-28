import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { TimerPreset, StudyActivityType, Subject, Chapter, Topic } from '../types';
import { Button } from '../components/common/Button';
import { IntervalSequenceBar } from '../components/timer/IntervalSequenceBar';
import { PresetEditorModal } from '../components/timer/PresetEditorModal';
import { SessionSummaryModal } from '../components/timer/SessionSummaryModal';
import { SessionHistoryList } from '../components/timer/SessionHistoryList';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatSecondsToTime, formatSecondsToHumanReadable } from '../utils/time';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  StopCircle,
  Settings2,
  BookOpen,
  History,
} from 'lucide-react';

import { Copy, Trash2 } from 'lucide-react';

export const FocusRoomPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subjectIdParam = searchParams.get('subjectId');
  const chapterIdParam = searchParams.get('chapterId');
  const topicIdParam = searchParams.get('topicId');
  const taskIdParam = searchParams.get('taskId');
  const activityParam = searchParams.get('activity') as StudyActivityType | null;

  const timer = useFocusTimer();

  const presets = useLiveQuery(() => db.timerPresets.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const chapters = useLiveQuery(() => db.chapters.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const pastSessions = useLiveQuery(() => db.studySessions.reverse().sortBy('createdAt')) || [];

  // Preset editor modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<TimerPreset | null>(null);

  // Deletion confirm
  const [presetToDelete, setPresetToDelete] = useState<TimerPreset | null>(null);

  // Sync query parameters into timer context if provided
  useEffect(() => {
    if (subjectIdParam || chapterIdParam || topicIdParam || taskIdParam || activityParam) {
      timer.updateContext({
        subjectId: subjectIdParam || undefined,
        chapterId: chapterIdParam || undefined,
        topicId: topicIdParam || undefined,
        taskId: taskIdParam || undefined,
        activityType: activityParam || undefined,
      });
    }
  }, [subjectIdParam, chapterIdParam, topicIdParam, taskIdParam, activityParam]);

  // Context selection options
  const availableChapters = chapters.filter((c: Chapter) => c.subjectId === timer.subjectId);
  const availableTopics = topics.filter((t: Topic) => t.chapterId === timer.chapterId);

  const isCurrentIntervalStudy = timer.currentInterval?.type === 'study';

  const handleDuplicatePreset = async (preset: TimerPreset) => {
    const copy: TimerPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${preset.name} (Copy)`,
      intervals: JSON.parse(JSON.stringify(preset.intervals)),
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.timerPresets.add(copy);
  };

  const handleDeletePreset = async () => {
    if (!presetToDelete) return;
    if (presets.length <= 1) return;
    await db.timerPresets.delete(presetToDelete.id);
    if (timer.preset?.id === presetToDelete.id) {
      const remaining = presets.filter((p: TimerPreset) => p.id !== presetToDelete.id);
      if (remaining.length > 0) {
        timer.selectPreset(remaining[0]);
      }
    }
    setPresetToDelete(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
            Focus Room
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Distraction-free, timestamp-accurate Pomodoro sessions for deep study.
          </p>
        </div>

        {/* Preset Selector & Management */}
        <div className="flex items-center gap-1.5">
          <select
            value={timer.preset?.id || ''}
            onChange={(e) => {
              const p = presets.find((item: TimerPreset) => item.id === e.target.value);
              if (p) timer.selectPreset(p);
            }}
            disabled={timer.isRunning}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-600 shadow-subtle disabled:opacity-50 max-w-[150px] sm:max-w-xs truncate"
          >
            {presets.map((p: TimerPreset) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPresetToEdit(timer.preset);
              setIsPresetModalOpen(true);
            }}
            disabled={timer.isRunning}
            title="Edit Preset"
            icon={<Settings2 className="w-3.5 h-3.5" />}
          />

          {timer.preset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDuplicatePreset(timer.preset!)}
              disabled={timer.isRunning}
              title="Duplicate Preset"
              icon={<Copy className="w-3.5 h-3.5" />}
            />
          )}

          {presets.length > 1 && timer.preset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetToDelete(timer.preset)}
              disabled={timer.isRunning}
              title="Delete Preset"
              className="text-rose-600 hover:text-rose-700"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPresetToEdit(null);
              setIsPresetModalOpen(true);
            }}
            disabled={timer.isRunning}
            title="New Preset"
            icon={<Plus className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Main Focus Chamber Card */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center text-center space-y-6">
        {/* Interval Sequence Visualizer */}
        <div className="w-full max-w-lg">
          <IntervalSequenceBar
            intervals={timer.intervals}
            currentIndex={timer.currentIntervalIndex}
          />
        </div>

        {/* Current Interval Banner */}
        <div className="space-y-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            isCurrentIntervalStudy
              ? 'bg-forest-100 text-forest-800 dark:bg-forest-950/80 dark:text-forest-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
          }`}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{
              backgroundColor: isCurrentIntervalStudy ? '#2c5649' : '#b47422'
            }} />
            {timer.currentInterval?.name || 'Focus Interval'}
          </span>

          <p className="text-xs text-stone-400">
            {isCurrentIntervalStudy ? 'Deep focused study time' : 'Rest, stretch, and relax'}
          </p>
        </div>

        {/* Giant Accurate Countdown Display */}
        <div className="font-mono text-6xl sm:text-8xl font-bold tracking-tighter text-stone-900 dark:text-stone-100 select-none py-2">
          {formatSecondsToTime(timer.remainingSeconds)}
        </div>

        {/* Timer Time Adjustment Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => timer.subtractSeconds(60)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-mono text-stone-600 dark:text-stone-300 transition-colors"
            title="Subtract 1 minute"
          >
            -1m
          </button>
          <button
            onClick={() => timer.addSeconds(60)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-mono text-stone-600 dark:text-stone-300 transition-colors"
            title="Add 1 minute"
          >
            +1m
          </button>
          <button
            onClick={() => timer.addSeconds(300)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-mono text-stone-600 dark:text-stone-300 transition-colors"
            title="Add 5 minutes"
          >
            +5m
          </button>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Start / Pause / Resume */}
          {!timer.isRunning && !timer.isPaused ? (
            <Button
              variant="primary"
              size="lg"
              onClick={timer.start}
              className="px-8 shadow-card"
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              Start Focus
            </Button>
          ) : timer.isRunning ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={timer.pause}
              className="px-8"
              icon={<Pause className="w-5 h-5" />}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={timer.resume}
              className="px-8 shadow-card"
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              Resume
            </Button>
          )}

          {/* Reset */}
          <Button
            variant="ghost"
            size="md"
            onClick={timer.reset}
            title="Reset current interval"
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>

          {/* Skip */}
          <Button
            variant="ghost"
            size="md"
            onClick={timer.skipInterval}
            title="Skip to next interval"
            icon={<SkipForward className="w-4 h-4" />}
          >
            Skip
          </Button>

          {/* End Session Manually */}
          <Button
            variant="ghost"
            size="md"
            onClick={timer.endSession}
            title="End session and record focus time"
            className="text-stone-500 hover:text-rose-600"
            icon={<StopCircle className="w-4 h-4" />}
          >
            End
          </Button>
        </div>

        {/* Accumulated focus time for this sitting */}
        {timer.accumulatedFocusedSeconds > 0 && (
          <div className="text-xs text-stone-400 font-mono">
            Accumulated focus time in session: <strong>{formatSecondsToHumanReadable(timer.accumulatedFocusedSeconds)}</strong>
          </div>
        )}
      </div>

      {/* Session Context Bar (Subject, Topic, Activity) */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-forest-700 dark:text-forest-400" />
          <h2 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            Study Context & Topic Linking
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Subject */}
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Subject</label>
            <select
              value={timer.subjectId || ''}
              onChange={(e) => {
                timer.updateContext({
                  subjectId: e.target.value || undefined,
                  chapterId: undefined,
                  topicId: undefined,
                });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="">General Study (No Subject)</option>
              {subjects.map((s: Subject) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Chapter</label>
            <select
              value={timer.chapterId || ''}
              onChange={(e) => {
                timer.updateContext({
                  chapterId: e.target.value || undefined,
                  topicId: undefined,
                });
              }}
              disabled={!timer.subjectId}
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 text-stone-900 dark:text-stone-100 disabled:opacity-50"
            >
              <option value="">None</option>
              {availableChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Topic</label>
            <select
              value={timer.topicId || ''}
              onChange={(e) => timer.updateContext({ topicId: e.target.value || undefined })}
              disabled={!timer.chapterId}
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 text-stone-900 dark:text-stone-100 disabled:opacity-50"
            >
              <option value="">None</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Activity</label>
            <select
              value={timer.activityType}
              onChange={(e) => timer.updateContext({ activityType: e.target.value as StudyActivityType })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="study">Study</option>
              <option value="practice">Practice</option>
              <option value="revise">Revise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Session History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-500" />
            <h2 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Recent Focus History ({pastSessions.length})
            </h2>
          </div>
        </div>

        <SessionHistoryList
          sessions={pastSessions.slice(0, 10)}
          subjects={subjects}
          topics={topics}
        />
      </div>

      {/* Preset Editor Modal */}
      <PresetEditorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        presetToEdit={presetToEdit}
        onSaved={(saved) => timer.selectPreset(saved)}
      />

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={timer.showSummaryModal}
        onClose={timer.closeSummaryModal}
        session={timer.lastCompletedSession}
      />

      {/* Preset Deletion Confirmation */}
      <ConfirmDialog
        isOpen={!!presetToDelete}
        onClose={() => setPresetToDelete(null)}
        onConfirm={handleDeletePreset}
        title="Delete Timer Preset"
        message={`Are you sure you want to delete preset "${presetToDelete?.name}"?`}
        confirmLabel="Delete Preset"
        variant="danger"
      />
    </div>
  );
};
