/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdBusinessCenter,
  MdVpnKey,
  MdAdminPanelSettings,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
  MdRocketLaunch,
  MdLogout,
  MdBarChart,
  MdAssignment,
} from 'react-icons/md';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { IconType } from 'react-icons';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: IconType;
  badge?: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { path: '/users', label: 'Users', icon: MdPeople },
  { path: '/organizations', label: 'Organizations', icon: MdBusinessCenter },
  { path: '/onboarding-data', label: 'Onboarding', icon: MdAssignment },
  { path: '/licenses', label: 'Licenses', icon: MdVpnKey },
  { path: '/admin-users', label: 'Admin Users', icon: MdAdminPanelSettings },
  { path: '/analytics', label: 'Analytics', icon: MdBarChart },
  { path: '/settings', label: 'Settings', icon: MdSettings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className={cn('flex items-center gap-3 flex-1 min-w-0', collapsed && 'justify-center')}>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <MdRocketLaunch className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">
                Euroasiann ERP
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Tech Portal</p>
            </div>
          )}
        </div>
        <button
          onClick={() => onToggle(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <MdChevronRight className="w-5 h-5" />
          ) : (
            <MdChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                  : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[hsl(var(--primary))]')} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-[hsl(var(--primary))]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Tech Admin'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.role || 'Admin'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'A'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <MdLogout className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
