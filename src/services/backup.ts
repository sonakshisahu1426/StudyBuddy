import { db } from '../db';
import { BackupData } from '../types';

export const CURRENT_SCHEMA_VERSION = 1;

export async function exportAllData(): Promise<string> {
  const [
    subjects,
    chapters,
    topics,
    studyTasks,
    timerPresets,
    studySessions,
    settingsList,
    dailyThoughtSelections,
  ] = await Promise.all([
    db.subjects.toArray(),
    db.chapters.toArray(),
    db.topics.toArray(),
    db.studyTasks.toArray(),
    db.timerPresets.toArray(),
    db.studySessions.toArray(),
    db.appSettings.toArray(),
    db.dailyThoughtSelections.toArray(),
  ]);

  const backup: BackupData = {
    version: CURRENT_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      subjects,
      chapters,
      topics,
      studyTasks,
      timerPresets,
      studySessions,
      appSettings: settingsList[0],
      dailyThoughtSelections,
    },
  };

  return JSON.stringify(backup, null, 2);
}

export function downloadJsonFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  counts?: {
    subjects: number;
    chapters: number;
    topics: number;
    tasks: number;
    presets: number;
    sessions: number;
  };
}

export function validateBackupJson(jsonString: string): { result: ValidationResult; data?: BackupData } {
  try {
    const parsed = JSON.parse(jsonString) as BackupData;

    if (!parsed || typeof parsed !== 'object') {
      return { result: { valid: false, error: 'File is not a valid JSON object.' } };
    }

    if (typeof parsed.version !== 'number' || parsed.version <= 0) {
      return { result: { valid: false, error: 'Missing or invalid schema version.' } };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { result: { valid: false, error: 'Backup data payload is missing.' } };
    }

    const { subjects, chapters, topics, studyTasks, timerPresets, studySessions } = parsed.data;

    if (!Array.isArray(subjects) || !Array.isArray(chapters) || !Array.isArray(topics) || !Array.isArray(studyTasks)) {
      return { result: { valid: false, error: 'Corrupted backup: Core data collections are missing or invalid arrays.' } };
    }

    // Verify entities have valid IDs
    const subjectIdSet = new Set<string>();
    for (const sub of subjects) {
      if (!sub.id || typeof sub.name !== 'string') {
        return { result: { valid: false, error: 'One or more subjects have missing IDs or names.' } };
      }
      subjectIdSet.add(sub.id);
    }

    const chapterIdSet = new Set<string>();
    for (const chap of chapters) {
      if (!chap.id || typeof chap.name !== 'string') {
        return { result: { valid: false, error: 'One or more chapters have invalid attributes.' } };
      }
      chapterIdSet.add(chap.id);
    }

    for (const top of topics) {
      if (!top.id || typeof top.name !== 'string') {
        return { result: { valid: false, error: 'One or more topics have invalid attributes.' } };
      }
    }

    return {
      result: {
        valid: true,
        counts: {
          subjects: subjects.length,
          chapters: chapters.length,
          topics: topics.length,
          tasks: studyTasks.length,
          presets: timerPresets?.length || 0,
          sessions: studySessions?.length || 0,
        },
      },
      data: parsed,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON file';
    return { result: { valid: false, error: msg } };
  }
}

export async function restoreValidatedBackup(backup: BackupData): Promise<void> {
  const { data } = backup;

  await db.transaction('rw', [
    db.subjects,
    db.chapters,
    db.topics,
    db.studyTasks,
    db.timerPresets,
    db.studySessions,
    db.appSettings,
    db.dailyThoughtSelections,
    db.activeTimerState,
  ], async () => {
    // Clear existing data cleanly within transaction
    await db.subjects.clear();
    await db.chapters.clear();
    await db.topics.clear();
    await db.studyTasks.clear();
    await db.timerPresets.clear();
    await db.studySessions.clear();
    await db.appSettings.clear();
    await db.dailyThoughtSelections.clear();
    await db.activeTimerState.clear();

    // Insert imported records
    if (data.subjects?.length) await db.subjects.bulkAdd(data.subjects);
    if (data.chapters?.length) await db.chapters.bulkAdd(data.chapters);
    if (data.topics?.length) await db.topics.bulkAdd(data.topics);
    if (data.studyTasks?.length) await db.studyTasks.bulkAdd(data.studyTasks);
    if (data.timerPresets?.length) await db.timerPresets.bulkAdd(data.timerPresets);
    if (data.studySessions?.length) await db.studySessions.bulkAdd(data.studySessions);
    if (data.appSettings) await db.appSettings.add(data.appSettings);
    if (data.dailyThoughtSelections?.length) await db.dailyThoughtSelections.bulkAdd(data.dailyThoughtSelections);
  });
}
