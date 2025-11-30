import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { MdArrowBack, MdAdd, MdDelete } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Vessel {
  _id: string;
  name: string;
  type: string;
  imoNumber?: string;
  exVesselName?: string;
  flag?: string;
  businessUnitId?: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessUnitId?: string;
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

export function BUProfilePage() {
  const { buId } = useParams<{ buId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAssignVesselModal, setShowAssignVesselModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('BUProfilePage rendered with buId:', buId);
    console.log('API_URL:', API_URL);
    if (!buId) {
      console.error('No buId found in URL params');
    }
  }, [buId]);

  // Temporary test render to ensure component is working
  // Remove this after confirming the page loads
  if (process.env.NODE_ENV === 'development') {
    console.log('BUProfilePage component is rendering');
  }

  // Early return if no buId
  if (!buId) {
    return (
      <div className="w-full p-8">
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium">Invalid business unit ID</p>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-2">
            Please select a business unit from the branches page.
          </p>
        </div>
      </div>
    );
  }

  // Fetch BU details
  const { data: businessUnit, isLoading: buLoading, error: buError } = useQuery<BusinessUnit>({
    queryKey: ['business-unit', buId],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch business unit: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
      } catch (error: any) {
        console.error('Error fetching business unit:', error);
        throw error;
      }
    },
    enabled: !!buId,
    retry: 1,
  });

  // Fetch vessels assigned to this BU
  const { data: assignedVessels, isLoading: vesselsLoading } = useQuery<Vessel[]>({
    queryKey: ['bu-vessels', buId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/vessels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch vessels');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!buId,
  });

  // Fetch all available vessels (for assignment)
  const { data: allVessels } = useQuery<Vessel[]>({
    queryKey: ['all-vessels'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/vessels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch staff assigned to this BU
  const { data: assignedStaff, isLoading: staffLoading } = useQuery<Employee[]>({
    queryKey: ['bu-staff', buId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!buId,
  });

  // Fetch all available users (for staff assignment)
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['customer-users'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
  });

  // Assign vessel mutation
  const assignVesselMutation = useMutation({
    mutationFn: async (vesselId: string) => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/vessels/${vesselId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign vessel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bu-vessels', buId] });
      showToast('Vessel assigned successfully!', 'success');
      setShowAssignVesselModal(false);
      setSelectedVesselId('');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  // Unassign vessel mutation
  const unassignVesselMutation = useMutation({
    mutationFn: async (vesselId: string) => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/vessels/${vesselId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unassign vessel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bu-vessels', buId] });
      showToast('Vessel unassigned successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  // Assign staff mutation
  const assignStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign staff');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bu-staff', buId] });
      showToast('Staff assigned successfully!', 'success');
      setShowAssignStaffModal(false);
      setSelectedStaffId('');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  // Unassign staff mutation
  const unassignStaffMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/staff/${employeeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unassign staff');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bu-staff', buId] });
      showToast('Staff unassigned successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  const handleAssignVessel = () => {
    if (!selectedVesselId) {
      showToast('Please select a vessel', 'error');
      return;
    }
    assignVesselMutation.mutate(selectedVesselId);
  };

  const handleAssignStaff = () => {
    if (!selectedStaffId) {
      showToast('Please select a staff member', 'error');
      return;
    }
    assignStaffMutation.mutate(selectedStaffId);
  };

  // Get available vessels (not already assigned)
  const availableVessels = allVessels?.filter(
    (vessel) => !assignedVessels?.some((av) => av._id === vessel._id)
  ) || [];

  // Get available users (not already assigned as staff)
  const availableUsers = allUsers?.filter(
    (user) => !assignedStaff?.some((as) => as.email === user.email)
  ) || [];

  const vesselColumns = [
    {
      key: 'name',
      header: 'Vessel Name',
      render: (vessel: Vessel) => (
        <div className="font-semibold text-[hsl(var(--foreground))]">{vessel.name}</div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (vessel: Vessel) => (
        <span className="text-[hsl(var(--muted-foreground))]">{vessel.type}</span>
      ),
    },
    {
      key: 'imoNumber',
      header: 'IMO Number',
      render: (vessel: Vessel) => (
        <span className="text-[hsl(var(--muted-foreground))]">{vessel.imoNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vessel: Vessel) => (
        <button
          onClick={() => unassignVesselMutation.mutate(vessel._id)}
          disabled={unassignVesselMutation.isPending}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
        >
          <MdDelete className="w-5 h-5" />
        </button>
      ),
    },
  ];

  const staffColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (staff: Employee) => (
        <div className="font-semibold text-[hsl(var(--foreground))]">
          {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A'}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (staff: Employee) => (
        <span className="text-[hsl(var(--muted-foreground))]">{staff.email}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (staff: Employee) => (
        <button
          onClick={() => unassignStaffMutation.mutate(staff._id)}
          disabled={unassignStaffMutation.isPending}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
        >
          <MdDelete className="w-5 h-5" />
        </button>
      ),
    },
  ];

  if (buLoading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading BU profile...</p>
        </div>
      </div>
    );
  }

  if (buError) {
    return (
      <div className="w-full p-8">
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading business unit</p>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {buError instanceof Error ? buError.message : 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!businessUnit) {
    return (
      <div className="w-full p-8">
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">Business unit not found</p>
        </div>
      </div>
    );
  }

  const metadata = businessUnit.metadata || {};

  // Ensure we always render something
  return (
    <div className="w-full p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Branches
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">{businessUnit.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {metadata.address || businessUnit.address || 'No address'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {metadata.phoneNumber || businessUnit.phoneNumber || 'No phone number'}
          </p>
        </div>
      </div>

      {/* Vessels Section */}
      <div className="mb-8 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Assigned Vessels</h2>
          <button
            onClick={() => setShowAssignVesselModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Assign Vessel
          </button>
        </div>
        {vesselsLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>
        ) : (
          <DataTable
            columns={vesselColumns}
            data={assignedVessels || []}
            emptyMessage="No vessels assigned to this BU. Click 'Assign Vessel' to add vessels."
          />
        )}
      </div>

      {/* Staff Section */}
      <div className="mb-8 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Assigned Staff</h2>
          <button
            onClick={() => setShowAssignStaffModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Assign Staff
          </button>
        </div>
        {staffLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>
        ) : (
          <DataTable
            columns={staffColumns}
            data={assignedStaff || []}
            emptyMessage="No staff assigned to this BU. Click 'Assign Staff' to add staff members."
          />
        )}
      </div>

      {/* Assign Vessel Modal */}
      <Modal
        isOpen={showAssignVesselModal}
        onClose={() => {
          setShowAssignVesselModal(false);
          setSelectedVesselId('');
        }}
        title="Assign Vessel to BU"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Select Vessel <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]"
            >
              <option value="">Select a vessel</option>
              {availableVessels.map((vessel) => (
                <option key={vessel._id} value={vessel._id}>
                  {vessel.name} {vessel.imoNumber ? `(IMO: ${vessel.imoNumber})` : ''}
                </option>
              ))}
            </select>
            {availableVessels.length === 0 && (
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No available vessels to assign. All vessels are already assigned.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => {
                setShowAssignVesselModal(false);
                setSelectedVesselId('');
              }}
              disabled={assignVesselMutation.isPending}
              className="px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignVessel}
              disabled={assignVesselMutation.isPending || !selectedVesselId}
              className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {assignVesselMutation.isPending ? 'Assigning...' : 'Assign Vessel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignStaffModal}
        onClose={() => {
          setShowAssignStaffModal(false);
          setSelectedStaffId('');
        }}
        title="Assign Staff to BU"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Select Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]"
            >
              <option value="">Select a staff member</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email} ({user.email})
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No available staff to assign. All users are already assigned.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => {
                setShowAssignStaffModal(false);
                setSelectedStaffId('');
              }}
              disabled={assignStaffMutation.isPending}
              className="px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignStaff}
              disabled={assignStaffMutation.isPending || !selectedStaffId}
              className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

