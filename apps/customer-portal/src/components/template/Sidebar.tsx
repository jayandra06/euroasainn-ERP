/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdDescription,
  MdLocalShipping,
  MdPeople,
  MdBusinessCenter,
  MdChevronLeft,
  MdChevronRight,
  MdRocketLaunch,
  MdLogout,
  MdDirectionsBoat,
  MdAccountBalance,
  MdTrendingUp,
  MdRoute,
  MdVerified,
  MdWarning,
  MdEco,
  MdLocationOn,
  MdManageAccounts,
  MdBusiness,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdHelp,
  MdBarChart,
  MdVpnKey,
  MdPayment,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavSubItem {
  path: string;
  label: string;
}

interface NavItem {
  path?: string;
  label: string;
  icon: IconType;
  badge?: string;
  submenu?: NavSubItem[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { path: '/analytics', label: 'Analytics', icon: MdBarChart },
  { path: '/fleet-overview', label: 'Fleet Overview', icon: MdDirectionsBoat },
  {
    label: 'Financial & Procurement',
    icon: MdAccountBalance,
    submenu: [
      { path: '/rfqs', label: 'RFQs' },
      { path: '/vendor-management', label: 'Vendor Management' },
      { path: '/claim-raised', label: 'Claim Rasied' },
    ],
  },
  { path: '/fleet-performance', label: 'Fleet performance & Maintai...', icon: MdTrendingUp },
  { path: '/vessel-finder', label: 'Vessel Finder & Route Opimi...', icon: MdRoute },
  { path: '/compliance', label: 'Complaince & Certifcation', icon: MdVerified },
  { path: '/crew-management', label: 'Crew Management', icon: MdPeople },
  { path: '/risk-management', label: 'Risk & Incident Management', icon: MdWarning },
  { path: '/sustainability', label: 'Sustuabinability & ESG Repor...', icon: MdEco },
  { path: '/port-management', label: 'Port Management', icon: MdLocationOn },
  { path: '/vessels', label: 'Vessel Management', icon: MdLocalShipping },
  { path: '/role-management', label: 'Role Management', icon: MdManageAccounts },
  { path: '/branch', label: 'Branch', icon: MdBusiness },
  { path: '/licenses', label: 'Licenses', icon: MdVpnKey },
  { path: '/payment', label: 'Payment', icon: MdPayment },
  {
    label: 'Support',
    icon: MdHelp,
    submenu: [
      { path: '/become-a-seller', label: 'Become a Seller' },
      { path: '/support', label: 'Support' },
      { path: '/terms-of-use', label: 'Terms Of Use' },
      { path: '/privacy-policy', label: 'Privacy Policy' },
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
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

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

  // Auto-expand submenus when their items are active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.submenu && item.submenu.some((subItem) => location.pathname === subItem.path)) {
        setExpandedMenus((prev) => {
          if (!prev.has(item.label)) {
            const newSet = new Set(prev);
            newSet.add(item.label);
            return newSet;
          }
          return prev;
        });
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isSubmenuExpanded = (label: string) => expandedMenus.has(label);

  const isSubmenuItemActive = (submenu: NavSubItem[]) => {
    return submenu.some((item) => location.pathname === item.path);
  };

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
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Customer Portal</p>
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
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isActive = item.path ? location.pathname === item.path : false;
          const isSubmenuActive = hasSubmenu && isSubmenuItemActive(item.submenu!);
          const isExpanded = hasSubmenu && isSubmenuExpanded(item.label);

          if (hasSubmenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleSubmenu(item.label)}
                  onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'group relative w-full flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isSubmenuActive
                      ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isSubmenuActive && 'text-[hsl(var(--primary))]')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                      {isExpanded ? (
                        <MdKeyboardArrowUp className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-[hsl(var(--border))] pl-4">
                    {item.submenu!.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={cn(
                            'group relative flex items-center gap-2 py-2 rounded-lg transition-all duration-200 text-sm',
                            isSubActive
                              ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          <span className="flex-1">{subItem.label}</span>
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
              key={item.path || item.label}
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
              {user?.firstName?.[0] || user?.email?.[0] || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Customer User'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.role || 'Customer'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'C'}
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
