import React from 'react';
import { MdLightMode, MdDarkMode, MdNotificationsNone, MdHelp, MdMenu, MdSearch } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function Header({ sidebarCollapsed, onMenuClick }: { sidebarCollapsed?: boolean; onMenuClick?: () => void }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className={cn('fixed top-0 right-0 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 z-40 transition-all duration-300 shadow-sm', sidebarCollapsed ? 'left-20' : 'left-72')}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <MdMenu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="hidden md:flex items-center gap-3 w-64 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <MdSearch className="w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            {resolvedTheme === 'dark' ? <MdLightMode className="w-5 h-5" /> : <MdDarkMode className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 relative">
            <MdNotificationsNone className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            <MdHelp className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.[0] || 'C'}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Customer'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}






