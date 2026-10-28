import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Modal } from '../common/Modal';
import { Search, BookOpen, Bookmark, CheckSquare, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'subjects' | 'topics' | 'tasks'>('all');

  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const chapters = useLiveQuery(() => db.chapters.toArray()) || [];
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const tasks = useLiveQuery(() => db.studyTasks.toArray()) || [];

  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const chapterMap = useMemo(() => new Map(chapters.map(c => [c.id, c])), [chapters]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: Array<{
      id: string;
      type: 'subject' | 'chapter' | 'topic' | 'task';
      title: string;
      subtitle?: string;
      badge?: string;
      color?: string;
      actionUrl: string;
    }> = [];

    // 1. Subjects
    if (categoryFilter === 'all' || categoryFilter === 'subjects') {
      for (const s of subjects) {
        if (s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))) {
          matches.push({
            id: s.id,
            type: 'subject',
            title: s.name,
            subtitle: s.description || 'Subject',
            color: s.color,
            actionUrl: `/subjects?subjectId=${s.id}`,
          });
        }
      }
    }

    // 2. Topics
    if (categoryFilter === 'all' || categoryFilter === 'topics') {
      for (const t of topics) {
        if (
          t.name.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        ) {
          const parentSub = subjectMap.get(t.subjectId);
          const parentChap = chapterMap.get(t.chapterId);
          const breadcrumb = [parentSub?.name, parentChap?.name].filter(Boolean).join(' › ');

          matches.push({
            id: t.id,
            type: 'topic',
            title: t.name,
            subtitle: breadcrumb || 'Topic',
            badge: t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Not Started',
            color: parentSub?.color,
            actionUrl: `/subjects?subjectId=${t.subjectId}&topicId=${t.id}`,
          });
        }
      }
    }

    // 3. Tasks
    if (categoryFilter === 'all' || categoryFilter === 'tasks') {
      for (const task of tasks) {
        if (
          task.title.toLowerCase().includes(q) ||
          (task.description && task.description.toLowerCase().includes(q))
        ) {
          const parentSub = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
          matches.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: `${task.date} • ${task.activityType.toUpperCase()}`,
            badge: task.completed ? 'Done' : 'Pending',
            color: parentSub?.color,
            actionUrl: `/planner?date=${task.date}`,
          });
        }
      }
    }

    return matches.slice(0, 20); // Top 20 results
  }, [query, categoryFilter, subjects, chapters, topics, tasks, subjectMap, chapterMap]);

  const handleSelect = (url: string) => {
    onClose();
    setQuery('');
    navigate(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Workspace" maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics, notes, or tasks..."
            autoFocus
            className="search-input w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 dark:focus:ring-forest-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 pb-1 overflow-x-auto text-xs">
          {(['all', 'subjects', 'topics', 'tasks'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-stone-100 dark:divide-stone-850">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
              Type keywords above to search syllabus topics, notes, or planner tasks.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
              No matching items found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item.actionUrl)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: item.color ? `${item.color}20` : 'rgba(120, 113, 108, 0.15)',
                      color: item.color || '#57534e',
                    }}
                  >
                    {item.type === 'subject' && <BookOpen className="w-3.5 h-3.5" />}
                    {item.type === 'topic' && <Bookmark className="w-3.5 h-3.5" />}
                    {item.type === 'task' && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-forest-700 dark:group-hover:text-forest-400 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
