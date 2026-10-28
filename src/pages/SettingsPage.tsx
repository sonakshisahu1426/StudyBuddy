import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, resetAllData, loadSampleDemoData } from '../db';
import { useTheme } from '../hooks/useTheme';
import { AppSettings } from '../types';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  exportAllData,
  downloadJsonFile,
  validateBackupJson,
  restoreValidatedBackup,
  ValidationResult,
} from '../services/backup';
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  FastForward,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const settings = useLiveQuery(() => db.appSettings.get('app_settings'));
  const presets = useLiveQuery(() => db.timerPresets.toArray()) || [];

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backup / Import state
  const [importPreview, setImportPreview] = useState<{
    fileContent: string;
    validation: ValidationResult;
  } | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDemoDataConfirmOpen, setIsDemoDataConfirmOpen] = useState(false);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4000);
  };

  const handleUpdateSetting = async (key: keyof AppSettings, value: any) => {
    await db.appSettings.update('app_settings', { [key]: value });
    showNotification('Preference updated.');
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportAllData();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadJsonFile(`studybuddy-backup-${dateStr}.json`, json);
      showNotification('Backup successfully exported.');
    } catch (err: unknown) {
      showNotification('Failed to generate export file.', true);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { result } = validateBackupJson(content);
      if (!result.valid) {
        showNotification(result.error || 'Invalid backup file format.', true);
        return;
      }

      setImportPreview({
        fileContent: content,
        validation: result,
      });
      setIsImportConfirmOpen(true);
    };

    reader.readAsText(file);
    // Reset input so same file can be reselected if needed
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (!importPreview) return;
    try {
      const { data } = validateBackupJson(importPreview.fileContent);
      if (data) {
        await restoreValidatedBackup(data);
        showNotification('Backup successfully restored.');
        setIsImportConfirmOpen(false);
        setImportPreview(null);
      }
    } catch (err: unknown) {
      showNotification('Failed to restore backup.', true);
    }
  };

  const handleExecuteReset = async () => {
    try {
      await resetAllData();
      showNotification('All application data has been reset to defaults.');
      setIsResetConfirmOpen(false);
    } catch {
      showNotification('Failed to reset data.', true);
    }
  };

  const handleExecuteLoadDemoData = async () => {
    try {
      await loadSampleDemoData();
      showNotification('Sample academic demo data loaded successfully.');
      setIsDemoDataConfirmOpen(false);
    } catch {
      showNotification('Failed to load demo data.', true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-heading">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Appearance, timer intervals, study preferences, and local data backups.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-forest-50 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800 text-xs text-forest-800 dark:text-forest-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section A: Appearance */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2 font-heading">
          <Sun className="w-4 h-4 text-stone-500" />
          Visual Theme
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Select between warm editorial light mode, deep charcoal dark mode, or system preference.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'light'
                ? 'border-forest-700 bg-forest-50/50 dark:bg-forest-950/40 text-forest-900 dark:text-forest-200 ring-2 ring-forest-700/20'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'dark'
                ? 'border-forest-700 bg-forest-50/50 dark:bg-forest-950/40 text-forest-900 dark:text-forest-200 ring-2 ring-forest-700/20'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'system'
                ? 'border-forest-700 bg-forest-50/50 dark:bg-forest-950/40 text-forest-900 dark:text-forest-200 ring-2 ring-forest-700/20'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Section B: Timer Preferences */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2 font-heading">
          <FastForward className="w-4 h-4 text-stone-500" />
          Focus Room & Timer Preferences
        </h2>

        <div className="space-y-3 divide-y divide-stone-100 dark:divide-stone-850 text-xs">
          {/* Sound toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Completion Sound Alerts
              </p>
              <p className="text-stone-400">
                Play a gentle, browser-synthesized chime when intervals finish.
              </p>
            </div>
            <button
              onClick={() => handleUpdateSetting('soundEnabled', !settings?.soundEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                settings?.soundEnabled !== false
                  ? 'bg-forest-50 text-forest-800 border-forest-300 dark:bg-forest-950/60 dark:text-forest-300'
                  : 'bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-800'
              }`}
            >
              {settings?.soundEnabled !== false ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Auto advance */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Automatically Advance Intervals
              </p>
              <p className="text-stone-400">
                Start the next interval immediately without requiring manual confirmation.
              </p>
            </div>
            <button
              onClick={() => handleUpdateSetting('autoAdvance', !settings?.autoAdvance)}
              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                settings?.autoAdvance
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              {settings?.autoAdvance ? 'Enabled' : 'Manual'}
            </button>
          </div>

          {/* Default Preset */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Default Focus Preset
              </p>
              <p className="text-stone-400">
                Routine selected when opening the Focus Room.
              </p>
            </div>
            <select
              value={settings?.defaultPresetId || presets[0]?.id || ''}
              onChange={(e) => handleUpdateSetting('defaultPresetId', e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 font-medium"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section C: Study & Calendar Preferences */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2 font-heading">
          <Calendar className="w-4 h-4 text-stone-500" />
          Study & Calendar Configuration
        </h2>

        <div className="space-y-3 divide-y divide-stone-100 dark:divide-stone-850 text-xs">
          {/* First day of week */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                First Day of the Week
              </p>
              <p className="text-stone-400">
                Calendar and weekly planner layout start day.
              </p>
            </div>
            <select
              value={settings?.firstDayOfWeek ?? 1}
              onChange={(e) => handleUpdateSetting('firstDayOfWeek', Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 font-medium"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>

          {/* Default Task Duration */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Default Task Estimate Duration
              </p>
              <p className="text-stone-400">
                Initial duration pre-filled when creating new study tasks.
              </p>
            </div>
            <select
              value={settings?.defaultTaskDuration || 45}
              onChange={(e) => handleUpdateSetting('defaultTaskDuration', Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 font-medium"
            >
              <option value={25}>25 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section D: Data Management, Backup & Reset */}
      <div className="bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2 font-heading">
          <Database className="w-4 h-4 text-stone-500" />
          Local Data Management & Backups
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          StudyBuddy stores all data locally on your device in IndexedDB. No cloud account or external database is used. You can export a full JSON backup at any time or restore a previous snapshot.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            icon={<Download className="w-3.5 h-3.5 text-stone-600" />}
          >
            Export Backup (JSON)
          </Button>

          {/* Import JSON */}
          <label className="inline-flex items-center justify-center font-medium text-xs px-2.5 py-1.5 gap-1.5 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </label>

          {/* Load Sample Demo Data */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDemoDataConfirmOpen(true)}
            icon={<Sparkles className="w-3.5 h-3.5 text-forest-600" />}
          >
            Load Sample Academic Data
          </Button>

          {/* Reset All Data */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Reset All Data
          </Button>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      {importPreview && (
        <ConfirmDialog
          isOpen={isImportConfirmOpen}
          onClose={() => {
            setIsImportConfirmOpen(false);
            setImportPreview(null);
          }}
          onConfirm={handleExecuteImport}
          title="Restore Backup Snapshot"
          message="Restoring this backup will replace current local database records with the records in the backup file."
          consequences={[
            `Subjects: ${importPreview.validation.counts?.subjects || 0}`,
            `Chapters: ${importPreview.validation.counts?.chapters || 0}`,
            `Topics: ${importPreview.validation.counts?.topics || 0}`,
            `Study Tasks: ${importPreview.validation.counts?.tasks || 0}`,
            `Recorded Focus Sessions: ${importPreview.validation.counts?.sessions || 0}`,
          ]}
          confirmLabel="Apply Backup"
          variant="primary"
        />
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleExecuteReset}
        title="Reset All StudyBuddy Data"
        message="Are you sure you want to completely erase all local subjects, chapters, topics, tasks, and study session history? This cannot be undone unless you have exported a backup."
        confirmLabel="Erase Everything"
        variant="danger"
      />

      {/* Demo Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDemoDataConfirmOpen}
        onClose={() => setIsDemoDataConfirmOpen(false)}
        onConfirm={handleExecuteLoadDemoData}
        title="Load Sample Academic Data"
        message="This will add sample college courses (Computer Systems, Linear Algebra, Cognitive Philosophy) along with syllabus chapters, topics, demo tasks, and focus history for easy exploration."
        confirmLabel="Load Demo Data"
        variant="primary"
      />
    </div>
  );
};
