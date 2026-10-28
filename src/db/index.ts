import Dexie, { Table } from 'dexie';
import {
  Subject,
  Chapter,
  Topic,
  StudyTask,
  TimerPreset,
  StudySession,
  ActiveTimerState,
  AppSettings,
  DailyThoughtSelection,
} from '../types';
import { DEFAULT_PRESETS, DEFAULT_SETTINGS, SAMPLE_DEMO_DATA } from './initialData';

export class StudyBuddyDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  topics!: Table<Topic, string>;
  studyTasks!: Table<StudyTask, string>;
  timerPresets!: Table<TimerPreset, string>;
  studySessions!: Table<StudySession, string>;
  activeTimerState!: Table<ActiveTimerState, string>;
  appSettings!: Table<AppSettings, string>;
  dailyThoughtSelections!: Table<DailyThoughtSelection, string>;

  constructor() {
    super('StudyBuddyDB');
    this.version(1).stores({
      subjects: 'id, name, createdAt',
      chapters: 'id, subjectId, order, createdAt',
      topics: 'id, chapterId, subjectId, status, difficulty, needsRevision, revisionDate, order, createdAt',
      studyTasks: 'id, date, subjectId, chapterId, topicId, completed, activityType, category, createdAt',
      timerPresets: 'id, name, isDefault, createdAt',
      studySessions: 'id, subjectId, topicId, taskId, activityType, startTime, endTime, createdAt',
      activeTimerState: 'id',
      appSettings: 'id',
      dailyThoughtSelections: 'date, thoughtId',
    });

    this.on('populate', () => {
      this.timerPresets.bulkAdd(DEFAULT_PRESETS);
      this.appSettings.add(DEFAULT_SETTINGS);
    });
  }
}

export const db = new StudyBuddyDatabase();

// Ensure initialization happens if opened for the first time or missing settings
export async function ensureDbInitialized(): Promise<void> {
  const settingsCount = await db.appSettings.count();
  if (settingsCount === 0) {
    await db.appSettings.put(DEFAULT_SETTINGS);
  }

  const presetCount = await db.timerPresets.count();
  if (presetCount === 0) {
    await db.timerPresets.bulkPut(DEFAULT_PRESETS);
  }
}

