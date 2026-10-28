import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Topic, Subject, Chapter, TopicDifficulty, TopicStatus } from '../../types';
import { Button } from '../common/Button';
import { formatSecondsToHumanReadable, formatMinutesToHumanReadable } from '../../utils/time';
import { formatShortDate, isDateOverdue } from '../../utils/date';
import {
  X,
  Play,
  RotateCcw,
  CalendarPlus,
  BookOpen,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  History,
} from 'lucide-react';

interface TopicDetailDrawerProps {
  topic: Topic | null;
  subject?: Subject;
  chapter?: Chapter;
  onClose: () => void;
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onAddToPlanner: (topic: Topic) => void;
}

export const TopicDetailDrawer: React.FC<TopicDetailDrawerProps> = ({
  topic,
  subject,
  chapter,
  onClose,
  onEdit,
  onDelete,
  onAddToPlanner,
}) => {
  const navigate = useNavigate();

  const sessions = useLiveQuery(
    () => (topic ? db.studySessions.where('topicId').equals(topic.id).reverse().sortBy('startTime') : []),
    [topic?.id]
  ) || [];

  if (!topic) return null;

  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

  const handleStatusChange = async (newStatus: TopicStatus) => {
    await db.topics.update(topic.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDifficultyChange = async (newDiff: TopicDifficulty) => {
    await db.topics.update(topic.id, {
      difficulty: newDiff,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleRevision = async () => {
    await db.topics.update(topic.id, {
      needsRevision: !topic.needsRevision,
      updatedAt: new Date().toISOString(),
    });
  };

  const startSession = (activityType: 'study' | 'practice' | 'revise') => {
    navigate(`/timer?subjectId=${topic.subjectId}&chapterId=${topic.chapterId}&topicId=${topic.id}&activity=${activityType}`);
  };

  const isOverdue = topic.needsRevision && topic.revisionDate && isDateOverdue(topic.revisionDate);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-charcoal-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-40 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between">
        <div className="pr-4 overflow-hidden">
          <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mb-1">
            {subject?.name} › {chapter?.name}
          </p>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
            {topic.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status and Action Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Status & Difficulty
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Selector */}
            <select
              value={topic.status}
              onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="not_started">⚪ Not Started</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="completed">🟢 Completed</option>
            </select>

            {/* Difficulty Selector */}
            <select
              value={topic.difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value as TopicDifficulty)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Revision Toggle */}
            <button
              onClick={handleToggleRevision}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                topic.needsRevision
                  ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-850 dark:text-stone-400 dark:border-stone-700 hover:bg-stone-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {topic.needsRevision ? 'Needs Revision' : 'Flag Revision'}
            </button>
          </div>

          {topic.needsRevision && topic.revisionDate && (
            <div className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 mt-2 ${
              isOverdue
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                : 'bg-stone-50 text-stone-700 dark:bg-stone-850 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isOverdue ? 'Overdue for revision: ' : 'Target revision: '}
                <strong>{formatShortDate(topic.revisionDate)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Focus Room Quick Start */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Start Focus Session
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSession('study')}
              className="flex-col py-2.5 h-auto text-xs"
              icon={<Play className="w-3.5 h-3.5 text-forest-600" />}
            >
              Study
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSession('practice')}
              className="flex-col py-2.5 h-auto text-xs"
              icon={<BookOpen className="w-3.5 h-3.5 text-sky-600" />}
            >
              Practice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSession('revise')}
              className="flex-col py-2.5 h-auto text-xs"
              icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
            >
              Revise
            </Button>
          </div>
        </div>

        {/* Study Stats & Time */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Total Focused</span>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {formatSecondsToHumanReadable(totalFocusSeconds)}
            </span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-400 block mb-1">Target Duration</span>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {formatMinutesToHumanReadable(topic.estimatedMinutes || 45)}
            </span>
          </div>
        </div>

        {/* Personal Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Notes & References
          </label>
          {topic.notes ? (
            <div className="text-xs p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
              {topic.notes}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No personal notes added yet.</p>
          )}
        </div>

        {/* Past Study Sessions */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Session History ({sessions.length})
          </label>
          {sessions.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No recorded focus sessions yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-2 rounded-lg bg-stone-50 dark:bg-stone-850 text-xs flex items-center justify-between border border-stone-100 dark:border-stone-800"
                >
                  <div>
                    <span className="font-medium text-stone-800 dark:text-stone-200 capitalize">
                      {s.activityType}
                    </span>
                    <span className="text-stone-400 ml-2">
                      {formatShortDate(s.startTime)}
                    </span>
                  </div>
                  <span className="font-mono text-stone-600 dark:text-stone-400 font-medium">
                    {formatSecondsToHumanReadable(s.actualDurationSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddToPlanner(topic)}
          icon={<CalendarPlus className="w-3.5 h-3.5 text-stone-600" />}
        >
          Schedule Task
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(topic)}
            title="Edit topic"
            icon={<Edit2 className="w-3.5 h-3.5" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(topic)}
            title="Delete topic"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
};
