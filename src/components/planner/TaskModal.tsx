import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { StudyTask, StudyActivityType, TaskCategory } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getTodayDateString } from '../../utils/date';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: StudyTask | null;
  defaultDate?: string;
  defaultSubjectId?: string;
  defaultChapterId?: string;
  defaultTopicId?: string;
  defaultActivityType?: StudyActivityType;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDate,
  defaultSubjectId,
  defaultChapterId,
  defaultTopicId,
  defaultActivityType = 'study',
}) => {
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const chapters = useLiveQuery(() => db.chapters.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayDateString());
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || '');
  const [chapterId, setChapterId] = useState<string>(defaultChapterId || '');
  const [topicId, setTopicId] = useState<string>(defaultTopicId || '');
  const [activityType, setActivityType] = useState<StudyActivityType>(defaultActivityType);
  const [category, setCategory] = useState<TaskCategory>('task');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or editing target changes
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setDate(taskToEdit.date);
        setSubjectId(taskToEdit.subjectId || '');
        setChapterId(taskToEdit.chapterId || '');
        setTopicId(taskToEdit.topicId || '');
        setActivityType(taskToEdit.activityType || 'study');
        setCategory(taskToEdit.category || 'task');
        setEstimatedMinutes(taskToEdit.estimatedMinutes || 45);
      } else {
        setTitle('');
        setDescription('');
        setDate(defaultDate || getTodayDateString());
        setSubjectId(defaultSubjectId || '');
        setChapterId(defaultChapterId || '');
        setTopicId(defaultTopicId || '');
        setActivityType(defaultActivityType || 'study');
        setCategory('task');
        setEstimatedMinutes(45);
      }
      setError(null);
    }
  }, [isOpen, taskToEdit, defaultDate, defaultSubjectId, defaultChapterId, defaultTopicId, defaultActivityType]);

  // Filter available chapters by selected subject
  const availableChapters = chapters.filter(c => c.subjectId === subjectId);
  // Filter available topics by selected chapter
  const availableTopics = topics.filter(t => t.chapterId === chapterId);

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setChapterId('');
    setTopicId('');
  };

  const handleChapterChange = (newChapterId: string) => {
    setChapterId(newChapterId);
    setTopicId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the study task.');
      return;
    }

    if (!date) {
      setError('Please select a calendar date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      if (taskToEdit) {
        await db.studyTasks.update(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          subjectId: subjectId || undefined,
          chapterId: chapterId || undefined,
          topicId: topicId || undefined,
          activityType,
          category,
          estimatedMinutes: estimatedMinutes > 0 ? Number(estimatedMinutes) : undefined,
          updatedAt: now,
        });
      } else {
        const newTask: StudyTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          subjectId: subjectId || undefined,
          chapterId: chapterId || undefined,
          topicId: topicId || undefined,
          activityType,
          category,
          estimatedMinutes: estimatedMinutes > 0 ? Number(estimatedMinutes) : undefined,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        await db.studyTasks.add(newTask);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Study Task' : 'New Study Task'}
      description="Schedule a focused learning, practice, or revision item."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read Chapter 4 & practice exercises"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="600"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as StudyActivityType)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="study">Study (New Concepts)</option>
              <option value="practice">Practice (Problem Sets / Exercises)</option>
              <option value="revise">Revise (Spaced Review)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Item Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="task">Regular Study Task</option>
              <option value="deadline">Exam / Assignment Deadline</option>
            </select>
          </div>
        </div>

        {/* Syllabus Association */}
        <div className="p-3 bg-stone-50 dark:bg-stone-850/60 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-3">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Link to Syllabus (Optional)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
              >
                <option value="">None (General)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Chapter</label>
              <select
                value={chapterId}
                onChange={(e) => handleChapterChange(e.target.value)}
                disabled={!subjectId}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100 disabled:opacity-50"
              >
                <option value="">None</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={!chapterId}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100 disabled:opacity-50"
              >
                <option value="">None</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Notes / Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key pages, target problems, or specific goals..."
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
