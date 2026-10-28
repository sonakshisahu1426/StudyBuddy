import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ensureDbInitialized } from './db';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { PlannerPage } from './pages/PlannerPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { FocusRoomPage } from './pages/FocusRoomPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    ensureDbInitialized()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize database', err);
        setDbError('IndexedDB failed to initialize. Please verify your browser storage settings.');
      });
  }, []);

  if (dbError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-6 bg-paper-50 dark:bg-charcoal-950 text-stone-900 dark:text-stone-100">
        <div className="max-w-md p-6 bg-white dark:bg-charcoal-900 border border-rose-200 dark:border-rose-900 rounded-xl shadow-elevated text-center space-y-3">
          <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400">Database Initialization Error</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper-50 dark:bg-charcoal-950 text-stone-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Initializing StudyBuddy...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/timer" element={<FocusRoomPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
