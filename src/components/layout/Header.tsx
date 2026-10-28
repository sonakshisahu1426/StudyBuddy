import React from 'react';
import { Menu, Search, Sun, Moon, Plus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenQuickAction: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenQuickAction,
  title,
}) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-850 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-charcoal-850/80 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 transition-colors text-xs sm:text-sm font-normal"
          aria-label="Search syllabus and tasks (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
          <span className="hidden sm:inline">Search syllabus & tasks...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded font-mono text-stone-400 dark:text-stone-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Task / Action */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-subtle"
          aria-label="Create new item"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
