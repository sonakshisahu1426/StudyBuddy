import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { TimerPreset, TimerInterval, TimerIntervalType } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetToEdit?: TimerPreset | null;
  onSaved?: (preset: TimerPreset) => void;
}

export const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen,
  onClose,
  presetToEdit,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [intervals, setIntervals] = useState<TimerInterval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (presetToEdit) {
        setName(presetToEdit.name);
        setIntervals(JSON.parse(JSON.stringify(presetToEdit.intervals)));
      } else {
        setName('New Focus Routine');
        setIntervals([
          { id: `int-${Date.now()}-1`, name: 'Focus Period', durationMinutes: 30, type: 'study' },
          { id: `int-${Date.now()}-2`, name: 'Break', durationMinutes: 5, type: 'short_break' },
        ]);
      }
      setError(null);
    }
  }, [isOpen, presetToEdit]);

  const handleAddInterval = () => {
    const newInt: TimerInterval = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: 'Focus Interval',
      durationMinutes: 25,
      type: 'study',
    };
    setIntervals(prev => [...prev, newInt]);
  };

  const handleUpdateInterval = (index: number, updates: Partial<TimerInterval>) => {
    setIntervals(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveInterval = (index: number) => {
    if (intervals.length <= 1) {
      setError('A preset must contain at least one interval.');
      return;
    }
    setIntervals(prev => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= intervals.length) return;

    setIntervals(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Preset name is required.');
      return;
    }

    if (intervals.length === 0) {
      setError('At least one interval is required.');
      return;
    }

    for (const int of intervals) {
      if (!int.name.trim()) {
        setError('All intervals must have a name.');
        return;
      }
      if (int.durationMinutes <= 0 || int.durationMinutes > 480) {
        setError('Interval duration must be between 1 and 480 minutes.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      let savedPreset: TimerPreset;

      if (presetToEdit) {
        savedPreset = {
          ...presetToEdit,
          name: name.trim(),
          intervals,
          updatedAt: now,
        };
        await db.timerPresets.put(savedPreset);
      } else {
        savedPreset = {
          id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          intervals,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        };
        await db.timerPresets.add(savedPreset);
      }

      onSaved?.(savedPreset);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save preset';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={presetToEdit ? 'Edit Focus Preset' : 'Create Custom Focus Preset'}
      description="Configure an ordered sequence of focus and rest intervals."
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
            Preset Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 50/10 Focus Block"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Intervals Sequence List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Interval Sequence ({intervals.length})
            </label>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleAddInterval}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Interval
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {intervals.map((int, idx) => (
              <div
                key={int.id || idx}
                className="p-3 bg-stone-50 dark:bg-stone-850/60 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-2 text-xs"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-stone-400 w-4 text-center">{idx + 1}.</span>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="text-stone-400 hover:text-stone-700 disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === intervals.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="text-stone-400 hover:text-stone-700 disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <input
                    type="text"
                    required
                    value={int.name}
                    onChange={(e) => handleUpdateInterval(idx, { name: e.target.value })}
                    placeholder="Interval title"
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs"
                  />

                  <select
                    value={int.type}
                    onChange={(e) => handleUpdateInterval(idx, { type: e.target.value as TimerIntervalType })}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs font-medium"
                  >
                    <option value="study">Study / Focused Work</option>
                    <option value="short_break">Short Break</option>
                    <option value="long_break">Long Break</option>
                    <option value="custom">Custom Activity</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={int.durationMinutes}
                      onChange={(e) => handleUpdateInterval(idx, { durationMinutes: Number(e.target.value) })}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-charcoal-900 text-xs font-mono"
                    />
                    <span className="text-stone-400">min</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveInterval(idx)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors shrink-0"
                  title="Remove interval"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Preset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
