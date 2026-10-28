import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteSubjectWithCascade, deleteChapterWithCascade, deleteTopicWithCascade } from '../db';
import { Subject, Chapter, Topic, TopicStatus, TopicDifficulty } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { SubjectModal } from '../components/subjects/SubjectModal';
import { ChapterModal } from '../components/subjects/ChapterModal';
import { TopicModal } from '../components/subjects/TopicModal';
import { TopicDetailDrawer } from '../components/subjects/TopicDetailDrawer';
import { TaskModal } from '../components/planner/TaskModal';
import { isDateOverdue } from '../utils/date';
import { formatMinutesToHumanReadable } from '../utils/time';
import {
  BookOpen,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSubjectIdParam = searchParams.get('subjectId');
  const selectedTopicIdParam = searchParams.get('topicId');

  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const chapters = useLiveQuery(() => db.chapters.orderBy('order').toArray()) || [];
  const topics = useLiveQuery(() => db.topics.orderBy('order').toArray()) || [];

  // Active Subject selection
  const activeSubjectId = useMemo(() => {
    if (selectedSubjectIdParam && subjects.some(s => s.id === selectedSubjectIdParam)) {
      return selectedSubjectIdParam;
    }
    return subjects[0]?.id || null;
  }, [selectedSubjectIdParam, subjects]);

  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === activeSubjectId) || null;
  }, [subjects, activeSubjectId]);

  // Topic detail drawer state
  const [drawerTopic, setDrawerTopic] = useState<Topic | null>(null);

  // Sync drawer topic with query param if present
  React.useEffect(() => {
    if (selectedTopicIdParam) {
      const found = topics.find(t => t.id === selectedTopicIdParam);
      if (found) setDrawerTopic(found);
    }
  }, [selectedTopicIdParam, topics]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TopicStatus>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | TopicDifficulty>('all');
  const [revisionFilter, setRevisionFilter] = useState<'all' | 'needs_revision'>('all');

  // Expanded chapters state
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  // Modals state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [targetChapterIdForNewTopic, setTargetChapterIdForNewTopic] = useState<string>('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalTopic, setTaskModalTopic] = useState<Topic | null>(null);

  // Deletion confirm dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'subject' | 'chapter' | 'topic';
    item: Subject | Chapter | Topic | null;
  }>({ isOpen: false, type: 'subject', item: null });

  // Chapters & Topics for current active subject
  const currentChapters = useMemo(() => {
    if (!activeSubjectId) return [];
    return chapters.filter(c => c.subjectId === activeSubjectId);
  }, [chapters, activeSubjectId]);

  const currentTopics = useMemo(() => {
    if (!activeSubjectId) return [];
    return topics.filter(t => t.subjectId === activeSubjectId);
  }, [topics, activeSubjectId]);

  // Overall active subject completion progress
  const subjectProgress = useMemo(() => {
    if (currentTopics.length === 0) return 0;
    const completed = currentTopics.filter(t => t.status === 'completed').length;
    return Math.round((completed / currentTopics.length) * 100);
  }, [currentTopics]);

  // Filtered topics by chapter
  const filteredTopicsByChapter = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const map = new Map<string, Topic[]>();

    for (const chap of currentChapters) {
      let chapTopics = topics.filter(t => t.chapterId === chap.id);

      if (statusFilter !== 'all') {
        chapTopics = chapTopics.filter(t => t.status === statusFilter);
      }
      if (difficultyFilter !== 'all') {
        chapTopics = chapTopics.filter(t => t.difficulty === difficultyFilter);
      }
      if (revisionFilter === 'needs_revision') {
        chapTopics = chapTopics.filter(t => t.needsRevision);
      }
      if (q) {
        chapTopics = chapTopics.filter(t =>
          t.name.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }

      map.set(chap.id, chapTopics);
    }
    return map;
  }, [currentChapters, topics, statusFilter, difficultyFilter, revisionFilter, searchQuery]);

  const toggleChapterCollapse = (chapId: string) => {
    setCollapsedChapters(prev => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const handleToggleTopicStatus = async (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
    await db.topics.update(topic.id, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteDialog.item) return;

    if (deleteDialog.type === 'subject') {
      await deleteSubjectWithCascade(deleteDialog.item.id);
      if (activeSubjectId === deleteDialog.item.id) {
        const remaining = subjects.filter(s => s.id !== deleteDialog.item?.id);
        if (remaining.length > 0) {
          setSearchParams({ subjectId: remaining[0].id });
        } else {
          setSearchParams({});
        }
      }
    } else if (deleteDialog.type === 'chapter') {
      await deleteChapterWithCascade(deleteDialog.item.id);
    } else if (deleteDialog.type === 'topic') {
      await deleteTopicWithCascade(deleteDialog.item.id);
      if (drawerTopic?.id === deleteDialog.item.id) {
        setDrawerTopic(null);
      }
    }

    setDeleteDialog({ isOpen: false, type: 'subject', item: null });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
            Academic Syllabus
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Structured hierarchy of subjects, chapters, and topics with revision tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubjectToEdit(null);
              setIsSubjectModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Subject
          </Button>

          {activeSubject && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setChapterToEdit(null);
                setIsChapterModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Chapter
            </Button>
          )}
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No subjects created yet"
          description="Create your first subject or course to start organizing your syllabus into chapters and topics."
          actionLabel="Create Subject"
          onAction={() => {
            setSubjectToEdit(null);
            setIsSubjectModalOpen(true);
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Subjects Tab List (Left Column) */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-1">
              Your Subjects ({subjects.length})
            </h2>

            <div className="space-y-1.5">
              {subjects.map((sub) => {
                const isSelected = sub.id === activeSubjectId;
                const subTopics = topics.filter(t => t.subjectId === sub.id);
                const comp = subTopics.filter(t => t.status === 'completed').length;
                const pct = subTopics.length > 0 ? Math.round((comp / subTopics.length) * 100) : 0;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSearchParams({ subjectId: sub.id })}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 group ${
                      isSelected
                        ? 'border-forest-700 bg-white dark:bg-charcoal-900 shadow-card ring-1 ring-forest-700/20'
                        : 'border-stone-200 dark:border-stone-850 bg-stone-50/50 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || '#2c5649' }}
                        />
                        <span className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'
                        }`}>
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 font-medium shrink-0">
                        {pct}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>{subTopics.length} topics</span>
                      <span>{comp} completed</span>
                    </div>

                    <ProgressBar progress={pct} color={sub.color} size="sm" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Subject Syllabus Detail (Right 3 Columns) */}
          {activeSubject && (
            <div className="lg:col-span-3 space-y-5">
              {/* Subject Detail Header Card */}
              <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: activeSubject.color }}
                    />
                    <div>
                      <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight font-heading">
                        {activeSubject.name}
                      </h2>
                      {activeSubject.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {activeSubject.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSubjectToEdit(activeSubject);
                        setIsSubjectModalOpen(true);
                      }}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ isOpen: true, type: 'subject', item: activeSubject })}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Progress bar in header */}
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400">
                    <span>Chapters: <strong className="text-stone-800 dark:text-stone-200">{currentChapters.length}</strong></span>
                    <span>Total Topics: <strong className="text-stone-800 dark:text-stone-200">{currentTopics.length}</strong></span>
                    <span>Needs Revision: <strong className="text-amber-600">{currentTopics.filter(t => t.needsRevision).length}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500">Progress:</span>
                    <strong className="text-stone-800 dark:text-stone-200 font-mono">{subjectProgress}%</strong>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400 dark:text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics in syllabus..."
                    className="search-input w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-850 text-xs focus:outline-none focus:ring-1 focus:ring-forest-600 dark:focus:ring-forest-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-subtle transition-colors"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | TopicStatus)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs text-stone-700 dark:text-stone-300 font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  {/* Difficulty Filter */}
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value as 'all' | TopicDifficulty)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs text-stone-700 dark:text-stone-300 font-medium"
                  >
                    <option value="all">All Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  {/* Revision Filter Button */}
                  <button
                    onClick={() => setRevisionFilter(prev => prev === 'all' ? 'needs_revision' : 'all')}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                      revisionFilter === 'needs_revision'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                        : 'bg-white dark:bg-charcoal-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Needs Revision
                  </button>
                </div>
              </div>

              {/* Chapters & Topics Tree View */}
              {currentChapters.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="w-7 h-7" />}
                  title="No chapters created yet"
                  description="Add chapters to divide this subject into structured units."
                  actionLabel="Add First Chapter"
                  onAction={() => {
                    setChapterToEdit(null);
                    setIsChapterModalOpen(true);
                  }}
                  actionIcon={<Plus className="w-4 h-4" />}
                />
              ) : (
                <div className="space-y-4">
                  {currentChapters.map((chapter) => {
                    const isCollapsed = !!collapsedChapters[chapter.id];
                    const chapTopics = filteredTopicsByChapter.get(chapter.id) || [];
                    const allChapTopics = topics.filter(t => t.chapterId === chapter.id);
                    const chapCompleted = allChapTopics.filter(t => t.status === 'completed').length;
                    const chapPct = allChapTopics.length > 0 ? Math.round((chapCompleted / allChapTopics.length) * 100) : 0;

                    return (
                      <div
                        key={chapter.id}
                        className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl overflow-hidden shadow-card transition-all"
                      >
                        {/* Chapter Bar */}
                        <div
                          onClick={() => toggleChapterCollapse(chapter.id)}
                          className="p-3.5 bg-stone-50/70 dark:bg-stone-850/40 hover:bg-stone-100/60 dark:hover:bg-stone-850/80 cursor-pointer flex items-center justify-between border-b border-stone-100 dark:border-stone-800 select-none"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="text-stone-400">
                              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                            <span className="font-semibold text-sm text-stone-800 dark:text-stone-200 truncate">
                              {chapter.name}
                            </span>
                            <span className="text-xs text-stone-400 font-normal">
                              ({chapCompleted}/{allChapTopics.length})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs font-mono font-medium text-stone-500">
                              {chapPct}%
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTargetChapterIdForNewTopic(chapter.id);
                                setTopicToEdit(null);
                                setIsTopicModalOpen(true);
                              }}
                              icon={<Plus className="w-3.5 h-3.5 text-forest-600" />}
                            >
                              Add Topic
                            </Button>

                            <button
                              onClick={() => {
                                setChapterToEdit(chapter);
                                setIsChapterModalOpen(true);
                              }}
                              className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                              title="Edit Chapter"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteDialog({ isOpen: true, type: 'chapter', item: chapter })}
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Topics List */}
                        {!isCollapsed && (
                          <div className="divide-y divide-stone-100 dark:divide-stone-850">
                            {chapTopics.length === 0 ? (
                              <div className="p-4 text-center text-xs text-stone-400">
                                {allChapTopics.length === 0
                                  ? 'No topics in this chapter yet.'
                                  : 'No topics match the current filter.'}
                              </div>
                            ) : (
                              chapTopics.map((topic) => {
                                const isOverdue = topic.needsRevision && topic.revisionDate && isDateOverdue(topic.revisionDate);

                                return (
                                  <div
                                    key={topic.id}
                                    onClick={() => setDrawerTopic(topic)}
                                    className="p-3 sm:px-4 hover:bg-stone-50/70 dark:hover:bg-stone-850/50 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {/* Completion Checkbox */}
                                      <button
                                        onClick={(e) => handleToggleTopicStatus(topic, e)}
                                        className="text-stone-400 hover:text-forest-600 dark:hover:text-forest-400 shrink-0 p-0.5"
                                        title={topic.status === 'completed' ? 'Mark incomplete' : 'Mark completed'}
                                      >
                                        {topic.status === 'completed' ? (
                                          <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400" />
                                        ) : topic.status === 'in_progress' ? (
                                          <Circle className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                                        ) : (
                                          <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600" />
                                        )}
                                      </button>

                                      <div className="truncate">
                                        <p className={`text-xs sm:text-sm font-medium truncate ${
                                          topic.status === 'completed'
                                            ? 'line-through text-stone-400 dark:text-stone-500'
                                            : 'text-stone-800 dark:text-stone-200 group-hover:text-forest-800 dark:group-hover:text-forest-300'
                                        }`}>
                                          {topic.name}
                                        </p>
                                        {topic.notes && (
                                          <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                                            {topic.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Topic Meta Badges */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {/* Revision badge */}
                                      {topic.needsRevision && (
                                        <Badge
                                          variant={isOverdue ? 'rose' : 'amber'}
                                          size="sm"
                                          icon={<RotateCcw className="w-3 h-3" />}
                                        >
                                          {isOverdue ? 'Overdue Rev.' : 'Revision'}
                                        </Badge>
                                      )}

                                      {/* Difficulty */}
                                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-medium ${
                                        topic.difficulty === 'hard'
                                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50'
                                          : topic.difficulty === 'medium'
                                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50'
                                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50'
                                      }`}>
                                        {topic.difficulty}
                                      </span>

                                      {/* Estimated duration */}
                                      {topic.estimatedMinutes && (
                                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400">
                                          <Clock className="w-3 h-3" />
                                          {formatMinutesToHumanReadable(topic.estimatedMinutes)}
                                        </span>
                                      )}

                                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition-colors ml-1" />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topic Detail Drawer */}
      <TopicDetailDrawer
        topic={drawerTopic}
        subject={activeSubject || undefined}
        chapter={chapters.find(c => c.id === drawerTopic?.chapterId)}
        onClose={() => setDrawerTopic(null)}
        onEdit={(topic) => {
          setTopicToEdit(topic);
          setTargetChapterIdForNewTopic(topic.chapterId);
          setIsTopicModalOpen(true);
        }}
        onDelete={(topic) => {
          setDeleteDialog({ isOpen: true, type: 'topic', item: topic });
        }}
        onAddToPlanner={(topic) => {
          setTaskModalTopic(topic);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Modals */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjectToEdit={subjectToEdit}
      />

      {activeSubject && (
        <ChapterModal
          isOpen={isChapterModalOpen}
          onClose={() => setIsChapterModalOpen(false)}
          subjectId={activeSubject.id}
          chapterToEdit={chapterToEdit}
        />
      )}

      {activeSubject && targetChapterIdForNewTopic && (
        <TopicModal
          isOpen={isTopicModalOpen}
          onClose={() => setIsTopicModalOpen(false)}
          subjectId={activeSubject.id}
          chapterId={targetChapterIdForNewTopic}
          topicToEdit={topicToEdit}
        />
      )}

      {/* Task Modal for topic scheduling */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalTopic(null);
        }}
        defaultSubjectId={taskModalTopic?.subjectId}
        defaultChapterId={taskModalTopic?.chapterId}
        defaultTopicId={taskModalTopic?.id}
        defaultActivityType={taskModalTopic?.needsRevision ? 'revise' : 'study'}
      />

      {/* Cascading Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: 'subject', item: null })}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteDialog.type.toUpperCase()}: ${deleteDialog.item ? (deleteDialog.item as any).name : ''}`}
        message={`Are you sure you want to permanently delete this ${deleteDialog.type}?`}
        consequences={
          deleteDialog.type === 'subject'
            ? [
                'All chapters and topics in this subject will be permanently deleted.',
                'Associated planner tasks will be unlinked (not deleted).',
                'Past study sessions will preserve the subject name snapshot for accurate history.',
              ]
            : deleteDialog.type === 'chapter'
            ? [
                'All topics in this chapter will be permanently deleted.',
                'Associated planner tasks will be unlinked.',
              ]
            : [
                'Associated planner tasks will be unlinked.',
                'Past study sessions will preserve the topic name snapshot.',
              ]
        }
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};
