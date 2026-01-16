import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { MdAdd } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Employee {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  department?: string;
}

interface BusinessUnit {
  _id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  representativeId?: string;
  metadata?: {
    address?: string;
    phoneNumber?: string;
    representativeId?: string;
  };
}

export function BranchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    representativeId: '',
  });

  // Fetch employees for representative dropdown
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/employees`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch business units
  const { data: businessUnits, isLoading } = useQuery<BusinessUnit[]>({
    queryKey: ['business-units'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch business units');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create business unit mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }

        const url = `${API_URL}/api/v1/customer/business-units`;
        console.log('Creating business unit:', { url, data });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: data.name,
            metadata: {
              address: data.address,
              phoneNumber: data.phoneNumber,
              representativeId: data.representativeId,
            },
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to create business unit';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        return response.json();
      } catch (error: any) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error(`Network error: Unable to connect to API. Please check if the server is running at ${API_URL}`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
      showToast('Business unit created successfully!', 'success');
      setShowAddModal(false);
      setFormData({ name: '', address: '', phoneNumber: '', representativeId: '' });
    },
    onError: (error: Error) => {
      console.error('Create business unit error:', error);
      showToast(error.message || 'Failed to create business unit', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('BU name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleClose = () => {
    setShowAddModal(false);
    setFormData({ name: '', address: '', phoneNumber: '', representativeId: '' });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Your Branches</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          Add BU
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading business units...</p>
        </div>
      ) : (
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">NAME</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">ADDRESS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">PHONE NUMBER</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">REPRESENTATIVE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {businessUnits && businessUnits.length > 0 ? (
                businessUnits.map((unit) => {
                  const metadata = unit.metadata || {};
                  const representative = employees?.find((e) => e._id === (metadata.representativeId || unit.representativeId));
                  return (
                    <tr key={unit._id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))] font-medium">
                        <button
                          onClick={() => navigate(`/dashboard/branch/${unit._id}`)}
                          className="text-[hsl(var(--primary))] hover:underline cursor-pointer"
                        >
                          {unit.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{metadata.address || unit.address || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{metadata.phoneNumber || unit.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                        {representative
                          ? `${representative.firstName} ${representative.lastName}`.trim() || representative.email
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => navigate(`/dashboard/branch/${unit._id}`)}
                          className="text-[hsl(var(--primary))] hover:underline"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No branches found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleClose}
        title="Add Branch"
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              BU Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter BU Name"
              required
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              BU Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter BU Address"
              rows={3}
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              BU Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="Enter BU Phone Number"
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              BU Representative
            </label>
            <select
              value={formData.representativeId}
              onChange={(e) => setFormData({ ...formData, representativeId: e.target.value })}
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]"
            >
              <option value="">Select Representative</option>
              {employees?.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email}
                  {employee.position ? ` - ${employee.position}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Add Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}




