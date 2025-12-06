/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 * Updated: Admin Users → Role Management dropdown
 */

import React, { useState } from 'react';
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
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdSecurity,
  MdPersonAdd,
} from 'react-icons/md';

import { IconType } from 'react-icons';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  path?: string;
  label: string;
  icon: IconType;
  badge?: string;
  children?: { path: string; label: string; icon: IconType }[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { path: '/users', label: 'Users', icon: MdPeople },
  { path: '/organizations', label: 'Organizations', icon: MdBusinessCenter },
  { path: '/onboarding-data', label: 'Onboarding', icon: MdAssignment },
  { path: '/licenses', label: 'Licenses', icon: MdVpnKey },

  // ⭐ REPLACEMENT FOR ADMIN USERS
  {
    label: 'Role Management',
    icon: MdAdminPanelSettings,
    children: [
      { path: '/roles', label: 'Roles & Permissions', icon: MdSecurity },
      { path: '/assign-roles', label: 'Assign Roles', icon: MdPersonAdd },
    ],
  },

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

  const [openMenu, setOpenMenu] = useState<string | null>('Role Management');

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
      <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(var(--border))]">
        <div className={cn('flex items-center gap-3 flex-1 min-w-0', collapsed && 'justify-center')}>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <MdRocketLaunch className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">Euroasiann ERP</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Tech Portal</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onToggle(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
        >
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {

          // ============ DROPDOWN MENU ================
          if (item.children) {
            const isOpen = openMenu === item.label;

            return (
              <div key={item.label}>
                {/* Parent Button */}
                <button
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                  className={cn(
                    'group relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200',
                    collapsed && 'justify-center px-2',
                    'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>

                  {!collapsed &&
                    (isOpen ? (
                      <MdKeyboardArrowDown className="w-4 h-4" />
                    ) : (
                      <MdKeyboardArrowRight className="w-4 h-4" />
                    ))}
                </button>

                {/* Children */}
                {!collapsed && isOpen && (
                  <div className="ml-10 mt-2 space-y-1">
                    {item.children.map((child) => {
                      const isActive = location.pathname === child.path;

                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2 text-sm rounded-md transition',
                            isActive
                              ? 'text-[hsl(var(--primary))] font-semibold'
                              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ============ SINGLE MENU ITEM ================
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div>
              <p className="font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20',
            collapsed && 'justify-center'
          )}
        >
          <MdLogout className="w-4 h-4" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