// Cascading subject deletion with referential integrity & historical session snapshotting
export async function deleteSubjectWithCascade(subjectId: string): Promise<{
  deletedSubjectName: string;
  chaptersCount: number;
  topicsCount: number;
  unlinkedTasksCount: number;
}> {
  return await db.transaction('rw', [db.subjects, db.chapters, db.topics, db.studyTasks, db.studySessions], async () => {
    const subject = await db.subjects.get(subjectId);
    if (!subject) throw new Error('Subject not found');

    const chapters = await db.chapters.where('subjectId').equals(subjectId).toArray();
    const chapterIds = chapters.map(c => c.id);

    const topics = await db.topics.where('subjectId').equals(subjectId).toArray();
    const topicIds = topics.map(t => t.id);

    // Snapshot subject and topic names in past study sessions so history and progress stats are preserved
    const sessions = await db.studySessions.where('subjectId').equals(subjectId).toArray();
    for (const session of sessions) {
      const topic = topics.find(t => t.id === session.topicId);
      await db.studySessions.update(session.id, {
        subjectNameSnapshot: session.subjectNameSnapshot || subject.name,
        topicNameSnapshot: session.topicNameSnapshot || (topic ? topic.name : undefined),
        subjectId: undefined,
        chapterId: undefined,
        topicId: undefined,
      });
    }

    // Unlink tasks referencing this subject/chapters/topics rather than silently destroying user's to-dos
    const tasks = await db.studyTasks.where('subjectId').equals(subjectId).toArray();
    for (const task of tasks) {
      await db.studyTasks.update(task.id, {
        subjectId: undefined,
        chapterId: undefined,
        topicId: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    // Delete topics, chapters, and subject
    if (topicIds.length > 0) {
      await db.topics.bulkDelete(topicIds);
    }
    if (chapterIds.length > 0) {
      await db.chapters.bulkDelete(chapterIds);
    }
    await db.subjects.delete(subjectId);

    return {
      deletedSubjectName: subject.name,
      chaptersCount: chapters.length,
      topicsCount: topics.length,
      unlinkedTasksCount: tasks.length,
    };
  });
}

// Cascading chapter deletion
export async function deleteChapterWithCascade(chapterId: string): Promise<{
  deletedChapterName: string;
  topicsCount: number;
  unlinkedTasksCount: number;
}> {
  return await db.transaction('rw', [db.chapters, db.topics, db.studyTasks, db.studySessions], async () => {
    const chapter = await db.chapters.get(chapterId);
    if (!chapter) throw new Error('Chapter not found');

    const topics = await db.topics.where('chapterId').equals(chapterId).toArray();
    const topicIds = topics.map(t => t.id);

    // Snapshot topic names in sessions
    for (const topic of topics) {
      const sessions = await db.studySessions.where('topicId').equals(topic.id).toArray();
      for (const s of sessions) {
        await db.studySessions.update(s.id, {
          topicNameSnapshot: s.topicNameSnapshot || topic.name,
          chapterId: undefined,
          topicId: undefined,
        });
      }
    }

    // Unlink tasks
    const tasks = await db.studyTasks.where('chapterId').equals(chapterId).toArray();
    for (const task of tasks) {
      await db.studyTasks.update(task.id, {
        chapterId: undefined,
        topicId: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    if (topicIds.length > 0) {
      await db.topics.bulkDelete(topicIds);
    }
    await db.chapters.delete(chapterId);

    return {
      deletedChapterName: chapter.name,
      topicsCount: topics.length,
      unlinkedTasksCount: tasks.length,
    };
  });
}

// Topic deletion with history snapshot
export async function deleteTopicWithCascade(topicId: string): Promise<{
  deletedTopicName: string;
  unlinkedTasksCount: number;
}> {
  return await db.transaction('rw', [db.topics, db.studyTasks, db.studySessions], async () => {
    const topic = await db.topics.get(topicId);
    if (!topic) throw new Error('Topic not found');

    // Snapshot topic name in past sessions
    const sessions = await db.studySessions.where('topicId').equals(topicId).toArray();
    for (const s of sessions) {
      await db.studySessions.update(s.id, {
        topicNameSnapshot: s.topicNameSnapshot || topic.name,
        topicId: undefined,
      });
    }

    // Unlink tasks
    const tasks = await db.studyTasks.where('topicId').equals(topicId).toArray();
    for (const task of tasks) {
      await db.studyTasks.update(task.id, {
        topicId: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    await db.topics.delete(topicId);

    return {
      deletedTopicName: topic.name,
      unlinkedTasksCount: tasks.length,
    };
  });
}

// Load sample demo data
export async function loadSampleDemoData(): Promise<void> {
  await db.transaction('rw', [db.subjects, db.chapters, db.topics, db.studyTasks, db.studySessions], async () => {
    await db.subjects.bulkPut(SAMPLE_DEMO_DATA.subjects);
    await db.chapters.bulkPut(SAMPLE_DEMO_DATA.chapters);
    await db.topics.bulkPut(SAMPLE_DEMO_DATA.topics);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const demoTasks: StudyTask[] = [
      {
        id: 'task-demo-1',
        title: 'Review RISC-V Pipeline Hazards and Forwarding',
        date: todayStr,
        subjectId: 'sub-cs101',
        chapterId: 'chap-cpu',
        topicId: 'top-1',
        activityType: 'revise',
        estimatedMinutes: 45,
        category: 'task',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-2',
        title: 'Practice Orthogonal Projections Problem Set',
        date: todayStr,
        subjectId: 'sub-math201',
        chapterId: 'chap-vectors',
        topicId: 'top-4',
        activityType: 'practice',
        estimatedMinutes: 60,
        category: 'task',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-3',
        title: 'Study Branch Prediction Strategies in Detail',
        date: tomorrowStr,
        subjectId: 'sub-cs101',
        chapterId: 'chap-cpu',
        topicId: 'top-2',
        activityType: 'study',
        estimatedMinutes: 50,
        category: 'task',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-4',
        title: 'Midterm Syllabus Deadline: Architecture & Linear Algebra',
        date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        activityType: 'study',
        category: 'deadline',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await db.studyTasks.bulkPut(demoTasks);

    const demoSessions: StudySession[] = [
      {
        id: 'session-demo-1',
        subjectId: 'sub-math201',
        chapterId: 'chap-vectors',
        topicId: 'top-4',
        activityType: 'practice',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        actualDurationSeconds: 3000, // 50 mins focused
        plannedDurationMinutes: 50,
        completed: true,
        notes: 'Completed Gram-Schmidt calculations with high accuracy.',
        createdAt: new Date().toISOString(),
      },
    ];

    await db.studySessions.bulkPut(demoSessions);
  });
}

// Reset application data (clean sweep, restore defaults)
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', [
    db.subjects,
    db.chapters,
    db.topics,
    db.studyTasks,
    db.timerPresets,
    db.studySessions,
    db.activeTimerState,
    db.appSettings,
    db.dailyThoughtSelections,
  ], async () => {
    await db.subjects.clear();
    await db.chapters.clear();
    await db.topics.clear();
    await db.studyTasks.clear();
    await db.studySessions.clear();
    await db.activeTimerState.clear();
    await db.dailyThoughtSelections.clear();
    await db.timerPresets.clear();
    await db.appSettings.clear();

    await db.timerPresets.bulkAdd(DEFAULT_PRESETS);
    await db.appSettings.add(DEFAULT_SETTINGS);
  });
}
