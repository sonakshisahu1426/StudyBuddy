import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Timer,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Study Planner', icon: Calendar },
    { to: '/subjects', label: 'My Subjects', icon: BookOpen },
    { to: '/timer', label: 'Focus Room', icon: Timer },
    { to: '/progress', label: 'My Progress', icon: BarChart3 },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-stone-200 dark:border-stone-850 bg-white dark:bg-charcoal-900 transition-all duration-200 shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-stone-100 dark:border-stone-850">
        <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="w-8 h-8 rounded-lg bg-forest-700 dark:bg-forest-600 text-white flex items-center justify-center shrink-0 shadow-subtle">
            <BookMarked className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-forest-700 dark:group-hover:text-forest-400 transition-colors">
                StudyBuddy
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">
                Workspace
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="p-3 border-t border-stone-100 dark:border-stone-850">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
            }`
          }
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
