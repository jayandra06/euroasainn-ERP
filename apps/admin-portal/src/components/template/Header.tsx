/**
 * Ultra-Modern Header Component
 * World-Class SaaS ERP Platform Design
 */

import React, { useState } from 'react';
import {
  MdNotifications,
  MdHelp,
  MdKeyboardArrowDown,
  MdPerson,
  MdSettings,
  MdLibraryBooks,
  MdExitToApp,
  MdMenu,
  MdSearch,
  MdLightMode,
  MdDarkMode,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function Header({ sidebarCollapsed = false, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 transition-all duration-300',
        sidebarCollapsed ? 'left-20' : 'left-72'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Toggle menu"
          >
            <MdMenu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <MdSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <MdLightMode className="w-5 h-5" />
            ) : (
              <MdDarkMode className="w-5 h-5" />
            )}
          </button>

          {/* Help */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Help"
          >
            <MdHelp className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              aria-label="Notifications"
            >
              <MdNotifications className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.[0] || user?.email?.[0] || 'A'}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Admin'}</span>
              </div>
              <MdKeyboardArrowDown
                className={cn(
                  'w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform hidden md:block',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.[0] || user?.email?.[0] || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <MdPerson className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <MdSettings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm">
                      <MdLibraryBooks className="w-4 h-4" />
                      <span>Help & Docs</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 dark:text-red-400 text-sm"
                    >
                      <MdExitToApp className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

