/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 */
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdDashboard, MdInventory, MdDescription, MdShoppingCart, MdChevronLeft, MdChevronRight, MdRocketLaunch, MdLogout, MdPeople, MdTrendingUp, MdRequestQuote, MdAssignment, MdCategory, MdBusiness, MdInfo, MdDirectionsBoat, MdBook, MdHelp, MdKeyboardArrowDown, MdKeyboardArrowUp, MdFolder, MdVpnKey, MdPayment, } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const navItems = [
    {
        label: 'Vendor Dashboard',
        icon: MdFolder,
        isExpandable: true,
        subItems: [
            { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
            { path: '/rfqs', label: 'RFQs', icon: MdRequestQuote },
            { path: '/claim-requests', label: 'Claim Requests', icon: MdAssignment },
            { path: '/categories', label: 'Categories', icon: MdCategory },
            { path: '/brands', label: 'Brands', icon: MdBusiness },
            { path: '/orders', label: 'Orders', icon: MdShoppingCart },
            { path: '/details', label: 'Details', icon: MdInfo },
        ],
    },
    {
        label: 'Vessel Management',
        icon: MdDirectionsBoat,
        isExpandable: true,
        subItems: [
            { path: '/vessel-management', label: 'Vessel Management', icon: MdDirectionsBoat },
            { path: '/vessel-details', label: 'Vessel Details', icon: MdInfo },
        ],
    },
    {
        label: 'Catalog',
        icon: MdBook,
        isExpandable: true,
        subItems: [
            { path: '/catalog-management', label: 'Catalog Management', icon: MdInventory },
        ],
    },
    {
        label: 'Role Management',
        icon: MdPeople,
        isExpandable: true,
        subItems: [
            { path: "/roles-permissions", label: "Roles & Permissions", icon: MdAssignment },
            { path: '/assign-roles', label: 'Assign Roles', icon: MdAssignment },
        ],
    },
    {
        label: 'Support',
        icon: MdHelp,
        isExpandable: true,
        subItems: [
            { path: '/support', label: 'Support', icon: MdHelp },
            { path: '/terms-of-use', label: 'Terms Of Use', icon: MdDescription },
            { path: '/privacy-policy', label: 'Privacy Policy', icon: MdDescription },
        ],
    },
    { path: '/analytics', label: 'Analytics', icon: MdTrendingUp },
    { path: '/users', label: 'Users', icon: MdPeople },
    { path: '/licenses', label: 'Licenses', icon: MdVpnKey },
    { path: '/payment', label: 'Payment', icon: MdPayment },
];
export function Sidebar({ collapsed, onToggle }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tooltip, setTooltip] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimeoutRef = React.useRef(null);
    const [expandedMenus, setExpandedMenus] = useState(new Set(['Vendor Dashboard']));
    // Auto-expand menu if current path matches a sub-item
    useEffect(() => {
        navItems.forEach((item) => {
            if (item.subItems) {
                const hasActiveSubItem = item.subItems.some((subItem) => location.pathname === subItem.path);
                if (hasActiveSubItem) {
                    setExpandedMenus((prev) => new Set(prev).add(item.label));
                }
            }
        });
    }, [location.pathname]);
    const toggleSubmenu = (label) => {
        setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(label)) {
                newSet.delete(label);
            }
            else {
                newSet.add(label);
            }
            return newSet;
        });
    };
    const isSubmenuExpanded = (label) => {
        return expandedMenus.has(label);
    };
    const handleLogout = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await logout();
            // Navigation is already handled in AuthContext logout function
        }
        catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, clear local storage and navigate
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
        }
    };
    const handleMouseEnter = (e, label) => {
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
    const handleMouseMove = (e) => {
        if (collapsed && tooltip) {
            // Update tooltip position and keep it visible
            setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
            // Ensure tooltip stays visible while mouse is moving over button
            if (showTooltip) {
                // Tooltip is already visible, just update position
            }
            else if (tooltipTimeoutRef.current) {
                // Tooltip is scheduled to appear, keep it that way
            }
            else {
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
    return (<aside className={cn('fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col overflow-x-hidden overflow-y-auto', collapsed ? 'w-20' : 'w-72')}>
      {/* Logo Section */}
      <div className={cn('flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden', collapsed ? 'px-2 py-4' : 'px-6 py-5')}>
        <div className={cn('flex items-center gap-3 flex-1 min-w-0', collapsed && 'justify-center flex-shrink-0')}>
          <div className={cn('flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg', collapsed ? 'w-10 h-10' : 'w-10 h-10')}>
            <MdRocketLaunch className={cn('text-white', collapsed ? 'w-5 h-5' : 'w-6 h-6')}/>
          </div>
          {!collapsed && (<div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">
                Euroasiann ERP
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Vendor Portal</p>
            </div>)}
        </div>
        <button onClick={() => onToggle(!collapsed)} className={cn('rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] flex-shrink-0', collapsed ? 'p-1' : 'p-1.5')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? (<MdChevronRight className="w-5 h-5"/>) : (<MdChevronLeft className="w-5 h-5"/>)}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
            const Icon = item.icon;
            // Handle expandable items with submenus
            if (item.isExpandable && item.subItems) {
                const isExpanded = isSubmenuExpanded(item.label);
                const hasActiveSubItem = item.subItems.some((subItem) => location.pathname === subItem.path);
                return (<div key={item.label}>
                <button onClick={() => !collapsed && toggleSubmenu(item.label)} onMouseEnter={(e) => handleMouseEnter(e, item.label)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={cn('group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 w-full text-left', collapsed ? 'justify-center px-2' : 'px-3', hasActiveSubItem
                        ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                        : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]')}>
                  <Icon className={cn('w-5 h-5 flex-shrink-0', hasActiveSubItem && 'text-[hsl(var(--primary))]')}/>
                  {!collapsed && (<>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {isExpanded ? (<MdKeyboardArrowUp className="w-4 h-4"/>) : (<MdKeyboardArrowDown className="w-4 h-4"/>)}
                    </>)}
                </button>
                {!collapsed && isExpanded && (<div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (<NavLink key={subItem.path} to={subItem.path} onMouseEnter={(e) => handleMouseEnter(e, subItem.label)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={cn('group relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200', isSubActive
                                    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]')}>
                          <SubIcon className={cn('w-4 h-4 flex-shrink-0', isSubActive && 'text-[hsl(var(--primary))]')}/>
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </NavLink>);
                        })}
                  </div>)}
              </div>);
            }
            // Handle regular nav items
            const isActive = location.pathname === item.path;
            return (<NavLink key={item.path} to={item.path || '#'} onMouseEnter={(e) => handleMouseEnter(e, item.label)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={cn('group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200', collapsed ? 'justify-center px-2' : 'px-3', isActive
                    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]')}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[hsl(var(--primary))]')}/>
              {!collapsed && (<>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-[hsl(var(--primary))]">
                      {item.badge}
                    </span>)}
                </>)}
            </NavLink>);
        })}
      </nav>

      {/* User Section */}
      <div className={cn('border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden', collapsed ? 'px-2 py-3' : 'p-4')}>
        {!collapsed && (<div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'Vendor User'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.role || 'Vendor'}</p>
            </div>
          </div>)}
        {collapsed && (<div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || 'V'}
            </div>
          </div>)}
        <button onClick={handleLogout} onMouseEnter={(e) => collapsed && handleMouseEnter(e, 'Logout')} onMouseMove={(e) => collapsed && handleMouseMove(e)} onMouseLeave={() => collapsed && handleMouseLeave()} type="button" className={cn('group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 transition-colors', collapsed && 'justify-center')}>
          <MdLogout className="w-4 h-4"/>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Tooltip that follows mouse */}
      {collapsed && tooltip && (<div className={cn("fixed px-3 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-sm rounded-lg whitespace-nowrap shadow-lg z-[100] pointer-events-none transition-all duration-150 ease-in-out", showTooltip ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{
                left: `${tooltip.x + 10}px`,
                top: `${tooltip.y + 10}px`,
                transform: showTooltip ? 'translate(0, 0) scale(1)' : 'translate(0, 0) scale(0.95)',
            }}>
          {tooltip.label}
        </div>)}
    </aside>);
}
//# sourceMappingURL=Sidebar.js.map