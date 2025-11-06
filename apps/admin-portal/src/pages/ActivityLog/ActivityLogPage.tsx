/**
 * Activity/Audit Log Page
 * Admin portal page to view system activity and audit trail
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdSearch, MdFilterList, MdDownload, MdHistory, MdPerson, MdBusiness } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ActivityLog {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  organizationId?: string;
  organizationName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  portalType?: 'customer' | 'vendor'; // Add portal type for login filtering
}

export function ActivityLogPage() {
  const { showToast } = useToast();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
    // TODO: Implement export functionality
  };

  // Fetch logins from vendor and customer portals
  const { data: loginsData } = useQuery({
    queryKey: ['logins'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/logins`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return data.data || [];
      } catch (error: any) {
        console.error('Error fetching logins:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Convert logins to activity log format
  const loginActivityLogs = useMemo(() => {
    if (!loginsData || loginsData.length === 0) return [];
    
    return loginsData.map((login: any) => ({
      _id: `login-${login._id}`,
      userId: login._id,
      userName: login.fullName || `${login.firstName} ${login.lastName}`,
      userEmail: login.email,
      action: 'LOGIN',
      resource: 'Auth',
      resourceId: login._id,
      organizationId: login.organizationId,
      organizationName: login.organizationName,
      details: `User logged in to ${login.portalType} portal`,
      ipAddress: undefined,
      userAgent: undefined,
      timestamp: login.lastLogin,
      status: login.isActive ? 'success' : 'failed',
      portalType: login.portalType, // Add portal type for filtering
    } as ActivityLog & { portalType?: string }));
  }, [loginsData]);

  // Fetch activity logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['activity-logs', filterAction, filterStatus, filterDateRange, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterAction !== 'all') {
        params.append('action', filterAction);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterDateRange !== 'all') {
        params.append('dateRange', filterDateRange);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      try {
        const response = await fetch(`${API_URL}/api/v1/admin/activity-logs?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          // Return mock data if endpoint doesn't exist yet
          if (response.status === 404) {
            return getMockActivityLogs();
          }
          const error = await response.json().catch(() => ({ error: 'Failed to fetch activity logs' }));
          throw new Error(error.error || 'Failed to fetch activity logs');
        }
        const data = await response.json();
        return data.data || getMockActivityLogs();
      } catch (error: any) {
        // Return mock data on network errors
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          console.error('Network error fetching activity logs:', error);
          return getMockActivityLogs();
        }
        throw error;
      }
    },
  });

  // Mock data for demonstration
  function getMockActivityLogs(): ActivityLog[] {
    const now = Date.now();
    return [
      {
        _id: '1',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'CREATE',
        resource: 'Organization',
        resourceId: 'org1',
        organizationName: 'Acme Corp',
        details: 'Created new organization',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '2',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'UPDATE',
        resource: 'License',
        resourceId: 'lic1',
        organizationName: 'Tech Solutions',
        details: 'Updated license status to active',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '3',
        userId: 'user3',
        userName: 'Michael Brown',
        userEmail: 'michael@example.com',
        action: 'DELETE',
        resource: 'User',
        resourceId: 'user5',
        organizationName: 'Global Inc',
        details: 'Deleted user account',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '4',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'LOGIN',
        resource: 'Auth',
        organizationName: 'Acme Corp',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '5',
        userId: 'user4',
        userName: 'Sarah Johnson',
        userEmail: 'sarah@example.com',
        action: 'CREATE',
        resource: 'User',
        resourceId: 'user6',
        organizationName: 'Digital Ventures',
        details: 'Created new admin user',
        ipAddress: '192.168.1.4',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '6',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'UPDATE',
        resource: 'Organization',
        resourceId: 'org2',
        organizationName: 'Tech Solutions',
        details: 'Updated organization settings',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        status: 'failed',
      },
      {
        _id: '7',
        userId: 'user5',
        userName: 'David Wilson',
        userEmail: 'david@example.com',
        action: 'LOGIN',
        resource: 'Auth',
        organizationName: 'Innovation Labs',
        details: 'Failed login attempt - invalid password',
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
        status: 'failed',
      },
      {
        _id: '8',
        userId: 'user6',
        userName: 'Emily Davis',
        userEmail: 'emily@example.com',
        action: 'CREATE',
        resource: 'Subscription',
        resourceId: 'sub1',
        organizationName: 'Cloud Systems',
        details: 'Created new subscription plan',
        ipAddress: '192.168.1.6',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '9',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'LOGOUT',
        resource: 'Auth',
        organizationName: 'Acme Corp',
        details: 'User logged out',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '10',
        userId: 'user7',
        userName: 'Robert Miller',
        userEmail: 'robert@example.com',
        action: 'UPDATE',
        resource: 'License',
        resourceId: 'lic2',
        organizationName: 'Enterprise Solutions',
        details: 'Renewed license for 1 year',
        ipAddress: '192.168.1.7',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '11',
        userId: 'user3',
        userName: 'Michael Brown',
        userEmail: 'michael@example.com',
        action: 'CREATE',
        resource: 'Support Ticket',
        resourceId: 'tkt1',
        organizationName: 'Global Inc',
        details: 'Created support ticket #TKT-001',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '12',
        userId: 'user8',
        userName: 'Lisa Anderson',
        userEmail: 'lisa@example.com',
        action: 'UPDATE',
        resource: 'User',
        resourceId: 'user9',
        organizationName: 'Startup Hub',
        details: 'Updated user role to admin',
        ipAddress: '192.168.1.8',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '13',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'DELETE',
        resource: 'Organization',
        resourceId: 'org3',
        organizationName: 'Tech Solutions',
        details: 'Deleted organization',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
      {
        _id: '14',
        userId: 'user9',
        userName: 'Thomas White',
        userEmail: 'thomas@example.com',
        action: 'LOGIN',
        resource: 'Auth',
        organizationName: 'Digital Ventures',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.9',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '15',
        userId: 'user4',
        userName: 'Sarah Johnson',
        userEmail: 'sarah@example.com',
        action: 'CREATE',
        resource: 'Invoice',
        resourceId: 'inv1',
        organizationName: 'Digital Ventures',
        details: 'Generated invoice #INV-2024-001',
        ipAddress: '192.168.1.4',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '16',
        userId: 'user10',
        userName: 'James Taylor',
        userEmail: 'james@example.com',
        action: 'LOGIN',
        resource: 'Auth',
        organizationName: 'Cloud Systems',
        details: 'Failed login attempt - account locked',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'failed',
      },
      {
        _id: '17',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'UPDATE',
        resource: 'Subscription',
        resourceId: 'sub2',
        organizationName: 'Acme Corp',
        details: 'Upgraded subscription to Enterprise plan',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 11 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '18',
        userId: 'user5',
        userName: 'David Wilson',
        userEmail: 'david@example.com',
        action: 'CREATE',
        resource: 'License',
        resourceId: 'lic3',
        organizationName: 'Innovation Labs',
        details: 'Issued new license',
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '19',
        userId: 'user6',
        userName: 'Emily Davis',
        userEmail: 'emily@example.com',
        action: 'UPDATE',
        resource: 'Support Ticket',
        resourceId: 'tkt2',
        organizationName: 'Cloud Systems',
        details: 'Updated ticket status to resolved',
        ipAddress: '192.168.1.6',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 13 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        _id: '20',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'LOGOUT',
        resource: 'Auth',
        organizationName: 'Tech Solutions',
        details: 'User logged out',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
    ];
  }

  // Merge activity logs with login activity logs
  const allLogs = useMemo(() => {
    const regularLogs = logsData || [];
    const loginLogs = loginActivityLogs || [];
    
    // Combine and sort by timestamp (most recent first)
    const combined = [...regularLogs, ...loginLogs];
    return combined.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [logsData, loginActivityLogs]);

  const filteredLogs = useMemo(() => {
    if (!allLogs || allLogs.length === 0) return [];
    
    let filtered = allLogs;

    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (filterDateRange === 'today') {
          return logDate >= today;
        } else if (filterDateRange === 'week') {
          return logDate >= weekAgo;
        } else if (filterDateRange === 'month') {
          return logDate >= monthAgo;
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query) ||
        log.organizationName?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allLogs, filterAction, filterStatus, filterDateRange, searchQuery]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: ActivityLog) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date(log.timestamp).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(log.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (log: ActivityLog) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
            {log.userName[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{log.userName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{log.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: ActivityLog) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              {log.action}
            </span>
            {log.portalType && (
              <span
                className={cn(
                  'px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
                  log.portalType === 'customer'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
                )}
              >
                {log.portalType === 'customer' ? 'Customer' : 'Vendor'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.resource}</div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (log: ActivityLog) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {log.organizationName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: ActivityLog) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {log.details || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (log: ActivityLog) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            log.status === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
              : log.status === 'failed'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800'
          )}
        >
          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Activity/Audit Log
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            View system activity and audit trail
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-purple-500/30"
        >
          <MdDownload className="w-5 h-5" />
          Export Logs
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:border-purple-500 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <MdSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search activity logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
              <MdFilterList className="w-5 h-5" />
              <span>Filters:</span>
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading activity logs...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <DataTable
            columns={columns}
            data={filteredLogs}
            emptyMessage="No activity logs found."
          />
        </div>
      )}
    </div>
  );
}

