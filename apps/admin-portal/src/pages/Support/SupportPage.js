/**
 * Support Management Page
 * Admin portal page to manage support tickets and customer support
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { SupportTicketForm } from './SupportTicketForm';
import { MdAdd, MdSearch, MdFilterList, MdDownload, MdSupport, MdCheckCircle, MdWarning, MdSchedule, MdRefresh } from 'react-icons/md';
import { cn } from '../../lib/utils';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function SupportPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Fetch support tickets
    const { data: ticketsData, isLoading } = useQuery({
        queryKey: ['support-tickets', filterStatus, filterPriority, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') {
                params.append('status', filterStatus);
            }
            if (filterPriority !== 'all') {
                params.append('priority', filterPriority);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            const response = await fetch(`${API_URL}/api/v1/admin/support-tickets?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok) {
                // Return mock data if API doesn't exist yet
                return getMockTickets();
            }
            const data = await response.json();
            return data.data;
        },
    });
    // Mock data for development
    const getMockTickets = () => {
        const now = Date.now();
        return [
            {
                _id: '1',
                ticketNumber: 'TKT-001',
                subject: 'Login Issues',
                description: 'Unable to login to the system',
                status: 'open',
                priority: 'urgent',
                organizationName: 'Acme Corp',
                createdBy: 'user@example.com',
                createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '2',
                ticketNumber: 'TKT-002',
                subject: 'Feature Request',
                description: 'Request for new reporting feature',
                status: 'in-progress',
                priority: 'medium',
                organizationName: 'Tech Solutions',
                createdBy: 'admin@example.com',
                assignedTo: 'support@example.com',
                createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '3',
                ticketNumber: 'TKT-003',
                subject: 'Billing Question',
                description: 'Question about subscription billing',
                status: 'resolved',
                priority: 'low',
                organizationName: 'Global Inc',
                createdBy: 'billing@example.com',
                assignedTo: 'support@example.com',
                createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
                resolvedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '4',
                ticketNumber: 'TKT-004',
                subject: 'API Integration Help',
                description: 'Need assistance with API integration',
                status: 'open',
                priority: 'high',
                organizationName: 'Digital Ventures',
                createdBy: 'dev@example.com',
                createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '5',
                ticketNumber: 'TKT-005',
                subject: 'Password Reset',
                description: 'Unable to reset password',
                status: 'in-progress',
                priority: 'medium',
                organizationName: 'Cloud Systems',
                createdBy: 'user2@example.com',
                assignedTo: 'support@example.com',
                createdAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '6',
                ticketNumber: 'TKT-006',
                subject: 'License Renewal',
                description: 'Questions about license renewal process',
                status: 'resolved',
                priority: 'low',
                organizationName: 'Innovation Labs',
                createdBy: 'admin2@example.com',
                assignedTo: 'support@example.com',
                createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
                resolvedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
            },
            {
                _id: '7',
                ticketNumber: 'TKT-007',
                subject: 'System Performance',
                description: 'System is running slow',
                status: 'open',
                priority: 'high',
                organizationName: 'Enterprise Solutions',
                createdBy: 'ops@example.com',
                createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
            },
        ];
    };
    // Filter tickets by search query
    const filteredTickets = React.useMemo(() => {
        const tickets = ticketsData || getMockTickets();
        if (!searchQuery)
            return tickets;
        const query = searchQuery.toLowerCase();
        return tickets.filter(ticket => ticket.ticketNumber.toLowerCase().includes(query) ||
            ticket.subject.toLowerCase().includes(query) ||
            ticket.description.toLowerCase().includes(query) ||
            ticket.organizationName?.toLowerCase().includes(query));
    }, [ticketsData, searchQuery]);
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (ticketId) => {
            const response = await fetch(`${API_URL}/api/v1/admin/support-tickets/${ticketId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete ticket');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            showToast('Ticket deleted successfully!', 'success');
        },
        onError: (error) => {
            showToast(`Failed to delete: ${error.message}`, 'error');
        },
    });
    const handleCreate = () => {
        setEditingTicket(null);
        setIsModalOpen(true);
    };
    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setIsModalOpen(true);
    };
    const handleDelete = (ticket) => {
        if (window.confirm(`Are you sure you want to delete ticket ${ticket.ticketNumber}?`)) {
            deleteMutation.mutate(ticket._id);
        }
    };
    const handleClose = () => {
        setIsModalOpen(false);
        setEditingTicket(null);
    };
    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        showToast(editingTicket ? 'Ticket updated successfully!' : 'Ticket created successfully!', 'success');
        handleClose();
    };
    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800',
            'in-progress': 'bg-amber-100 text-[hsl(var(--foreground))] font-semibold dark:bg-amber-900/50 ring-1 ring-amber-200 dark:ring-amber-800',
            resolved: 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800',
            closed: 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--border))]',
        };
        return (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', styles[status] || styles.open)}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>);
    };
    const getPriorityBadge = (priority) => {
        const styles = {
            low: 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]',
            medium: 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50',
            high: 'bg-orange-100 text-[hsl(var(--foreground))] font-semibold dark:bg-orange-900/50',
            urgent: 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50',
        };
        return (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', styles[priority] || styles.low)}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>);
    };
    const columns = [
        {
            key: 'ticketNumber',
            header: 'Ticket #',
            render: (ticket) => (<div className="font-semibold text-[hsl(var(--foreground))]">
          {ticket.ticketNumber}
        </div>),
        },
        {
            key: 'subject',
            header: 'Subject',
            render: (ticket) => (<div>
          <div className="font-semibold text-[hsl(var(--foreground))]">{ticket.subject}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">{ticket.description}</div>
        </div>),
        },
        {
            key: 'organization',
            header: 'Organization',
            render: (ticket) => (<span className="text-[hsl(var(--muted-foreground))]">
          {ticket.organizationName || 'N/A'}
        </span>),
        },
        {
            key: 'priority',
            header: 'Priority',
            render: (ticket) => getPriorityBadge(ticket.priority),
        },
        {
            key: 'status',
            header: 'Status',
            render: (ticket) => getStatusBadge(ticket.status),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (ticket) => (<span className="text-[hsl(var(--muted-foreground))]">
          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
        </span>),
        },
    ];
    // Calculate stats
    const stats = React.useMemo(() => {
        const tickets = ticketsData || getMockTickets();
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in-progress').length,
            resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            urgent: tickets.filter(t => t.priority === 'urgent').length,
        };
    }, [ticketsData]);
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Support Management
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Manage support tickets and customer inquiries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            setIsRefreshing(true);
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            setTimeout(() => setIsRefreshing(false), 1000);
        }} disabled={isRefreshing} className="flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            <MdRefresh className={cn('w-5 h-5', isRefreshing && 'animate-spin')}/>
            Refresh
          </button>
          <button onClick={handleCreate} className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40">
            <MdAdd className="w-5 h-5"/>
            New Ticket
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdSupport className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Open</p>
              <p className="text-3xl font-bold text-[hsl(var(--primary))]">{stats.open}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
              <MdSchedule className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">In Progress</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <MdWarning className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Resolved</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdCheckCircle className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Urgent</p>
              <p className="text-3xl font-bold text-[hsl(var(--destructive))]">{stats.urgent}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdWarning className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0"/>
            <input type="text" placeholder="Search tickets by number, subject, or organization..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"/>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
              <MdFilterList className="w-5 h-5"/>
              <span>Filters:</span>
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium">
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support Tickets Table */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Support Tickets</h2>
            <button onClick={() => showToast('Export functionality will be implemented soon', 'info')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium text-[hsl(var(--foreground))]">
              <MdDownload className="w-4 h-4"/>
              Export
            </button>
          </div>
        
        {isLoading ? (<div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading tickets...</p>
          </div>) : (<>
            <div className="mb-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
              </p>
            </div>
            <DataTable columns={columns} data={filteredTickets} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No support tickets found."/>
          </>)}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleClose} title={editingTicket ? 'Edit Ticket' : 'Create New Ticket'} size="medium">
        <SupportTicketForm ticket={editingTicket} onSuccess={handleSuccess} onCancel={handleClose}/>
      </Modal>
    </div>);
}
//# sourceMappingURL=SupportPage.js.map