/**
 * Subscription and Billing Page
 * Admin portal page to manage subscriptions and billing for organizations
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { 
  MdAdd, 
  MdSearch, 
  MdFilterList, 
  MdDownload, 
  MdEdit, 
  MdDelete, 
  MdCardMembership,
  MdCheckCircle, 
  MdWarning,
  MdSchedule,
  MdClose,
  MdRefresh,
  MdPayment,
  MdReceipt,
  MdAttachMoney,
  MdCancel,
  MdAutorenew
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Subscription {
  _id: string;
  organizationId: string;
  organizationName: string;
  planName: string;
  planType: 'basic' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt?: string;
}

export function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices'>('subscriptions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', filterStatus, filterPlan, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterPlan !== 'all') {
        params.append('planType', filterPlan);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/subscriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        // Return mock data if API doesn't exist yet
        return getMockSubscriptions();
      }
      const data = await response.json();
      return data.data as Subscription[];
    },
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/invoices?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        // Return mock data if API doesn't exist yet
        return getMockInvoices();
      }
      const data = await response.json();
      return data.data as Invoice[];
    },
  });

  // Mock data for development
  const getMockSubscriptions = (): Subscription[] => {
    const now = Date.now();
    return [
      {
        _id: '1',
        organizationId: 'org1',
        organizationName: 'Acme Corp',
        planName: 'Professional Plan',
        planType: 'professional',
        status: 'active',
        billingCycle: 'monthly',
        amount: 299,
        currency: 'USD',
        startDate: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        createdAt: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '2',
        organizationId: 'org2',
        organizationName: 'Tech Solutions',
        planName: 'Enterprise Plan',
        planType: 'enterprise',
        status: 'active',
        billingCycle: 'yearly',
        amount: 9999,
        currency: 'USD',
        startDate: new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(now + 185 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        createdAt: new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '3',
        organizationId: 'org3',
        organizationName: 'Global Inc',
        planName: 'Basic Plan',
        planType: 'basic',
        status: 'cancelled',
        billingCycle: 'monthly',
        amount: 99,
        currency: 'USD',
        startDate: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: false,
        createdAt: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '4',
        organizationId: 'org4',
        organizationName: 'Digital Ventures',
        planName: 'Professional Plan',
        planType: 'professional',
        status: 'active',
        billingCycle: 'quarterly',
        amount: 850,
        currency: 'USD',
        startDate: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(now + 45 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        createdAt: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '5',
        organizationId: 'org5',
        organizationName: 'Cloud Systems',
        planName: 'Enterprise Plan',
        planType: 'enterprise',
        status: 'pending',
        billingCycle: 'monthly',
        amount: 499,
        currency: 'USD',
        startDate: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: false,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '6',
        organizationId: 'org6',
        organizationName: 'Innovation Labs',
        planName: 'Custom Plan',
        planType: 'custom',
        status: 'suspended',
        billingCycle: 'monthly',
        amount: 199,
        currency: 'USD',
        startDate: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  const getMockInvoices = (): Invoice[] => {
    return [
      {
        _id: 'inv1',
        invoiceNumber: 'INV-2024-001',
        organizationId: 'org1',
        organizationName: 'Acme Corp',
        subscriptionId: '1',
        amount: 299,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 299, total: 299 },
        ],
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'inv2',
        invoiceNumber: 'INV-2024-002',
        organizationId: 'org2',
        organizationName: 'Tech Solutions',
        subscriptionId: '2',
        amount: 9999,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Enterprise Plan - Yearly', quantity: 1, unitPrice: 9999, total: 9999 },
        ],
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'inv3',
        invoiceNumber: 'INV-2024-003',
        organizationId: 'org1',
        organizationName: 'Acme Corp',
        subscriptionId: '1',
        amount: 299,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 299, total: 299 },
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  // Filter subscriptions by search query
  const filteredSubscriptions = React.useMemo(() => {
    const subscriptions = subscriptionsData || getMockSubscriptions();
    if (!searchQuery) return subscriptions;
    const query = searchQuery.toLowerCase();
    return subscriptions.filter(sub => 
      sub.organizationName.toLowerCase().includes(query) ||
      sub.planName.toLowerCase().includes(query) ||
      sub.planType.toLowerCase().includes(query)
    );
  }, [subscriptionsData, searchQuery]);

  // Filter invoices by search query
  const filteredInvoices = React.useMemo(() => {
    const invoices = invoicesData || getMockInvoices();
    if (!searchQuery) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.organizationName.toLowerCase().includes(query)
    );
  }, [invoicesData, searchQuery]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('Subscription deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete: ${error.message}`, 'error');
    },
  });

  const handleCreate = () => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleDelete = (subscription: Subscription) => {
    if (window.confirm(`Are you sure you want to delete subscription for ${subscription.organizationName}?`)) {
      deleteMutation.mutate(subscription._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-800',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800',
      suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800',
    };
    return (
      <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', styles[status as keyof typeof styles] || styles.active)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPlanBadge = (planType: string) => {
    const styles = {
      basic: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
      professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      custom: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    };
    return (
      <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', styles[planType as keyof typeof styles] || styles.basic)}>
        {planType.charAt(0).toUpperCase() + planType.slice(1)}
      </span>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-800',
    };
    return (
      <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', styles[status as keyof typeof styles] || styles.pending)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const subscriptionColumns = [
    {
      key: 'organization',
      header: 'Organization',
      render: (sub: Subscription) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{sub.organizationName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{sub.planName}</div>
        </div>
      ),
    },
    {
      key: 'planType',
      header: 'Plan Type',
      render: (sub: Subscription) => getPlanBadge(sub.planType),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (sub: Subscription) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {sub.currency} {sub.amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            /{sub.billingCycle}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (sub: Subscription) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(sub.status)}
          {sub.autoRenew && (
            <MdAutorenew className="w-4 h-4 text-blue-600 dark:text-blue-400" title="Auto-renew enabled" />
          )}
        </div>
      ),
    },
    {
      key: 'nextBillingDate',
      header: 'Next Billing',
      render: (sub: Subscription) => (
        <span className="text-gray-600 dark:text-gray-400">
          {sub.nextBillingDate 
            ? new Date(sub.nextBillingDate).toLocaleDateString() 
            : sub.endDate 
            ? `Expires: ${new Date(sub.endDate).toLocaleDateString()}`
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (sub: Subscription) => (
        <span className="text-gray-600 dark:text-gray-400">
          {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  const invoiceColumns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (invoice: Invoice) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {invoice.invoiceNumber}
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (invoice: Invoice) => (
        <span className="text-gray-600 dark:text-gray-400">
          {invoice.organizationName}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (invoice: Invoice) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {invoice.currency} {invoice.amount.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => getInvoiceStatusBadge(invoice.status),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (invoice: Invoice) => (
        <span className="text-gray-600 dark:text-gray-400">
          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      render: (invoice: Invoice) => (
        <span className="text-gray-600 dark:text-gray-400">
          {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  // Calculate stats
  const stats = React.useMemo(() => {
    const subscriptions = subscriptionsData || getMockSubscriptions();
    const invoices = invoicesData || getMockInvoices();
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const totalRevenue = activeSubscriptions.reduce((sum, s) => {
      const monthlyAmount = s.billingCycle === 'yearly' ? s.amount / 12 : s.billingCycle === 'quarterly' ? s.amount / 3 : s.amount;
      return sum + monthlyAmount;
    }, 0);
    
    return {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      totalRevenue: totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    };
  }, [subscriptionsData, invoicesData]);

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
    // TODO: Implement export functionality
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Subscription & Billing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Manage subscriptions, billing, and invoices for organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
          {activeTab === 'subscriptions' && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              <MdAdd className="w-5 h-5" />
              New Subscription
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdCardMembership className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <MdAttachMoney className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Invoices</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingInvoices}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <MdReceipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'subscriptions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Invoices
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <MdSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder={activeTab === 'subscriptions' 
                ? 'Search subscriptions by organization or plan...' 
                : 'Search invoices by number or organization...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filters - Only show for subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                <MdFilterList className="w-5 h-5" />
                <span>Filters:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'subscriptions' ? (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscriptions</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <MdDownload className="w-4 h-4" />
              Export
            </button>
          </div>
          
          {subscriptionsLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading subscriptions...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <DataTable
                columns={subscriptionColumns}
                data={filteredSubscriptions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyMessage="No subscriptions found."
              />
            </>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <MdDownload className="w-4 h-4" />
              Export
            </button>
          </div>
          
          {invoicesLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading invoices...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
                </p>
              </div>
              <DataTable
                columns={invoiceColumns}
                data={filteredInvoices}
                emptyMessage="No invoices found."
              />
            </>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingSubscription ? 'Edit Subscription' : 'Create New Subscription'}
        size="medium"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-400">
            Subscription form will be implemented here. This is a placeholder for the subscription creation/edit form.
          </p>
        </div>
      </Modal>
    </div>
  );
}

