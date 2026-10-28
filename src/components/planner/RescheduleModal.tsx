import React, { useState } from 'react';
import { db } from '../../db';
import { StudyTask } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getTodayDateString, parseLocalDateString } from '../../utils/date';
import { format, addDays } from 'date-fns';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask | null;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [newDate, setNewDate] = useState<string>(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && task) {
      setNewDate(task.date >= getTodayDateString() ? task.date : getTodayDateString());
    }
  }, [isOpen, task]);

  if (!task) return null;

  const handleQuickShift = (daysToAdd: number) => {
    const base = parseLocalDateString(task.date >= getTodayDateString() ? task.date : getTodayDateString());
    const shifted = addDays(base, daysToAdd);
    setNewDate(format(shifted, 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      await db.studyTasks.update(task.id, {
        date: newDate,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Study Task"
      description={`Move "${task.title}" to a new date.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Shift Presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setNewDate(getTodayDateString())}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-medium"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickShift(1)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-medium"
          >
            +1 Day
          </button>
          <button
            type="button"
            onClick={() => handleQuickShift(2)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-medium"
          >
            +2 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickShift(7)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-medium"
          >
            Next Week
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Target Calendar Date
          </label>
          <input
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Rescheduling...' : 'Update Date'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
