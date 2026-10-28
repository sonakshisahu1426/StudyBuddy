import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Timer,
  BarChart3,
  Settings,
  X,
  BookMarked,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Study Planner', icon: Calendar },
    { to: '/subjects', label: 'My Subjects', icon: BookOpen },
    { to: '/timer', label: 'Focus Room', icon: Timer },
    { to: '/progress', label: 'My Progress', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-charcoal-900 border-r border-stone-200 dark:border-stone-850 p-4 flex flex-col shadow-xl z-10">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-700 dark:bg-forest-600 text-white flex items-center justify-center shrink-0">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100">
                StudyBuddy
              </h2>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">
                Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
