import React, { useState } from 'react';
import { db } from '../../db';
import { StudySession } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatSecondsToHumanReadable } from '../../utils/time';
import { CheckCircle2 } from 'lucide-react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession | null;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [notes, setNotes] = useState(session?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (session) {
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!session) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await db.studySessions.update(session.id, {
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Session Complete"
      description="Great work! Your focused study time has been recorded to your history."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Celebration Banner */}
        <div className="p-4 rounded-xl bg-forest-50 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-forest-700 text-white flex items-center justify-center mb-2 shadow-subtle">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-forest-800 dark:text-forest-300 uppercase tracking-wider">
            Focused Study Time
          </span>
          <span className="text-3xl font-bold font-mono text-forest-900 dark:text-forest-100 mt-1">
            {formatSecondsToHumanReadable(session.actualDurationSeconds)}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Activity: <strong className="capitalize text-stone-700 dark:text-stone-300">{session.activityType}</strong>
          </span>
        </div>

        {/* Association Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Subject</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {session.subjectNameSnapshot || 'General Study'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Topic</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
              {session.topicNameSnapshot || 'Unspecified'}
            </span>
          </div>
        </div>

        {/* Optional Reflection Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Session Reflections / Progress Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What concepts did you master? Any remaining questions?"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
