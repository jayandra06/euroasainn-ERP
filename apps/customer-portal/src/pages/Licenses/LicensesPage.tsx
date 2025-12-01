import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { MdVpnKey, MdCheckCircle, MdCancel, MdInfo } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface License {
  _id: string;
  licenseKey: string;
  status: string;
  expiresAt: string;
  issuedAt: string;
  usageLimits: {
    users?: number;
    vessels?: number;
    items?: number;
    employees?: number;
    businessUnits?: number;
  };
  currentUsage: {
    users?: number;
    vessels?: number;
    items?: number;
    employees?: number;
    businessUnits?: number;
  };
}

export function LicensesPage() {
  const { data: licenses, isLoading } = useQuery<License[]>({
    queryKey: ['licenses'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/licenses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch licenses');
      const data = await response.json();
      return data.data || [];
    },
  });

  const columns = [
    {
      key: 'licenseKey',
      header: 'License Key',
      render: (item: License) => (
        <div className="font-mono text-sm text-[hsl(var(--foreground))]">{item.licenseKey}</div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: License) => {
        const isActive = item.status === 'active';
        const isExpired = new Date(item.expiresAt) < new Date();
        
        if (isExpired) {
          return (
            <span className="inline-flex items-center" title="Expired">
              <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />
            </span>
          );
        }
        
        if (isActive) {
          return (
            <span className="inline-flex items-center" title="Active">
              <MdCheckCircle className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
            </span>
          );
        }
        
        return (
          <span className="inline-flex items-center" title={item.status}>
            <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </span>
        );
      },
    },
    {
      key: 'issuedAt',
      header: 'Issued Date',
      render: (item: License) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.issuedAt ? new Date(item.issuedAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expiry Date',
      render: (item: License) => {
        const expiry = new Date(item.expiresAt);
        const isExpired = expiry < new Date();
        return (
          <span className={cn('text-gray-600 dark:text-gray-400', isExpired && 'text-red-600 dark:text-red-400')}>
            {expiry.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (item: License) => (
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            Users: {item.currentUsage?.users || 0} / {item.usageLimits?.users || 0}
          </div>
          {item.usageLimits?.vessels !== undefined && (
            <div className="text-gray-600 dark:text-gray-400">
              Vessels: {item.currentUsage?.vessels || 0} / {item.usageLimits.vessels}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Licenses
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          View your organization's licenses and subscription details
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <MdVpnKey className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Your Licenses</h2>
        </div>
        <DataTable
          columns={columns}
          data={licenses || []}
          emptyMessage="No licenses found. Please complete payment to activate your subscription."
        />
      </div>
    </div>
  );
}










