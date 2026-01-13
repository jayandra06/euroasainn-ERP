/**
 * Employee Onboarding Review Page
 * Lists all employees with their onboarding status and shows submitted onboarding details
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdCheckCircle, MdCancel, MdVisibility, MdFilterList, MdSearch, MdRefresh, MdDownload, MdDelete } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
import { DataTable } from '../../components/shared/DataTable';
import { cn } from '../../lib/utils';

interface EmployeeOnboarding {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  profilePhoto?: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  addressLine1?: string;
  addressLine2?: string;
  accountNumber: string;
  ifscOrSwift: string;
  bankName: string;
  identityDocumentType?: string;
  passport?: string;
  nationalId?: string;
  drivingLicense?: string;
  pan?: string;
  ssn?: string;
  paymentIdentityType?: string;
  paymentIdentityDocument?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  rejectedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  onboardingStatus: 'submitted' | 'approved' | 'rejected' | null;
  onboarding?: EmployeeOnboarding | null;
  createdAt: string;
}

export function EmployeeOnboardingReviewPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getDocumentUrl = (value?: string): string | null => {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (value.startsWith('/uploads')) {
      return `${apiBase}${value}`;
    }
    if (value.startsWith('/')) {
      return `${apiBase}${value}`;
    }
    const encoded = encodeURIComponent(value);
    return `${apiBase}/uploads/employee-onboarding/${encoded}`;
  };

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees-onboarding-review', 'vendor', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await authenticatedFetch(`/api/v1/vendor/employees/onboarding-review?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees with onboarding status');
      }
      const data = await response.json();
      return data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ onboardingId, remarks }: { onboardingId: string; remarks?: string }) => {
      if (!onboardingId) {
        throw new Error('Onboarding ID is required');
      }
      const response = await authenticatedFetch(`/api/v1/vendor/employees/onboardings/${onboardingId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks: remarks || undefined }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to approve onboarding (${response.status})` }));
        throw new Error(errorData.error || `Failed to approve onboarding: ${response.status}`);
      }
      return await response.json();
    },
    onMutate: async ({ onboardingId }) => {
      await queryClient.cancelQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter]);
      if (onboardingId) {
        queryClient.setQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter], (old = []) =>
          old.map((employee) =>
            employee.onboarding?._id === onboardingId
              ? {
                  ...employee,
                  onboardingStatus: 'approved',
                  onboarding: employee.onboarding
                    ? {
                        ...employee.onboarding,
                        status: 'approved',
                      }
                    : employee.onboarding,
                }
              : employee
          )
        );
      }
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      setShowApproveModal(false);
      setSelectedEmployee(null);
      setApprovalRemarks('');
      showToast('Onboarding approved successfully!', 'success');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees-onboarding-review', 'vendor', statusFilter], context.previousEmployees);
      }
      showToast(error.message || 'Failed to approve onboarding', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ onboardingId, reason }: { onboardingId: string; reason?: string }) => {
      const response = await authenticatedFetch(`/api/v1/vendor/employees/onboardings/${onboardingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject onboarding');
      }
      return response.json();
    },
    onMutate: async ({ onboardingId }) => {
      await queryClient.cancelQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter]);
      if (onboardingId) {
        queryClient.setQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter], (old = []) =>
          old.map((employee) =>
            employee.onboarding?._id === onboardingId
              ? {
                  ...employee,
                  onboardingStatus: 'rejected',
                  onboarding: employee.onboarding
                    ? {
                        ...employee.onboarding,
                        status: 'rejected',
                      }
                    : employee.onboarding,
                }
              : employee
          )
        );
      }
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      setShowRejectModal(false);
      setSelectedEmployee(null);
      setRejectionReason('');
      showToast('Onboarding rejected successfully!', 'success');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees-onboarding-review', 'vendor', statusFilter], context.previousEmployees);
      }
      showToast(error.message || 'Failed to reject onboarding', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ onboardingId }: { onboardingId: string }) => {
      const response = await authenticatedFetch(`/api/v1/vendor/employees/onboardings/${onboardingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete onboarding');
      }
      return response.json();
    },
    onMutate: async ({ onboardingId }) => {
      await queryClient.cancelQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter]);
      if (onboardingId) {
        queryClient.setQueryData<Employee[]>(['employees-onboarding-review', 'vendor', statusFilter], (old = []) =>
          old.filter((employee) => employee.onboarding?._id !== onboardingId)
        );
      }
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] });
      showToast('Onboarding deleted successfully!', 'success');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees-onboarding-review', 'vendor', statusFilter], context.previousEmployees);
      }
      showToast(error.message || 'Failed to delete onboarding', 'error');
    },
  });

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const handleApprove = (employee: Employee) => {
    if (!employee.onboarding?._id) {
      showToast('No onboarding submission found for this employee', 'error');
      return;
    }
    setSelectedEmployee(employee);
    setShowApproveModal(true);
  };

  const handleReject = (employee: Employee) => {
    if (!employee.onboarding?._id) {
      showToast('No onboarding submission found for this employee', 'error');
      return;
    }
    setSelectedEmployee(employee);
    setShowRejectModal(true);
  };

  const handleDelete = (employee: Employee) => {
    if (!employee.onboarding?._id) {
      showToast('No onboarding submission found for this employee', 'error');
      return;
    }
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    if (window.confirm(`Are you sure you want to delete the onboarding for ${employeeName}? This action cannot be undone.`)) {
      deleteMutation.mutate({ onboardingId: employee.onboarding._id });
    }
  };

  const handleViewDocument = (onboarding: EmployeeOnboarding, field: string, label?: string) => {
    const raw = onboarding[field as keyof EmployeeOnboarding] as string | undefined;
    if (!raw) {
      showToast(`${label || 'Document'} is not uploaded.`, 'error');
      return;
    }
    const url = getDocumentUrl(raw);
    if (!url) {
      showToast(`Unable to build public URL for ${label || 'document'}.`, 'error');
      return;
    }
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showToast('Invalid document URL format', 'error');
        return;
      }
      console.log(`Opening document: ${url}`);
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        showToast('Please allow popups to view documents', 'warning');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      showToast('Failed to open document. Please try downloading instead.', 'error');
    }
  };

  const handleDownloadDocument = async (onboarding: EmployeeOnboarding, field: string, label?: string) => {
    try {
      const raw = onboarding[field as keyof EmployeeOnboarding] as string | undefined;
      if (!raw) {
        showToast(`${label || 'Document'} is not uploaded.`, 'error');
        return;
      }
      const resolvedUrl = getDocumentUrl(raw);
      if (!resolvedUrl) {
        showToast(`Unable to build public URL for ${label || 'document'}.`, 'error');
        return;
      }
      const link = document.createElement('a');
      link.href = resolvedUrl;
      const filename = resolvedUrl.split('/').pop() || `${field}.bin`;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading ${label || 'document'}...`, 'info');
    } catch {
      showToast('Failed to download document', 'error');
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          NOT SUBMITTED
        </span>
      );
    }
    const statusConfig = {
      submitted: { label: 'SUBMITTED', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      approved: { label: 'APPROVED', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      rejected: { label: 'REJECTED', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    return (
      <span className={cn('px-3 py-1 text-xs font-semibold rounded-full', config.color)}>
        {config.label}
      </span>
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(query) ||
      employee.lastName.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      (employee.phone && employee.phone.toLowerCase().includes(query))
    );
  });

  const getDocumentFieldName = (documentType: string): string => {
    const mapping: Record<string, string> = {
      aadhaar: 'nationalId',
      pan: 'pan',
      ssn: 'ssn',
      passport: 'passport',
      drivingLicense: 'drivingLicense',
      nationalId: 'nationalId',
    };
    return mapping[documentType] || documentType;
  };

  const getDocumentLabel = (documentType: string): string => {
    const mapping: Record<string, string> = {
      aadhaar: 'Aadhaar',
      pan: 'PAN',
      ssn: 'SSN (Social Security Number)',
      passport: 'Passport',
      drivingLicense: 'Driving License',
      nationalId: 'National ID',
    };
    return mapping[documentType] || documentType;
  };

  const getPaymentIdentityLabel = (paymentType: string): string => {
    const mapping: Record<string, string> = {
      pan: 'PAN (Permanent Account Number)',
      ssn: 'SSN (Social Security Number)',
      taxId: 'Tax ID',
      passport: 'Passport',
    };
    return mapping[paymentType] || paymentType;
  };

  const getDocumentFields = (onboarding: EmployeeOnboarding) => {
    const documents: { label: string; value?: string; field: string; required: boolean; type?: string }[] = [];
    if (onboarding.identityDocumentType) {
      const fieldName = getDocumentFieldName(onboarding.identityDocumentType);
      const label = getDocumentLabel(onboarding.identityDocumentType);
      const value = onboarding[fieldName as keyof EmployeeOnboarding] as string | undefined;
      documents.push({
        label,
        value,
        field: fieldName,
        required: true,
        type: onboarding.identityDocumentType,
      });
    } else {
      if (onboarding.country === 'India') {
        documents.push({ label: 'Aadhaar', value: onboarding.nationalId, field: 'nationalId', required: true });
        documents.push({ label: 'PAN', value: onboarding.pan, field: 'pan', required: true });
        documents.push({ label: 'Driving License', value: onboarding.drivingLicense, field: 'drivingLicense', required: true });
      } else if (onboarding.country === 'United States') {
        documents.push({ label: 'SSN', value: onboarding.ssn, field: 'ssn', required: true });
        documents.push({ label: 'Driving License', value: onboarding.drivingLicense, field: 'drivingLicense', required: true });
        documents.push({ label: 'Passport', value: onboarding.passport, field: 'passport', required: true });
      } else {
        documents.push({ label: 'Passport', value: onboarding.passport, field: 'passport', required: true });
        documents.push({ label: 'National ID', value: onboarding.nationalId, field: 'nationalId', required: true });
        documents.push({ label: 'Driving License', value: onboarding.drivingLicense, field: 'drivingLicense', required: true });
      }
    }
    return documents;
  };

  const columns = [
    {
      key: 'name',
      header: 'Employee Name',
      render: (employee: Employee) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{`${employee.firstName} ${employee.lastName}`}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (employee: Employee) => employee.phone || '-',
    },
    {
      key: 'onboardingStatus',
      header: 'Onboarding Status',
      render: (employee: Employee) => getStatusBadge(employee.onboardingStatus),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (employee: Employee) =>
        employee.onboarding?.submittedAt
          ? new Date(employee.onboarding.submittedAt).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (employee: Employee) => (
        <div className="flex items-center gap-2">
          {employee.onboarding && (
            <button
              onClick={() => handleViewDetails(employee)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="View Onboarding Details"
            >
              <MdVisibility className="w-5 h-5" />
            </button>
          )}
          {employee.onboardingStatus === 'submitted' && employee.onboarding && (
            <>
              <button
                onClick={() => handleApprove(employee)}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Approve"
              >
                <MdCheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleReject(employee)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Reject"
              >
                <MdCancel className="w-5 h-5" />
              </button>
            </>
          )}
          {employee.onboarding && (
            <button
              onClick={() => handleDelete(employee)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Onboarding"
              disabled={deleteMutation.isPending}
            >
              <MdDelete className="w-5 h-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Onboarding Review</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage employee onboarding submissions</p>
        </div>
        <button
          onClick={() => queryClient.refetchQueries({ queryKey: ['employees-onboarding-review', 'vendor', statusFilter] })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <MdRefresh className="w-5 h-5" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <MdFilterList className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {employees.filter((e) => e.onboardingStatus === 'submitted').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {employees.filter((e) => e.onboardingStatus === 'approved').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {employees.filter((e) => e.onboardingStatus === 'rejected').length}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Loading employees...</p>
        </div>
      ) : (
        <DataTable
          data={filteredEmployees}
          columns={columns}
          emptyMessage="No employees found"
        />
      )}

      {/* Details Modal - Simplified version, you can expand this similar to customer portal */}
      {showDetailsModal && selectedEmployee && selectedEmployee.onboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Onboarding Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedEmployee.onboarding.profilePhoto && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Photo</label>
                        <img
                          src={getDocumentUrl(selectedEmployee.onboarding.profilePhoto) || ''}
                          alt={selectedEmployee.onboarding.fullName}
                          className="w-24 h-24 rounded-full object-cover border border-gray-200 dark:border-gray-700 mt-2"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1">{selectedEmployee.onboarding.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1">{selectedEmployee.onboarding.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1">{selectedEmployee.onboarding.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      {selectedEmployee.onboarding.addressLine1} {selectedEmployee.onboarding.addressLine2}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedEmployee.onboarding.city}, {selectedEmployee.onboarding.state} {selectedEmployee.onboarding.zipCode}
                    </p>
                    <p className="text-gray-900 dark:text-white">{selectedEmployee.onboarding.country}</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Banking Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1 font-mono">{selectedEmployee.onboarding.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IFSC / SWIFT</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1 font-mono">{selectedEmployee.onboarding.ifscOrSwift}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
                      <p className="text-gray-900 dark:text-white font-semibold mt-1">{selectedEmployee.onboarding.bankName}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Identity Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getDocumentFields(selectedEmployee.onboarding).map((doc) => (
                      <div key={doc.field} className="p-4 border rounded-lg">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.label}</label>
                        {doc.value ? (
                          <div className="mt-2 space-y-2">
                            <p className="text-xs text-gray-500 break-all">{doc.value}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDocument(selectedEmployee.onboarding!, doc.field, doc.label)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <MdVisibility className="w-4 h-4 inline mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(selectedEmployee.onboarding!, doc.field, doc.label)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              >
                                <MdDownload className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-600 italic mt-1">Not provided</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedEmployee && selectedEmployee.onboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Approve Onboarding</h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedEmployee(null);
                  setApprovalRemarks('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to approve the onboarding for <strong>{selectedEmployee.onboarding.fullName}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks (Optional)</label>
                  <textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any remarks or notes..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedEmployee(null);
                      setApprovalRemarks('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEmployee.onboarding?._id) {
                        approveMutation.mutate({ onboardingId: selectedEmployee.onboarding._id, remarks: approvalRemarks.trim() || undefined });
                      } else {
                        showToast('Invalid onboarding ID', 'error');
                      }
                    }}
                    disabled={approveMutation.isPending || !selectedEmployee.onboarding?._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedEmployee && selectedEmployee.onboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reject Onboarding</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedEmployee(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to reject the onboarding for <strong>{selectedEmployee.onboarding.fullName}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedEmployee(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEmployee.onboarding && rejectionReason.trim()) {
                        rejectMutation.mutate({ onboardingId: selectedEmployee.onboarding._id, reason: rejectionReason });
                      } else {
                        showToast('Please provide a rejection reason', 'error');
                      }
                    }}
                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
