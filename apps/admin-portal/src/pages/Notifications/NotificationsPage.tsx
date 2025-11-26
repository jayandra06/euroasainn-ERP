/**
 * Notifications Page
 * Admin portal page to view and manage notifications
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdCheckCircle, MdCancel, MdDelete, MdSettings, MdMarkEmailRead } from 'react-icons/md';
import { cn } from '../../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  category: string;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Organization Created',
    message: 'Acme Corp has been added to the platform',
    type: 'success',
    read: false,
    timestamp: new Date().toISOString(),
    category: 'Organizations',
  },
  {
    id: '2',
    title: 'License Expiring Soon',
    message: 'Tech Solutions license expires in 7 days',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'Licenses',
  },
  {
    id: '3',
    title: 'User Login Failed',
    message: 'Multiple failed login attempts detected',
    type: 'error',
    read: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    category: 'Security',
  },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const handleSettings = () => {
    // Navigate to settings page or open settings modal
    // For now, show a message
    alert('Notification settings will be implemented soon');
    // TODO: Navigate to settings or open settings modal
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (filterRead === 'read' && !notif.read) return false;
    if (filterRead === 'unread' && notif.read) return false;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-[hsl(var(--foreground))] font-semibold dark:bg-amber-900/50 border-amber-200 dark:border-amber-800';
      case 'error':
        return 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 border-blue-200 dark:border-blue-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-xl transition-colors font-semibold text-sm"
            >
              <MdMarkEmailRead className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={handleSettings}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] rounded-xl transition-colors font-semibold text-sm text-[hsl(var(--foreground))]"
          >
            <MdSettings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Notifications</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{notifications.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <MdNotifications className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Unread</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] font-semibold">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <MdCancel className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Read</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] font-semibold">
                {notifications.length - unreadCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
            <MdNotifications className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
            <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'p-6 rounded-xl border shadow-sm transition-all',
                notif.read
                  ? 'bg-[hsl(var(--card))] border-[hsl(var(--border))]'
                  : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn('px-3 py-1 text-xs font-bold rounded-full border', getTypeStyles(notif.type))}>
                      {notif.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{notif.category}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    {notif.message}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-[hsl(var(--foreground))] font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                      title="Mark as read"
                    >
                      <MdCheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-[hsl(var(--destructive))] hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                    title="Delete"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

