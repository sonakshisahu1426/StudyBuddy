import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { Subject } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SUBJECT_PALETTE } from '../../utils/colors';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SUBJECT_PALETTE[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setName(subjectToEdit.name);
        setDescription(subjectToEdit.description || '');
        setColor(subjectToEdit.color || SUBJECT_PALETTE[0].hex);
      } else {
        setName('');
        setDescription('');
        setColor(SUBJECT_PALETTE[0].hex);
      }
      setError(null);
    }
  }, [isOpen, subjectToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Subject name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check for duplicate names (excluding current when editing)
      const existing = await db.subjects
        .filter(s => s.name.toLowerCase() === cleanName.toLowerCase() && s.id !== subjectToEdit?.id)
        .first();

      if (existing) {
        setError('A subject with this name already exists.');
        setIsSubmitting(false);
        return;
      }

      const now = new Date().toISOString();

      if (subjectToEdit) {
        await db.subjects.update(subjectToEdit.id, {
          name: cleanName,
          description: description.trim() || undefined,
          color,
          updatedAt: now,
        });
      } else {
        const newSubject: Subject = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          description: description.trim() || undefined,
          color,
          createdAt: now,
          updatedAt: now,
        };
        await db.subjects.add(newSubject);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save subject';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subjectToEdit ? 'Edit Subject' : 'New Academic Subject'}
      description="Organize your curriculum into structured chapters and topics."
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
            Subject Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Algorithms & Data Structures"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, textbook reference, or course code..."
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Theme Palette Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECT_PALETTE.map((pal) => (
              <button
                key={pal.id}
                type="button"
                onClick={() => setColor(pal.hex)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                  color === pal.hex
                    ? 'border-forest-600 ring-2 ring-forest-600/30 font-semibold'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: pal.hex }}
                />
                <span className="truncate text-stone-700 dark:text-stone-300">
                  {pal.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : subjectToEdit ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
