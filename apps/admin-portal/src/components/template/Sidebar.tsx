/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdBusinessCenter,
  MdVpnKey,
  MdTrendingUp,
  MdChevronLeft,
  MdChevronRight,
  MdRocketLaunch,
  MdLogout,
  MdPeople,
  MdPerson,
  MdHistory,
  MdDescription,
  MdNotifications,
  MdSupport,
  MdPayment,
  MdSettings,
  MdRequestQuote,
  MdInventory,
  MdStore,
  MdCategory,
  MdModelTraining,
  MdExpandMore,
  MdExpandLess,
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
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Admin Dashboard',
    icon: MdDashboard,
    children: [
      { path: '/dashboard/admin', label: 'Dashboard', icon: MdDashboard },
      { path: '/dashboard/admin/rfqs', label: 'RFQs', icon: MdRequestQuote },
      { path: '/dashboard/admin/inventory', label: 'Inventory', icon: MdInventory },
    ],
  },
  {
    label: 'Vendors',
    icon: MdStore,
    children: [
      { path: '/dashboard/admin/vendors', label: 'All Vendors', icon: MdPeople },
      { path: '/dashboard/admin/brands', label: 'Brands', icon: MdStore },
      { path: '/dashboard/admin/categories', label: 'Categories', icon: MdCategory },
      { path: '/dashboard/admin/models', label: 'Models', icon: MdModelTraining },
    ],
  },
  {
    label: 'Customers',
    icon: MdPeople,
    children: [
      { path: '/dashboard/admin/customers', label: 'All Customers', icon: MdPeople },
      { path: '/dashboard/admin/customers/support', label: 'Support', icon: MdSupport },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Admin Dashboard', 'Vendors', 'Customers']));

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
      // Navigation is already handled in AuthContext logout function
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local storage and navigate
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    if (collapsed) {
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      
      // Set tooltip data immediately but delay showing it
      setTooltip({ label, x: e.clientX, y: e.clientY });
      setShowTooltip(false);
      
      // Show tooltip after a short delay for smoother experience
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 150);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (collapsed && tooltip) {
      // Update tooltip position and keep it visible
      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
      // Ensure tooltip stays visible while mouse is moving over button
      if (showTooltip) {
        // Tooltip is already visible, just update position
      } else if (tooltipTimeoutRef.current) {
        // Tooltip is scheduled to appear, keep it that way
      } else {
        // Tooltip should be visible but isn't, show it immediately
        setShowTooltip(true);
      }
    }
  };

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before tooltip appears
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    // Hide tooltip immediately when mouse leaves
    setShowTooltip(false);
    setTooltip(null);
  };

  // Cleanup timeout on unmount or when collapsed changes
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col overflow-x-hidden overflow-y-auto',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo Section */}
      <div className={cn('flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden', collapsed ? 'px-2 py-4' : 'px-6 py-5')}>
        <div className={cn('flex items-center gap-3 flex-1 min-w-0', collapsed && 'justify-center flex-shrink-0')}>
          <div className={cn('flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg', collapsed ? 'w-10 h-10' : 'w-10 h-10')}>
            <MdRocketLaunch className={cn('text-white', collapsed ? 'w-5 h-5' : 'w-6 h-6')} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">
                Euroasiann ERP
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Admin Portal</p>
            </div>
          )}
        </div>
        <button
          onClick={() => onToggle(!collapsed)}
          className={cn('rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] flex-shrink-0', collapsed ? 'p-1' : 'p-1.5')}
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
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections.has(item.label);
          const isActive = item.path ? location.pathname === item.path : false;
          const hasActiveChild = item.children?.some(child => child.path && location.pathname === child.path);

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (!collapsed) {
                      const newExpanded = new Set(expandedSections);
                      if (isExpanded) {
                        newExpanded.delete(item.label);
                      } else {
                        newExpanded.add(item.label);
                      }
                      setExpandedSections(newExpanded);
                    }
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 w-full text-left',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    hasActiveChild
                      ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', hasActiveChild && 'text-[hsl(var(--primary))]')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {isExpanded ? (
                        <MdExpandLess className="w-4 h-4" />
                      ) : (
                        <MdExpandMore className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = child.path ? location.pathname === child.path : false;
                      return (
                        <NavLink
                          key={child.path || child.label}
                          to={child.path || '#'}
                          onMouseEnter={(e) => handleMouseEnter(e, child.label)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                          className={cn(
                            'group relative flex items-center gap-3 py-2 rounded-lg transition-all duration-200',
                            'px-3',
                            isChildActive
                              ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          <ChildIcon className={cn('w-4 h-4 flex-shrink-0', isChildActive && 'text-[hsl(var(--primary))]')} />
                          <span className="flex-1 text-sm">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path || '#'}
              onMouseEnter={(e) => handleMouseEnter(e, item.label)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={cn(
                'group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200',
                collapsed ? 'justify-center px-2' : 'px-3',
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
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={cn('border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden', collapsed ? 'px-2 py-3' : 'p-4')}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Admin User'}
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
          onMouseEnter={(e) => collapsed && handleMouseEnter(e, 'Logout')}
          onMouseMove={(e) => collapsed && handleMouseMove(e)}
          onMouseLeave={() => collapsed && handleMouseLeave()}
          type="button"
          className={cn(
            'group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <MdLogout className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Tooltip that follows mouse */}
      {collapsed && tooltip && (
        <div
          className={cn(
            "fixed px-3 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-sm rounded-lg whitespace-nowrap shadow-lg z-[100] pointer-events-none transition-all duration-150 ease-in-out",
            showTooltip ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            transform: showTooltip ? 'translate(0, 0) scale(1)' : 'translate(0, 0) scale(0.95)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </aside>
  );
}



