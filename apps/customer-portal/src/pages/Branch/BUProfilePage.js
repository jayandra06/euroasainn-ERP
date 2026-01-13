import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { MdArrowBack, MdAdd, MdDelete, MdBusiness, MdPhone, MdLocationOn, MdPerson, MdDirectionsBoat, MdDescription, MdAttachMoney, MdHistory } from 'react-icons/md';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function BUProfilePage() {
    const { buId } = useParams();
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
    // Fetch BU details - ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
    const { data: businessUnit, isLoading: buLoading, error: buError } = useQuery({
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
            }
            catch (error) {
                console.error('Error fetching business unit:', error);
                throw error;
            }
        },
        enabled: !!buId,
        retry: 1,
    });
    // Fetch vessels assigned to this BU
    const { data: assignedVessels, isLoading: vesselsLoading } = useQuery({
        queryKey: ['bu-vessels', buId],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/vessels`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                throw new Error('Failed to fetch vessels');
            const data = await response.json();
            return data.data || [];
        },
        enabled: !!buId,
    });
    // Fetch all available vessels (for assignment)
    const { data: allVessels } = useQuery({
        queryKey: ['all-vessels'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/customer/vessels`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
    });
    // Fetch staff assigned to this BU
    const { data: assignedStaff, isLoading: staffLoading } = useQuery({
        queryKey: ['bu-staff', buId],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/customer/business-units/${buId}/staff`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                throw new Error('Failed to fetch staff');
            const data = await response.json();
            return data.data || [];
        },
        enabled: !!buId,
    });
    // Fetch all available users (for staff assignment)
    const { data: allUsers } = useQuery({
        queryKey: ['customer-users'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/customer/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
    });
    // Fetch all RFQs for the organization
    const { data: allRFQs, isLoading: rfqsLoading } = useQuery({
        queryKey: ['customer-rfqs'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/customer/rfq`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
    });
    // Fetch representative employee details
    const { data: representative } = useQuery({
        queryKey: ['representative', businessUnit?.metadata?.representativeId || businessUnit?.representativeId],
        queryFn: async () => {
            const repId = businessUnit?.metadata?.representativeId || businessUnit?.representativeId;
            if (!repId)
                return null;
            const response = await fetch(`${API_URL}/api/v1/customer/employees/${repId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.data;
        },
        enabled: !!businessUnit && !!(businessUnit.metadata?.representativeId || businessUnit.representativeId),
    });
    // Fetch payments/transactions
    const { data: payments, isLoading: paymentsLoading } = useQuery({
        queryKey: ['customer-payments'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/payments/user`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
    });
    // Filter RFQs by vessels assigned to this BU
    const buRFQs = useMemo(() => {
        if (!allRFQs || !assignedVessels)
            return [];
        const vesselIds = assignedVessels.map(v => v._id);
        return allRFQs.filter(rfq => rfq.vesselId && vesselIds.includes(rfq.vesselId._id));
    }, [allRFQs, assignedVessels]);
    // Calculate budget summary (placeholder - can be enhanced when budget API is available)
    const budgetSummary = useMemo(() => {
        // Placeholder calculation - can be replaced with actual budget API
        return {
            allocated: 0,
            spent: 0,
            remaining: 0,
        };
    }, []);
    // Assign vessel mutation - ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
    const assignVesselMutation = useMutation({
        mutationFn: async (vesselId) => {
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
        onError: (error) => {
            showToast(error.message, 'error');
        },
    });
    // Unassign vessel mutation
    const unassignVesselMutation = useMutation({
        mutationFn: async (vesselId) => {
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
        onError: (error) => {
            showToast(error.message, 'error');
        },
    });
    // Assign staff mutation
    const assignStaffMutation = useMutation({
        mutationFn: async (userId) => {
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
        onError: (error) => {
            showToast(error.message, 'error');
        },
    });
    // Unassign staff mutation
    const unassignStaffMutation = useMutation({
        mutationFn: async (employeeId) => {
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
        onError: (error) => {
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
    const availableVessels = allVessels?.filter((vessel) => !assignedVessels?.some((av) => av._id === vessel._id)) || [];
    // Get available users (not already assigned as staff)
    const availableUsers = allUsers?.filter((user) => !assignedStaff?.some((as) => as.email === user.email)) || [];
    // Early return if no buId - MUST BE AFTER ALL HOOKS (useQuery, useMutation, useMemo)
    if (!buId) {
        return (<div className="w-full p-8">
        <button onClick={() => navigate('/dashboard/branch')} className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
          <MdArrowBack className="w-5 h-5"/>
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium">Invalid business unit ID</p>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-2">
            Please select a business unit from the branches page.
          </p>
        </div>
      </div>);
    }
    const vesselColumns = [
        {
            key: 'name',
            header: 'Vessel Name',
            render: (vessel) => (<div className="font-semibold text-[hsl(var(--foreground))]">{vessel.name}</div>),
        },
        {
            key: 'type',
            header: 'Type',
            render: (vessel) => (<span className="text-[hsl(var(--muted-foreground))]">{vessel.type}</span>),
        },
        {
            key: 'imoNumber',
            header: 'IMO Number',
            render: (vessel) => (<span className="text-[hsl(var(--muted-foreground))]">{vessel.imoNumber || 'N/A'}</span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (vessel) => (<button onClick={() => unassignVesselMutation.mutate(vessel._id)} disabled={unassignVesselMutation.isPending} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50">
          <MdDelete className="w-5 h-5"/>
        </button>),
        },
    ];
    const staffColumns = [
        {
            key: 'name',
            header: 'Name',
            render: (staff) => (<div className="font-semibold text-[hsl(var(--foreground))]">
          {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A'}
        </div>),
        },
        {
            key: 'email',
            header: 'Email',
            render: (staff) => (<span className="text-[hsl(var(--muted-foreground))]">{staff.email}</span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (staff) => (<button onClick={() => unassignStaffMutation.mutate(staff._id)} disabled={unassignStaffMutation.isPending} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50">
          <MdDelete className="w-5 h-5"/>
        </button>),
        },
    ];
    // Show loading state
    if (buLoading) {
        return (<div className="w-full p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading BU profile...</p>
        </div>
      </div>);
    }
    // Show error state
    if (buError) {
        return (<div className="w-full p-8 min-h-screen">
        <button onClick={() => navigate('/dashboard/branch')} className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
          <MdArrowBack className="w-5 h-5"/>
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading business unit</p>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {buError instanceof Error ? buError.message : 'An unknown error occurred'}
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))]/90">
            Retry
          </button>
        </div>
      </div>);
    }
    // Show not found state
    if (!businessUnit) {
        return (<div className="w-full p-8 min-h-screen">
        <button onClick={() => navigate('/dashboard/branch')} className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
          <MdArrowBack className="w-5 h-5"/>
          Back to Branches
        </button>
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">Business unit not found</p>
        </div>
      </div>);
    }
    const metadata = businessUnit?.metadata || {};
    // RFQ columns
    const rfqColumns = [
        {
            key: 'rfqNumber',
            header: 'RFQ Number',
            render: (rfq) => (<div className="font-semibold text-[hsl(var(--foreground))]">{rfq.rfqNumber}</div>),
        },
        {
            key: 'title',
            header: 'Title',
            render: (rfq) => (<span className="text-[hsl(var(--foreground))]">{rfq.title}</span>),
        },
        {
            key: 'vessel',
            header: 'Vessel',
            render: (rfq) => (<span className="text-[hsl(var(--muted-foreground))]">
          {rfq.vesselId?.name || 'N/A'}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (rfq) => {
                const statusColors = {
                    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    quoted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    ordered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                };
                return (<span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[rfq.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
            {rfq.status.toUpperCase()}
          </span>);
            },
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (rfq) => (<span className="text-[hsl(var(--muted-foreground))] text-sm">
          {new Date(rfq.createdAt).toLocaleDateString()}
        </span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (rfq) => (<button onClick={() => navigate(`/rfqs/${rfq._id}`)} className="text-[hsl(var(--primary))] hover:underline text-sm font-medium">
          View
        </button>),
        },
    ];
    // Payment/Transaction columns
    const transactionColumns = [
        {
            key: 'transactionId',
            header: 'Transaction ID',
            render: (payment) => (<div className="font-mono text-sm text-[hsl(var(--foreground))]">
          {payment.transactionId || payment._id.substring(0, 8)}
        </div>),
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (payment) => (<span className="font-semibold text-[hsl(var(--foreground))]">
          {payment.currency} {payment.amount.toLocaleString()}
        </span>),
        },
        {
            key: 'type',
            header: 'Type',
            render: (payment) => (<span className="text-[hsl(var(--muted-foreground))] capitalize">
          {payment.paymentType.replace('_', ' ')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (payment) => {
                const statusColors = {
                    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                };
                return (<span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[payment.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
            {payment.status.toUpperCase()}
          </span>);
            },
        },
        {
            key: 'date',
            header: 'Date',
            render: (payment) => (<span className="text-[hsl(var(--muted-foreground))] text-sm">
          {new Date(payment.createdAt).toLocaleDateString()}
        </span>),
        },
    ];
    // Ensure we always render something
    return (<div className="w-full p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/branch')} className="mb-4 flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
          <MdArrowBack className="w-5 h-5"/>
          Back to Branches
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">{businessUnit.name}</h1>
        </div>
      </div>

      {/* BU Overall Information Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
          <MdBusiness className="w-6 h-6"/>
          Business Unit Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MdLocationOn className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-1"/>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Address</p>
              <p className="text-[hsl(var(--foreground))]">
                {metadata.address || businessUnit.address || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MdPhone className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-1"/>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Phone Number</p>
              <p className="text-[hsl(var(--foreground))]">
                {metadata.phoneNumber || businessUnit.phoneNumber || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MdPerson className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-1"/>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Representative</p>
              <p className="text-[hsl(var(--foreground))]">
                {representative
            ? `${representative.firstName} ${representative.lastName}`.trim() || representative.email
            : 'Not assigned'}
              </p>
              {representative?.email && (<p className="text-sm text-[hsl(var(--muted-foreground))]">{representative.email}</p>)}
            </div>
          </div>
          {businessUnit.createdAt && (<div className="flex items-start gap-3">
              <MdHistory className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-1"/>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Created</p>
                <p className="text-[hsl(var(--foreground))]">
                  {new Date(businessUnit.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>)}
        </div>
      </div>

      {/* Vessels Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MdDirectionsBoat className="w-6 h-6"/>
            Assigned Vessels
          </h2>
          <button onClick={() => setShowAssignVesselModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-medium transition-colors">
            <MdAdd className="w-5 h-5"/>
            Assign Vessel
          </button>
        </div>
        {vesselsLoading ? (<div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>) : (<DataTable columns={vesselColumns} data={assignedVessels || []} emptyMessage="No vessels assigned to this BU. Click 'Assign Vessel' to add vessels."/>)}
      </div>

      {/* Employees Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MdPerson className="w-6 h-6"/>
            Assigned Employees
          </h2>
          <button onClick={() => setShowAssignStaffModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-medium transition-colors">
            <MdAdd className="w-5 h-5"/>
            Assign Staff
          </button>
        </div>
        {staffLoading ? (<div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>) : (<DataTable columns={staffColumns} data={assignedStaff || []} emptyMessage="No employees assigned to this BU. Click 'Assign Staff' to add employees."/>)}
      </div>

      {/* RFQs Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MdDescription className="w-6 h-6"/>
            RFQs ({buRFQs.length})
          </h2>
        </div>
        {rfqsLoading ? (<div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>) : (<DataTable columns={rfqColumns} data={buRFQs} emptyMessage="No RFQs found for vessels assigned to this BU."/>)}
      </div>

      {/* Budget Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
          <MdAttachMoney className="w-6 h-6"/>
          Budget Allocation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[hsl(var(--background))] rounded-lg p-4 border border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Total Allocated</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ${budgetSummary.allocated.toLocaleString()}
            </p>
          </div>
          <div className="bg-[hsl(var(--background))] rounded-lg p-4 border border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ${budgetSummary.spent.toLocaleString()}
            </p>
          </div>
          <div className="bg-[hsl(var(--background))] rounded-lg p-4 border border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Remaining</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ${budgetSummary.remaining.toLocaleString()}
            </p>
          </div>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4 italic">
          Budget tracking will be available once the budget API is integrated.
        </p>
      </div>

      {/* Transaction History Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MdHistory className="w-6 h-6"/>
            Transaction History
          </h2>
        </div>
        {paymentsLoading ? (<div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          </div>) : (<DataTable columns={transactionColumns} data={payments || []} emptyMessage="No transactions found for this business unit."/>)}
      </div>

      {/* Assign Vessel Modal */}
      <Modal isOpen={showAssignVesselModal} onClose={() => {
            setShowAssignVesselModal(false);
            setSelectedVesselId('');
        }} title="Assign Vessel to BU" size="medium">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Select Vessel <span className="text-red-500">*</span>
            </label>
            <select value={selectedVesselId} onChange={(e) => setSelectedVesselId(e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]">
              <option value="">Select a vessel</option>
              {availableVessels.map((vessel) => (<option key={vessel._id} value={vessel._id}>
                  {vessel.name} {vessel.imoNumber ? `(IMO: ${vessel.imoNumber})` : ''}
                </option>))}
            </select>
            {availableVessels.length === 0 && (<p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No available vessels to assign. All vessels are already assigned.
              </p>)}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => {
            setShowAssignVesselModal(false);
            setSelectedVesselId('');
        }} disabled={assignVesselMutation.isPending} className="px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleAssignVessel} disabled={assignVesselMutation.isPending || !selectedVesselId} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
              {assignVesselMutation.isPending ? 'Assigning...' : 'Assign Vessel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal isOpen={showAssignStaffModal} onClose={() => {
            setShowAssignStaffModal(false);
            setSelectedStaffId('');
        }} title="Assign Staff to BU" size="medium">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Select Staff Member <span className="text-red-500">*</span>
            </label>
            <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all border-[hsl(var(--border))]">
              <option value="">Select a staff member</option>
              {availableUsers.map((user) => (<option key={user._id} value={user._id}>
                  {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email} ({user.email})
                </option>))}
            </select>
            {availableUsers.length === 0 && (<p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No available staff to assign. All users are already assigned.
              </p>)}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => {
            setShowAssignStaffModal(false);
            setSelectedStaffId('');
        }} disabled={assignStaffMutation.isPending} className="px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleAssignStaff} disabled={assignStaffMutation.isPending || !selectedStaffId} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
              {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        </div>
      </Modal>
    </div>);
}
//# sourceMappingURL=BUProfilePage.js.map