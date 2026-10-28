export type TopicStatus = 'not_started' | 'in_progress' | 'completed';
export type TopicDifficulty = 'easy' | 'medium' | 'hard';
export type StudyActivityType = 'study' | 'practice' | 'revise';
export type TaskCategory = 'task' | 'deadline';
export type TimerIntervalType = 'study' | 'short_break' | 'long_break' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  status: TopicStatus;
  difficulty: TopicDifficulty;
  needsRevision: boolean;
  revisionDate: string | null; // YYYY-MM-DD
  estimatedMinutes: number | null;
  notes: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD local
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  activityType: StudyActivityType;
  estimatedMinutes?: number;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimerInterval {
  id: string;
  name: string;
  durationMinutes: number;
  type: TimerIntervalType;
}

export interface TimerPreset {
  id: string;
  name: string;
  intervals: TimerInterval[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  taskId?: string;
  subjectNameSnapshot?: string;
  topicNameSnapshot?: string;
  activityType: StudyActivityType;
  startTime: string; // ISO
  endTime: string; // ISO
  actualDurationSeconds: number; // Focused study time strictly; breaks & paused periods excluded
  plannedDurationMinutes: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface ActiveTimerState {
  id: 'current';
  presetId: string;
  intervals: TimerInterval[];
  intervalIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  targetEndTime: number | null; // Epoch ms
  lastTick: number; // Epoch ms
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  taskId?: string;
  activityType: StudyActivityType;
  accumulatedFocusedSeconds: number;
  sessionStartTime: string | null; // ISO
}

export interface AppSettings {
  id: 'app_settings';
  theme: ThemeMode;
  autoAdvance: boolean;
  soundEnabled: boolean;
  firstDayOfWeek: 0 | 1; // 1 = Monday, 0 = Sunday
  timeFormat: '12h' | '24h';
  defaultTaskDuration: number; // Minutes
  defaultPresetId: string;
}

export interface DailyThought {
  id: string;
  text: string;
  author: string;
}

export interface DailyThoughtSelection {
  date: string; // YYYY-MM-DD
  thoughtId: string;
}

export interface BackupData {
  version: number;
  exportDate: string;
  data: {
    subjects: Subject[];
    chapters: Chapter[];
    topics: Topic[];
    studyTasks: StudyTask[];
    timerPresets: TimerPreset[];
    studySessions: StudySession[];
    appSettings?: AppSettings;
    dailyThoughtSelections?: DailyThoughtSelection[];
  };
}
