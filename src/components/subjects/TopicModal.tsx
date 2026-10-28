import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { Topic, TopicDifficulty, TopicStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  chapterId: string;
  topicToEdit?: Topic | null;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  chapterId,
  topicToEdit,
}) => {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<TopicDifficulty>('medium');
  const [status, setStatus] = useState<TopicStatus>('not_started');
  const [needsRevision, setNeedsRevision] = useState<boolean>(false);
  const [revisionDate, setRevisionDate] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (topicToEdit) {
        setName(topicToEdit.name);
        setDifficulty(topicToEdit.difficulty);
        setStatus(topicToEdit.status);
        setNeedsRevision(topicToEdit.needsRevision);
        setRevisionDate(topicToEdit.revisionDate || '');
        setEstimatedMinutes(topicToEdit.estimatedMinutes || 45);
        setNotes(topicToEdit.notes || '');
      } else {
        setName('');
        setDifficulty('medium');
        setStatus('not_started');
        setNeedsRevision(false);
        setRevisionDate('');
        setEstimatedMinutes(45);
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, topicToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Topic title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      if (topicToEdit) {
        await db.topics.update(topicToEdit.id, {
          name: cleanName,
          difficulty,
          status,
          needsRevision,
          revisionDate: needsRevision && revisionDate ? revisionDate : null,
          estimatedMinutes: estimatedMinutes > 0 ? Number(estimatedMinutes) : null,
          notes: notes.trim() || null,
          updatedAt: now,
        });
      } else {
        const count = await db.topics.where('chapterId').equals(chapterId).count();
        const newTopic: Topic = {
          id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          chapterId,
          subjectId,
          name: cleanName,
          difficulty,
          status,
          needsRevision,
          revisionDate: needsRevision && revisionDate ? revisionDate : null,
          estimatedMinutes: estimatedMinutes > 0 ? Number(estimatedMinutes) : null,
          notes: notes.trim() || null,
          order: count + 1,
          createdAt: now,
          updatedAt: now,
        };
        await db.topics.add(newTopic);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save topic';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={topicToEdit ? 'Edit Topic' : 'Add New Topic'}
      description="Define the specific syllabus concept, difficulty, and revision targets."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Topic Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Memoization vs Tabulation"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Difficulty Rating
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TopicDifficulty)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TopicStatus)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Estimated Study Duration (Minutes)
          </label>
          <input
            type="number"
            min="5"
            max="480"
            step="5"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Revision flag and date */}
        <div className="p-3 bg-stone-50 dark:bg-stone-850/60 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={needsRevision}
              onChange={(e) => setNeedsRevision(e.target.checked)}
              className="w-4 h-4 rounded text-forest-700 focus:ring-forest-600 border-stone-300 dark:border-stone-700 dark:bg-stone-800"
            />
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              Flag as Needing Revision
            </span>
          </label>

          {needsRevision && (
            <div className="pt-1">
              <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                Target Revision Date (Optional)
              </label>
              <input
                type="date"
                value={revisionDate}
                onChange={(e) => setRevisionDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Personal Notes & References (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Formulas, key theorems, lecture slide references, or reminders..."
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : topicToEdit ? 'Save Changes' : 'Create Topic'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
