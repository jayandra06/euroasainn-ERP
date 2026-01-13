/**
 * Ultra-Modern Header Component
 * World-Class SaaS ERP Platform Design
 */
import { useState } from 'react';
import { MdNotifications, MdHelp, MdKeyboardArrowDown, MdPerson, MdLibraryBooks, MdExitToApp, MdMenu, MdSearch, MdLock, MdTranslate, MdAccessTime, MdCalendarToday, MdRefresh, } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ThemeToggle';
export function Header({ sidebarCollapsed = false, onMenuClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const handleLogout = async () => {
        setShowUserMenu(false); // Close the menu first
        try {
            await logout();
            // Navigate to login page after logout
            navigate('/login', { replace: true });
        }
        catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigate('/login', { replace: true });
        }
    };
    const handleChangePassword = () => {
        setShowUserMenu(false);
        // TODO: Navigate to change password page or show modal
        navigate('/profile?tab=password');
    };
    const handleLanguageSelection = () => {
        setShowUserMenu(false);
        // TODO: Show language selection modal
        navigate('/profile?tab=language');
    };
    const handleTimezone = () => {
        setShowUserMenu(false);
        // TODO: Show timezone selection modal
        navigate('/profile?tab=timezone');
    };
    const handleDateFormat = () => {
        setShowUserMenu(false);
        // TODO: Show date format selection modal
        navigate('/profile?tab=date-format');
    };
    return (<header className={cn('fixed top-0 right-0 h-16 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] z-40 transition-all duration-300', sidebarCollapsed ? 'left-20' : 'left-72')}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]" aria-label="Toggle menu">
            <MdMenu className="w-5 h-5"/>
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl px-4 py-2 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0"/>
            <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"/>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button onClick={() => window.location.reload()} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]" aria-label="Refresh page" title="Refresh page">
            <MdRefresh className="w-5 h-5"/>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]" aria-label="Help">
            <MdHelp className="w-5 h-5"/>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]" aria-label="Notifications">
              <MdNotifications className="w-5 h-5"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[hsl(var(--background))]"/>
            </button>

            {showNotifications && (<>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}/>
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[hsl(var(--border))] overflow-hidden z-50">
                  <div className="p-4 border-b border-[hsl(var(--border))]">
                    <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      No new notifications
                    </div>
                  </div>
                </div>
              </>)}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.[0] || user?.email?.[0] || 'A'}
              </div>
              <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.email || 'User'}
                </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{user?.role || 'Admin'}</span>
              </div>
              <MdKeyboardArrowDown className={cn('w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform hidden md:block', showUserMenu && 'rotate-180')}/>
            </button>

            {showUserMenu && (<>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}/>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[hsl(var(--border))] overflow-hidden z-50">
                  <div className="p-4 bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.[0] || user?.email?.[0] || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                          {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'}
                        </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button onClick={() => {
                setShowUserMenu(false);
                navigate('/profile');
            }} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdPerson className="w-4 h-4"/>
                      <span>Profile</span>
                    </button>
                    <button onClick={handleChangePassword} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdLock className="w-4 h-4"/>
                      <span>Change/Reset Password</span>
                    </button>
                    <button onClick={handleLanguageSelection} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdTranslate className="w-4 h-4"/>
                      <span>Language Selection</span>
                    </button>
                    <button onClick={handleTimezone} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdAccessTime className="w-4 h-4"/>
                      <span>Time Zone</span>
                    </button>
                    <button onClick={handleDateFormat} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdCalendarToday className="w-4 h-4"/>
                      <span>Date and Time Format</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))] text-sm">
                      <MdLibraryBooks className="w-4 h-4"/>
                      <span>Help & Docs</span>
                    </button>
                    <div className="my-1 border-t border-[hsl(var(--border))]"/>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[hsl(var(--destructive))]/10 transition-colors text-[hsl(var(--destructive))] text-sm">
                      <MdExitToApp className="w-4 h-4"/>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>)}
          </div>
        </div>
      </div>
    </header>);
}
//# sourceMappingURL=Header.js.map