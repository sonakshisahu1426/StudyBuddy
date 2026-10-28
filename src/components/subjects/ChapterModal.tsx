import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { Chapter } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  chapterToEdit?: Chapter | null;
}

export const ChapterModal: React.FC<ChapterModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  chapterToEdit,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(chapterToEdit ? chapterToEdit.name : '');
      setError(null);
    }
  }, [isOpen, chapterToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Chapter title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      if (chapterToEdit) {
        await db.chapters.update(chapterToEdit.id, {
          name: cleanName,
          updatedAt: now,
        });
      } else {
        const count = await db.chapters.where('subjectId').equals(subjectId).count();
        const newChapter: Chapter = {
          id: `chap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          subjectId,
          name: cleanName,
          order: count + 1,
          createdAt: now,
          updatedAt: now,
        };
        await db.chapters.add(newChapter);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save chapter';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chapterToEdit ? 'Edit Chapter' : 'New Chapter / Module'}
      description="Group related topics together in this syllabus unit."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Chapter Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Unit 3: Dynamic Programming"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : chapterToEdit ? 'Save Changes' : 'Create Chapter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
