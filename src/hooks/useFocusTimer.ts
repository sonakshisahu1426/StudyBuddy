import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  TimerPreset,
  TimerInterval,
  StudyActivityType,
  ActiveTimerState,
  StudySession,
  AppSettings,
} from '../types';
import { soundService } from '../services/audio';

export interface UseFocusTimerReturn {
  preset: TimerPreset | null;
  intervals: TimerInterval[];
  currentIntervalIndex: number;
  currentInterval: TimerInterval | null;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  activityType: StudyActivityType;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  taskId?: string;
  accumulatedFocusedSeconds: number;
  lastCompletedSession: StudySession | null;
  showSummaryModal: boolean;
  closeSummaryModal: () => void;
  // Controls
  selectPreset: (preset: TimerPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skipInterval: () => void;
  addSeconds: (seconds: number) => void;
  subtractSeconds: (seconds: number) => void;
  endSession: () => Promise<void>;
  updateContext: (params: {
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    taskId?: string;
    activityType?: StudyActivityType;
  }) => void;
}

export function useFocusTimer(): UseFocusTimerReturn {
  const presets = useLiveQuery(() => db.timerPresets.toArray());
  const settings = useLiveQuery(() => db.appSettings.get('app_settings')) as AppSettings | undefined;

  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);
  const [intervals, setIntervals] = useState<TimerInterval[]>([]);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  // Associated study context
  const [activityType, setActivityType] = useState<StudyActivityType>('study');
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [topicId, setTopicId] = useState<string | undefined>();
  const [taskId, setTaskId] = useState<string | undefined>();

  // Tracking actual focused study time (excluding breaks and pauses)
  const [accumulatedFocusedSeconds, setAccumulatedFocusedSeconds] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Completed session for modal summary
  const [lastCompletedSession, setLastCompletedSession] = useState<StudySession | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  const isTransitioningRef = useRef<boolean>(false);
  const hasRestoredRef = useRef<boolean>(false);

  // 1. Initial State / DB State Restoration
  useEffect(() => {
    if (hasRestoredRef.current || !presets || presets.length === 0) return;
    hasRestoredRef.current = true;

    async function restore() {
      const savedState = await db.activeTimerState.get('current');
      if (savedState && savedState.intervals && savedState.intervals.length > 0) {
        const foundPreset = presets?.find(p => p.id === savedState.presetId) || null;
        setActivePreset(foundPreset);
        setIntervals(savedState.intervals);
        setCurrentIntervalIndex(savedState.intervalIndex);
        setActivityType(savedState.activityType || 'study');
        setSubjectId(savedState.subjectId);
        setChapterId(savedState.chapterId);
        setTopicId(savedState.topicId);
        setTaskId(savedState.taskId);
        setAccumulatedFocusedSeconds(savedState.accumulatedFocusedSeconds || 0);
        setSessionStartTime(savedState.sessionStartTime);

        if (savedState.isRunning && savedState.targetEndTime) {
          const now = Date.now();
          if (now >= savedState.targetEndTime) {
            // Interval expired while page was away/closed
            setRemainingSeconds(0);
            setIsRunning(false);
            setIsPaused(false);
            setTargetEndTime(null);
          } else {
            // Resume running countdown
            const left = Math.round((savedState.targetEndTime - now) / 1000);
            setRemainingSeconds(left);
            setTargetEndTime(savedState.targetEndTime);
            setIsRunning(true);
            setIsPaused(false);
          }
        } else if (savedState.isPaused) {
          setRemainingSeconds(savedState.remainingSeconds);
          setIsRunning(false);
          setIsPaused(true);
          setTargetEndTime(null);
        } else {
          setRemainingSeconds(savedState.remainingSeconds);
          setIsRunning(false);
          setIsPaused(false);
          setTargetEndTime(null);
        }
      } else {
        // Load default preset
        const defaultPreset = presets?.find(p => p.isDefault) || presets?.[0];
        if (defaultPreset) {
          setActivePreset(defaultPreset);
          setIntervals(defaultPreset.intervals);
          setCurrentIntervalIndex(0);
          setRemainingSeconds((defaultPreset.intervals[0]?.durationMinutes || 25) * 60);
        }
      }
    }

    restore();
  }, [presets]);

  const currentInterval = intervals[currentIntervalIndex] || null;
  const totalSeconds = (currentInterval?.durationMinutes || 25) * 60;

  // Persist timer state to DB
  const persistState = useCallback(async (overrides?: Partial<ActiveTimerState>) => {
    if (!intervals.length) return;
    const state: ActiveTimerState = {
      id: 'current',
      presetId: activePreset?.id || 'custom',
      intervals,
      intervalIndex: currentIntervalIndex,
      isRunning,
      isPaused,
      remainingSeconds,
      targetEndTime,
      lastTick: Date.now(),
      subjectId,
      chapterId,
      topicId,
      taskId,
      activityType,
      accumulatedFocusedSeconds,
      sessionStartTime,
      ...overrides,
    };
    await db.activeTimerState.put(state);
  }, [
    activePreset?.id,
    intervals,
    currentIntervalIndex,
    isRunning,
    isPaused,
    remainingSeconds,
    targetEndTime,
    subjectId,
    chapterId,
    topicId,
    taskId,
    activityType,
    accumulatedFocusedSeconds,
    sessionStartTime,
  ]);

