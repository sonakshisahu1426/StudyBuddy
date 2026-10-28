import React, { useState } from 'react';
import { db } from '../../db';
import { StudySession, Subject, Topic } from '../../types';
import { formatSecondsToHumanReadable } from '../../utils/time';
import { formatShortDate } from '../../utils/date';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Trash2 } from 'lucide-react';

interface SessionHistoryListProps {
  sessions: StudySession[];
  subjects: Subject[];
  topics: Topic[];
}

export const SessionHistoryList: React.FC<SessionHistoryListProps> = ({
  sessions,
  subjects,
  topics,
}) => {
  const subjectMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicMap = React.useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);

  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    await db.studySessions.delete(sessionToDelete.id);
    setSessionToDelete(null);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-stone-400 dark:text-stone-500 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
        No study sessions recorded yet. Start a focus session above to record your study time.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {sessions.map((session) => {
          const sub = session.subjectId ? subjectMap.get(session.subjectId) : undefined;
          const top = session.topicId ? topicMap.get(session.topicId) : undefined;

          const subjectName = session.subjectNameSnapshot || sub?.name || 'General Study';
          const topicName = session.topicNameSnapshot || top?.name;

          return (
            <div
              key={session.id}
              className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-charcoal-900 flex items-center justify-between gap-3 text-xs shadow-subtle group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: sub?.color || '#2c5649' }}
                />
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {subjectName}
                    </span>
                    {topicName && (
                      <span className="text-stone-400 dark:text-stone-500 truncate text-[11px]">
                        › {topicName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    <span>{formatShortDate(session.startTime)}</span>
                    <span>•</span>
                    <span className="capitalize font-mono">{session.activityType}</span>
                    {session.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-[140px] text-stone-500 dark:text-stone-400">
                          "{session.notes}"
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-mono font-bold text-forest-800 dark:text-forest-400">
                  {formatSecondsToHumanReadable(session.actualDurationSeconds)}
                </span>
                <button
                  onClick={() => setSessionToDelete(session)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-rose-600 transition-opacity"
                  title="Delete recorded session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Session Record"
        message="Are you sure you want to delete this recorded study session? Progress statistics will update automatically."
        confirmLabel="Delete Record"
        variant="danger"
      />
    </div>
  );
};
