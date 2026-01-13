import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdPersonAdd, MdSearch } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
import { DataTable } from '../../components/shared/DataTable';
import { getCountryOptions, getCountryCodeOptions, getCountryCodeByName } from '../../utils/countries';
import { SearchableSelect } from '../../components/shared/SearchableSelect';

interface Role {
  _id: string;
  name: string;
  description?: string;
  portalType: string;
}

// Get global country options (exclude empty option for searchable select)
const countryOptions = getCountryOptions();

// Get global country code options
const countryCodeOptions = getCountryCodeOptions();

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  roleId?: string; // Support both role and roleId fields
  createdAt: string;
}

export function EmployeeManagementPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for adding employee
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+1',
    country: '',
    role: '',
  });

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useQuery<Employee[]>({
    queryKey: ['employees', 'vendor'],
    queryFn: async () => {
      try {
        const response = await authenticatedFetch('/api/v1/vendor/employees');
        if (!response.ok) {
          if (response.status === 0 || response.type === 'error') {
            return [];
          }
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        return data.data || [];
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return [];
        }
        throw error;
      }
    },
    retry: false,
  });

  // Fetch roles from Vendor Portal Role Management API
  const { data: roles = [], isLoading: rolesLoading, refetch: refetchRoles } = useQuery<Role[]>({
    queryKey: ['roles', 'vendor'],
    queryFn: async () => {
      try {
        const response = await authenticatedFetch('/api/v1/roles?portalType=vendor');
        if (!response.ok) {
          if (response.status === 0 || response.type === 'error') {
            return [];
          }
          return [];
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data as Role[];
        }
        if (Array.isArray(data)) {
          return data as Role[];
        }
        if (data.data && Array.isArray(data.data)) {
          return data.data as Role[];
        }
        return [];
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return [];
        }
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    enabled: true,
  });

  // Invite employee mutation
  const inviteEmployeeMutation = useMutation({
    mutationFn: async (employeeData: typeof employeeForm) => {
      const payload: any = {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone && employeeData.phoneCountryCode 
          ? `${employeeData.phoneCountryCode}${employeeData.phone}` 
          : employeeData.phone || undefined,
      };

      if (employeeData.role) {
        payload.role = employeeData.role;
      }

      const response = await authenticatedFetch('/api/v1/vendor/employees/invite', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite employee');
      }
      return response.json();
    },
    onMutate: async (employeeData) => {
      await queryClient.cancelQueries({ queryKey: ['employees', 'vendor'] });
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees', 'vendor']);
      const optimisticEmployee: Employee = {
        _id: `temp-${Date.now()}`,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone && employeeData.phoneCountryCode 
          ? `${employeeData.phoneCountryCode}${employeeData.phone}` 
          : employeeData.phone || undefined,
        role: employeeData.role || undefined,
        roleId: employeeData.role || undefined,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Employee[]>(['employees', 'vendor'], (old = []) => {
        return [...old, optimisticEmployee];
      });
      return { previousEmployees };
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ['employees', 'vendor'] });
      setShowAddModal(false);
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+1',
        country: '',
        role: '',
      });
      const message = data.data?.emailSent
        ? 'Employee invited successfully! Invitation email sent with login credentials.'
        : data.message || 'Employee invited successfully!';
      showToast(message, 'success');
    },
    onError: (error: any, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees', 'vendor'], context.previousEmployees);
      }
      showToast(error.message || 'Failed to invite employee', 'error');
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: typeof employeeForm }) => {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone && data.phoneCountryCode 
          ? `${data.phoneCountryCode}${data.phone}` 
          : data.phone || undefined,
      };

      if (data.role) {
        payload.role = data.role;
      }

      const response = await authenticatedFetch(`/api/v1/vendor/employees/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update employee');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', 'vendor'] });
      setShowEditModal(false);
      setEditingEmployee(null);
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+1',
        country: '',
        role: '',
      });
      showToast('Employee updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update employee', 'error');
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await authenticatedFetch(`/api/v1/vendor/employees/${employeeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete employee');
      }
      return response.json();
    },
    onMutate: async (employeeId) => {
      await queryClient.cancelQueries({ queryKey: ['employees', 'vendor'] });
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees', 'vendor']);
      queryClient.setQueryData<Employee[]>(['employees', 'vendor'], (old = []) =>
        old.filter((emp) => emp._id !== employeeId)
      );
      return { previousEmployees };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees', 'vendor'] });
      showToast('Employee deleted successfully!', 'success');
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees', 'vendor'], context.previousEmployees);
      }
      showToast(error.message || 'Failed to delete employee', 'error');
    },
  });

  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email) {
      showToast('Please fill in all required fields (Name and Email)', 'error');
      return;
    }
    inviteEmployeeMutation.mutate(employeeForm);
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email) {
      showToast('Please fill in all required fields (Name and Email)', 'error');
      return;
    }
    if (!editingEmployee) return;
    updateEmployeeMutation.mutate({ employeeId: editingEmployee._id, data: employeeForm });
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    let phoneNumber = employee.phone || '';
    let countryCode = '+1';
    let country = '';
    
    if (phoneNumber) {
      const match = phoneNumber.match(/^(\+\d{1,3})/);
      if (match) {
        countryCode = match[1];
        phoneNumber = phoneNumber.replace(match[1], '').trim();
        const countryCodeOption = countryCodeOptions.find(opt => opt.value === countryCode);
        if (countryCodeOption) {
          country = countryCodeOption.country;
        }
      }
    }
    
    setEmployeeForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: phoneNumber,
      phoneCountryCode: countryCode,
      country: country,
      role: employee.role || '',
    });
    
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees;
    }

    const query = searchQuery.toLowerCase().trim();
    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const email = employee.email.toLowerCase();
      const phone = employee.phone?.toLowerCase() || '';
      const role = employee.role || '';
      const roleName = roles.find((r) => r._id === role)?.name.toLowerCase() || '';

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        roleName.includes(query)
      );
    });
  }, [employees, searchQuery, roles]);

  // Table columns
  const columns = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      render: (employee: Employee) => (
        <span className="font-mono text-sm">{employee._id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (employee: Employee) => (
        <span className="font-medium">{`${employee.firstName} ${employee.lastName}`}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (employee: Employee) => employee.phone || '-',
    },
    {
      key: 'role',
      header: 'Role',
      render: (employee: Employee) => {
        const roleId = employee.role || employee.roleId;
        
        if (!roleId) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        
        const role = roles.find((r) => r._id === roleId || r._id === String(roleId));
        
        if (role) {
          return (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {role.name}
            </span>
          );
        }
        
        if (rolesLoading) {
          return <span className="text-gray-400 dark:text-gray-500 text-sm">Loading...</span>;
        }
        
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {String(roleId).slice(-8)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (employee: Employee) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditEmployee(employee)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <MdEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteEmployee(employee._id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Employee Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors shadow-sm"
        >
          <MdPersonAdd className="w-5 h-5" />
          Add / Invite Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees by name, email, phone, or role..."
          className="w-full pl-10 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
        />
      </div>

      {/* Employees Table */}
      {employeesLoading ? (
        <div className="p-16 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">Loading employees...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredEmployees}
          emptyMessage={
            searchQuery
              ? `No employees found matching "${searchQuery}".`
              : "No employees found. Click 'Add / Invite Employee' to add your first employee."
          }
        />
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add / Invite Employee</h3>
            <form onSubmit={handleSubmitEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <SearchableSelect
                  options={countryOptions}
                  value={employeeForm.country}
                  onChange={(selectedCountry) => {
                    const defaultCode = getCountryCodeByName(selectedCountry);
                    setEmployeeForm((prev) => ({ 
                      ...prev, 
                      country: selectedCountry,
                      phoneCountryCode: defaultCode,
                    }));
                  }}
                  placeholder="Search and select country..."
                  label="Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={employeeForm.phoneCountryCode}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phoneCountryCode: e.target.value }))}
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countryCodeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (from Vendor Portal Role Management)
                </label>
                <select
                  value={employeeForm.role}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}
                  disabled={rolesLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {rolesLoading ? 'Loading roles from Vendor Portal...' : 'Select Role'}
                  </option>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))
                  ) : !rolesLoading ? (
                    <option value="" disabled>
                      No roles available
                    </option>
                  ) : null}
                </select>
                {!rolesLoading && roles.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No roles found. Create roles in Vendor Portal Role Management.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEmployeeForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      phoneCountryCode: '+1',
                      country: '',
                      role: '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteEmployeeMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {inviteEmployeeMutation.isPending ? 'Inviting...' : 'Invite Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Edit Employee</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <SearchableSelect
                  options={countryOptions}
                  value={employeeForm.country}
                  onChange={(selectedCountry) => {
                    const defaultCode = getCountryCodeByName(selectedCountry);
                    setEmployeeForm((prev) => ({ 
                      ...prev, 
                      country: selectedCountry,
                      phoneCountryCode: defaultCode,
                    }));
                  }}
                  placeholder="Search and select country..."
                  label="Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={employeeForm.phoneCountryCode}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phoneCountryCode: e.target.value }))}
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countryCodeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (from Vendor Portal Role Management)
                </label>
                <select
                  value={employeeForm.role}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}
                  disabled={rolesLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {rolesLoading ? 'Loading roles from Vendor Portal...' : 'Select Role'}
                  </option>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))
                  ) : !rolesLoading ? (
                    <option value="" disabled>
                      No roles available
                    </option>
                  ) : null}
                </select>
                {!rolesLoading && roles.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No roles found. Create roles in Vendor Portal Role Management.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                    setEmployeeForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      phoneCountryCode: '+1',
                      country: '',
                      role: '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
