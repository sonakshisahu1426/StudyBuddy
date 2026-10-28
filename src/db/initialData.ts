import { AppSettings, TimerPreset } from '../types';

export const DEFAULT_PRESETS: TimerPreset[] = [
  {
    id: 'preset-deep-focus',
    name: 'Deep Focus',
    isDefault: true,
    intervals: [
      { id: 'int-1', name: 'Focus Session', durationMinutes: 50, type: 'study' },
      { id: 'int-2', name: 'Rest & Stretch', durationMinutes: 10, type: 'short_break' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-short-focus',
    name: 'Short Focus (Classic Pomodoro)',
    isDefault: false,
    intervals: [
      { id: 'int-3', name: 'Pomodoro 1', durationMinutes: 25, type: 'study' },
      { id: 'int-4', name: 'Short Break', durationMinutes: 5, type: 'short_break' },
      { id: 'int-5', name: 'Pomodoro 2', durationMinutes: 25, type: 'study' },
      { id: 'int-6', name: 'Short Break', durationMinutes: 5, type: 'short_break' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-extended-focus',
    name: 'Extended Focus',
    isDefault: false,
    intervals: [
      { id: 'int-7', name: 'Deep Work Block', durationMinutes: 90, type: 'study' },
      { id: 'int-8', name: 'Recovery Break', durationMinutes: 15, type: 'long_break' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  theme: 'system',
  autoAdvance: false,
  soundEnabled: true,
  firstDayOfWeek: 1, // Monday
  timeFormat: '12h',
  defaultTaskDuration: 45,
  defaultPresetId: 'preset-deep-focus',
};

// Sample Demo Data for optional one-click testing in Settings
export const SAMPLE_DEMO_DATA = {
  subjects: [
    {
      id: 'sub-cs101',
      name: 'Computer Systems & Architecture',
      description: 'Digital logic, memory hierarchy, CPU instruction set architecture, and cache management.',
      color: '#2c5649', // Forest green
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-math201',
      name: 'Linear Algebra & Multivariable Calculus',
      description: 'Vector spaces, eigenvalues, matrix decompositions, and gradient optimization.',
      color: '#1e3a5f', // Navy
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-phil102',
      name: 'Epistemology & Cognitive Philosophy',
      description: 'Theories of truth, justification, perception, and formal reasoning methods.',
      color: '#7c3aed', // Purple
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  chapters: [
    // CS101
    {
      id: 'chap-cpu',
      subjectId: 'sub-cs101',
      name: 'CPU Architecture & Instruction Pipeline',
      order: 1,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'chap-mem',
      subjectId: 'sub-cs101',
      name: 'Memory Hierarchy & Cache Coherence',
      order: 2,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Math201
    {
      id: 'chap-vectors',
      subjectId: 'sub-math201',
      name: 'Vector Spaces & Subspaces',
      order: 1,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'chap-eigen',
      subjectId: 'sub-math201',
      name: 'Eigenvalues & Diagonalization',
      order: 2,
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  topics: [
    {
      id: 'top-1',
      chapterId: 'chap-cpu',
      subjectId: 'sub-cs101',
      name: 'RISC-V 5-Stage Pipelining Hazards',
      status: 'completed' as const,
      difficulty: 'hard' as const,
      needsRevision: true,
      revisionDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      estimatedMinutes: 60,
      notes: 'Review data forwarding and stall cycle penalty calculations.',
      order: 1,
      createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top-2',
      chapterId: 'chap-cpu',
      subjectId: 'sub-cs101',
      name: 'Branch Prediction Strategies',
      status: 'in_progress' as const,
      difficulty: 'medium' as const,
      needsRevision: false,
      revisionDate: null,
      estimatedMinutes: 45,
      notes: 'Compare 2-bit saturating counters with tournament predictors.',
      order: 2,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top-3',
      chapterId: 'chap-mem',
      subjectId: 'sub-cs101',
      name: 'Set-Associative Cache Mapping',
      status: 'not_started' as const,
      difficulty: 'medium' as const,
      needsRevision: false,
      revisionDate: null,
      estimatedMinutes: 50,
      notes: null,
      order: 1,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top-4',
      chapterId: 'chap-vectors',
      subjectId: 'sub-math201',
      name: 'Basis, Dimension, and Orthogonal Projection',
      status: 'completed' as const,
      difficulty: 'easy' as const,
      needsRevision: false,
      revisionDate: null,
      estimatedMinutes: 40,
      notes: 'Gram-Schmidt process worked examples are in notebook 2.',
      order: 1,
      createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top-5',
      chapterId: 'chap-eigen',
      subjectId: 'sub-math201',
      name: 'Characteristic Polynomial & Spectral Theorem',
      status: 'in_progress' as const,
      difficulty: 'hard' as const,
      needsRevision: true,
      revisionDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], // Overdue revision demo
      estimatedMinutes: 75,
      notes: 'Focus on symmetric matrix properties.',
      order: 1,
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