  // Main countdown tick effect using target timestamp
  useEffect(() => {
    if (!isRunning || !targetEndTime) return;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const left = Math.round((targetEndTime - now) / 1000);

      if (left <= 0) {
        window.clearInterval(intervalId);
        setRemainingSeconds(0);
        handleIntervalCompleted();
      } else {
        setRemainingSeconds(left);
        // If this interval is 'study', track accumulated focused time
        if (currentInterval?.type === 'study') {
          setAccumulatedFocusedSeconds(prev => prev + 1);
        }
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, targetEndTime, currentInterval?.type]);

  // Handle interval completion
  const handleIntervalCompleted = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (settings?.soundEnabled !== false) {
      soundService.playIntervalEndChime();
    }

    // Add any remaining seconds to focus time if this was a study interval
    const isStudy = currentInterval?.type === 'study';
    const finalFocusedSeconds = accumulatedFocusedSeconds + (isStudy ? Math.max(0, remainingSeconds) : 0);

    const isLast = currentIntervalIndex >= intervals.length - 1;

    if (isLast) {
      // Completed the full sequence! Record session
      await finalizeSession(finalFocusedSeconds, true);
      isTransitioningRef.current = false;
    } else {
      const nextIndex = currentIntervalIndex + 1;
      const nextInterval = intervals[nextIndex];
      const nextSec = nextInterval.durationMinutes * 60;

      setCurrentIntervalIndex(nextIndex);
      setRemainingSeconds(nextSec);

      if (settings?.autoAdvance) {
        const nextTarget = Date.now() + nextSec * 1000;
        setTargetEndTime(nextTarget);
        setIsRunning(true);
        setIsPaused(false);
        persistState({
          intervalIndex: nextIndex,
          remainingSeconds: nextSec,
          targetEndTime: nextTarget,
          isRunning: true,
          isPaused: false,
        });
      } else {
        setIsRunning(false);
        setIsPaused(false);
        setTargetEndTime(null);
        persistState({
          intervalIndex: nextIndex,
          remainingSeconds: nextSec,
          targetEndTime: null,
          isRunning: false,
          isPaused: false,
        });
      }
      isTransitioningRef.current = false;
    }
  }, [
    currentInterval,
    currentIntervalIndex,
    intervals,
    settings?.soundEnabled,
    settings?.autoAdvance,
    accumulatedFocusedSeconds,
    remainingSeconds,
    persistState,
  ]);

  // Finalize and record session to IndexedDB
  const finalizeSession = async (focusedSeconds: number, completedNaturally: boolean) => {
    setIsRunning(false);
    setIsPaused(false);
    setTargetEndTime(null);

    // Only record if actual focus time was spent (> 10 seconds)
    if (focusedSeconds >= 10) {
      let subjectSnapshot: string | undefined;
      let topicSnapshot: string | undefined;

      if (subjectId) {
        const s = await db.subjects.get(subjectId);
        subjectSnapshot = s?.name;
      }
      if (topicId) {
        const t = await db.topics.get(topicId);
        topicSnapshot = t?.name;
      }

      // Calculate planned duration in minutes across all study intervals in sequence
      const plannedMins = intervals
        .filter(i => i.type === 'study')
        .reduce((sum, i) => sum + i.durationMinutes, 0);

      const newSession: StudySession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subjectId,
        chapterId,
        topicId,
        taskId,
        subjectNameSnapshot: subjectSnapshot,
        topicNameSnapshot: topicSnapshot,
        activityType,
        startTime: sessionStartTime || new Date(Date.now() - focusedSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        actualDurationSeconds: Math.round(focusedSeconds),
        plannedDurationMinutes: plannedMins || 25,
        completed: completedNaturally,
        createdAt: new Date().toISOString(),
      };

      await db.studySessions.add(newSession);
      setLastCompletedSession(newSession);
      setShowSummaryModal(true);
    }

    // Reset sequence to beginning
    setCurrentIntervalIndex(0);
    const resetSec = (intervals[0]?.durationMinutes || 25) * 60;
    setRemainingSeconds(resetSec);
    setAccumulatedFocusedSeconds(0);
    setSessionStartTime(null);

    await db.activeTimerState.clear();
  };

  // Timer Controls
  const selectPreset = (newPreset: TimerPreset) => {
    setActivePreset(newPreset);
    setIntervals(newPreset.intervals);
    setCurrentIntervalIndex(0);
    const firstSec = (newPreset.intervals[0]?.durationMinutes || 25) * 60;
    setRemainingSeconds(firstSec);
    setIsRunning(false);
    setIsPaused(false);
    setTargetEndTime(null);
    setAccumulatedFocusedSeconds(0);
    setSessionStartTime(null);

    persistState({
      presetId: newPreset.id,
      intervals: newPreset.intervals,
      intervalIndex: 0,
      remainingSeconds: firstSec,
      isRunning: false,
      isPaused: false,
      targetEndTime: null,
      accumulatedFocusedSeconds: 0,
      sessionStartTime: null,
    });
  };

  const start = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date().toISOString());
    }
    const end = Date.now() + remainingSeconds * 1000;
    setTargetEndTime(end);
    setIsRunning(true);
    setIsPaused(false);

    persistState({
      targetEndTime: end,
      isRunning: true,
      isPaused: false,
      sessionStartTime: sessionStartTime || new Date().toISOString(),
    });
  };

  const pause = () => {
    if (!isRunning || !targetEndTime) return;
    const now = Date.now();
    const left = Math.max(0, Math.round((targetEndTime - now) / 1000));
    setRemainingSeconds(left);
    setIsRunning(false);
    setIsPaused(true);
    setTargetEndTime(null);

    persistState({
      remainingSeconds: left,
      targetEndTime: null,
      isRunning: false,
      isPaused: true,
    });
  };

  const resume = () => {
    const end = Date.now() + remainingSeconds * 1000;
    setTargetEndTime(end);
    setIsRunning(true);
    setIsPaused(false);

    persistState({
      targetEndTime: end,
      isRunning: true,
      isPaused: false,
    });
  };

  const reset = () => {
    const curSec = (currentInterval?.durationMinutes || 25) * 60;
    setRemainingSeconds(curSec);
    setIsRunning(false);
    setIsPaused(false);
    setTargetEndTime(null);

    persistState({
      remainingSeconds: curSec,
      targetEndTime: null,
      isRunning: false,
      isPaused: false,
    });
  };

  const skipInterval = () => {
    if (currentIntervalIndex < intervals.length - 1) {
      const nextIndex = currentIntervalIndex + 1;
      const nextSec = intervals[nextIndex].durationMinutes * 60;
      setCurrentIntervalIndex(nextIndex);
      setRemainingSeconds(nextSec);
      setIsRunning(false);
      setIsPaused(false);
      setTargetEndTime(null);

      persistState({
        intervalIndex: nextIndex,
        remainingSeconds: nextSec,
        targetEndTime: null,
        isRunning: false,
        isPaused: false,
      });
    } else {
      // Ending last interval
      endSession();
    }
  };

  const addSeconds = (secs: number) => {
    const updated = remainingSeconds + secs;
    setRemainingSeconds(updated);
    if (isRunning && targetEndTime) {
      const newTarget = targetEndTime + secs * 1000;
      setTargetEndTime(newTarget);
      persistState({ remainingSeconds: updated, targetEndTime: newTarget });
    } else {
      persistState({ remainingSeconds: updated });
    }
  };

  const subtractSeconds = (secs: number) => {
    const updated = Math.max(10, remainingSeconds - secs);
    setRemainingSeconds(updated);
    if (isRunning && targetEndTime) {
      const newTarget = Date.now() + updated * 1000;
      setTargetEndTime(newTarget);
      persistState({ remainingSeconds: updated, targetEndTime: newTarget });
    } else {
      persistState({ remainingSeconds: updated });
    }
  };

  const endSession = async () => {
    await finalizeSession(accumulatedFocusedSeconds, false);
  };

  const updateContext = (params: {
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    taskId?: string;
    activityType?: StudyActivityType;
  }) => {
    if (params.subjectId !== undefined) setSubjectId(params.subjectId);
    if (params.chapterId !== undefined) setChapterId(params.chapterId);
    if (params.topicId !== undefined) setTopicId(params.topicId);
    if (params.taskId !== undefined) setTaskId(params.taskId);
    if (params.activityType !== undefined) setActivityType(params.activityType);

    persistState({
      subjectId: params.subjectId !== undefined ? params.subjectId : subjectId,
      chapterId: params.chapterId !== undefined ? params.chapterId : chapterId,
      topicId: params.topicId !== undefined ? params.topicId : topicId,
      taskId: params.taskId !== undefined ? params.taskId : taskId,
      activityType: params.activityType !== undefined ? params.activityType : activityType,
    });
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setLastCompletedSession(null);
  };

  return {
    preset: activePreset,
    intervals,
    currentIntervalIndex,
    currentInterval,
    remainingSeconds,
    totalSeconds,
    isRunning,
    isPaused,
    activityType,
    subjectId,
    chapterId,
    topicId,
    taskId,
    accumulatedFocusedSeconds,
    lastCompletedSession,
    showSummaryModal,
    closeSummaryModal,
    selectPreset,
    start,
    pause,
    resume,
    reset,
    skipInterval,
    addSeconds,
    subtractSeconds,
    endSession,
    updateContext,
  };
}
