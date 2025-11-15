import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { LicenseForm } from './LicenseForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface License {
  _id: string;
  licenseKey: string;
  licenseType: 'customer' | 'vendor';
  status: string;
  organizationId: any;
  issuedDate: string;
  expiryDate: string;
  maxUsers: number;
  maxVessels?: number;
  maxItems?: number;
  currentUserCount?: number;
  currentVesselCount?: number;
  currentItemCount?: number;
  features?: string[];
  createdAt?: string;
}

export function LicensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch organizations for dropdown with optimized caching (shared cache with OrganizationsPage)
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/tech/organizations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (gcTime replaces cacheTime in v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data: any) => {
      // Only return id and name for dropdown (reduce data transfer)
      if (!data || !Array.isArray(data)) return [];
      return data.map((org: any) => ({ _id: org._id, name: org.name }));
    },
  });

  // Fetch licenses with backend filtering (optimized)
  const { data: licensesData, isLoading: isLoadingLicenses } = useQuery({
    queryKey: ['licenses', filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterType !== 'all') {
        params.append('licenseType', filterType);
      }

      const response = await fetch(`${API_URL}/api/v1/tech/licenses?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch licenses');
      const data = await response.json();
      return data.data as License[];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (gcTime replaces cacheTime in v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/licenses/${licenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete license');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      alert('License deleted successfully!');
    },
    onError: (error: Error) => {
      alert(`Failed to delete license: ${error.message}`);
    },
  });

  const handleCreate = () => {
    setEditingLicense(null);
    setIsModalOpen(true);
  };

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    setIsModalOpen(true);
  };

  const handleDelete = (license: License) => {
    if (window.confirm(`Are you sure you want to delete license ${license.licenseKey}?`)) {
      deleteMutation.mutate(license._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLicense(null);
  };

  const getOrganizationName = (orgId: any) => {
    if (!orgId || !orgsData) return 'Unknown';
    const org = (orgsData as any[]).find((o: any) => o._id === orgId._id || o._id === orgId);
    return org?.name || 'Unknown';
  };

  const columns = [
    {
      key: 'licenseKey',
      header: 'License Key',
      render: (license: License) => (
        <div>
          <strong className="license-key-text">{license.licenseKey}</strong>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (license: License) => getOrganizationName(license.organizationId),
    },
    {
      key: 'licenseType',
      header: 'Type',
      render: (license: License) => (
        <span className={`type-badge type-${license.licenseType}`}>
          {license.licenseType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (license: License) => (
        <span className={`status-badge status-${license.status}`}>
          {license.status}
        </span>
      ),
    },
    {
      key: 'limits',
      header: 'Limits',
      render: (license: License) => (
        <div className="license-limits">
          <span>Users: {license.currentUserCount || 0}/{license.maxUsers}</span>
          {license.maxVessels && (
            <span>Vessels: {license.currentVesselCount || 0}/{license.maxVessels}</span>
          )}
          {license.maxItems && (
            <span>Items: {license.currentItemCount || 0}/{license.maxItems}</span>
          )}
        </div>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expires',
      render: (license: License) => {
        const expiry = new Date(license.expiryDate);
        const isExpired = expiry < new Date();
        return (
          <span className={isExpired ? 'expired' : ''}>
            {expiry.toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  if (isLoadingLicenses) {
    return <div className="loading">Loading licenses...</div>;
  }

  return (
    <div className="licenses-page">
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1>Licenses</h1>
            <p className="page-description">Manage organization licenses and limits</p>
          </div>
          <button onClick={handleCreate} className="create-button">
            + Create License
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Filter by Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={(licensesData as License[]) || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No licenses found. Create your first license!"
        />

        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={editingLicense ? 'Edit License' : 'Create License'}
          size="large"
        >
          <LicenseForm
            license={editingLicense || undefined}
            organizations={(orgsData as any) || []}
            onSuccess={() => {
              handleClose();
              queryClient.invalidateQueries({ queryKey: ['licenses'] });
              queryClient.invalidateQueries({ queryKey: ['organizations'] });
            }}
            onCancel={handleClose}
          />
        </Modal>
      </div>
    </div>
  );
}

