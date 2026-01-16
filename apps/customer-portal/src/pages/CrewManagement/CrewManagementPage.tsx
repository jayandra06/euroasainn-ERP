import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdPersonAdd, MdSearch, MdSave, MdCancel } from 'react-icons/md';
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

interface BusinessUnit {
  _id: string;
  name: string;
  code?: string;
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
  position?: string;
  department?: string;
  businessUnitId?: string;
  metadata?: {
    employeeType?: string;
    accessLevel?: string;
  };
  createdAt: string;
}

export function CrewManagementPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [creatingForRowId, setCreatingForRowId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
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
    businessUnitId: '',
  });

  // Payroll template state (auto-fetched when role is selected)
  const [payrollTemplate, setPayrollTemplate] = useState<{
    base?: number;
    hraPercent?: number;
    taPercent?: number;
    daPercent?: number;
    pfPercent?: number;
    tdsPercent?: number;
    incentives?: number;
    grossSalary?: number;
    netSalary?: number;
  } | null>(null);

  // Salary override state
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryOverride, setSalaryOverride] = useState<{
    base?: number;
    hraPercent?: number;
    taPercent?: number;
    daPercent?: number;
    pfPercent?: number;
    tdsPercent?: number;
    incentives?: number;
  } | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const response = await authenticatedFetch('/api/v1/customer/employees');
        if (!response.ok) {
          // Don't throw for connection errors
          if (response.status === 0 || response.type === 'error') {
            return [];
          }
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        return data.data || [];
      } catch (error: any) {
        // Return empty array on connection errors instead of throwing
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return [];
        }
        throw error;
      }
    },
    retry: false,
  });

  // Fetch roles from Customer Portal Role Management API
  const { data: roles = [], isLoading: rolesLoading, refetch: refetchRoles } = useQuery<Role[]>({
    queryKey: ['roles', 'customer'],
    queryFn: async () => {
      try {
        // Fetch roles from Customer Portal Role Management API
      const response = await authenticatedFetch('/api/v1/roles?portalType=customer');
      if (!response.ok) {
          // Don't throw for connection errors
          if (response.status === 0 || response.type === 'error') {
            return [];
          }
          return [];
        }
        const data = await response.json();
        // Ensure we return the data in the same format as Tech Portal
        if (data.success && Array.isArray(data.data)) {
          return data.data as Role[];
        }
        // Handle case where data might be directly an array
        if (Array.isArray(data)) {
          return data as Role[];
        }
        // Handle case where data.data exists but is not an array
        if (data.data && Array.isArray(data.data)) {
          return data.data as Role[];
        }
        return [];
      } catch (error: any) {
        // Return empty array on connection errors
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return [];
        }
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data to ensure roles are up-to-date
    enabled: true, // Always enable the query
  });

  // Fetch payroll structure when role is selected (from Payroll Management)
  const { data: fetchedPayrollTemplate, isLoading: payrollLoading } = useQuery({
    queryKey: ['role-payroll-structure', employeeForm.role],
    queryFn: async () => {
      if (!employeeForm.role) return null;
      try {
        // Fetch payroll structure for the selected role from Payroll Management API
        const response = await authenticatedFetch(`/api/v1/customer/role-payroll-structures/${employeeForm.role}`);
        if (!response.ok) {
          // If 404, no payroll structure exists for this role
          if (response.status === 404) {
            return null;
          }
          // Don't throw for connection errors
          if (response.status === 0 || response.type === 'error') {
            return null;
          }
          return null;
        }
        const data = await response.json();
        if (data.success && data.data?.payrollStructure) {
          return data.data.payrollStructure;
        }
        return null;
      } catch (error: any) {
        // Return null on connection errors
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return null;
        }
        return null;
      }
    },
    enabled: !!employeeForm.role && (showAddModal || showEditModal), // Fetch when role is selected and either modal is open
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
  });

  // Update payroll template when fetched data changes
  useEffect(() => {
    if (fetchedPayrollTemplate) {
      setPayrollTemplate(fetchedPayrollTemplate);
    } else {
      setPayrollTemplate(null);
    }
  }, [fetchedPayrollTemplate]);

  // Invalidate and refetch payroll structure when role changes
  useEffect(() => {
    if (employeeForm.role && (showAddModal || showEditModal)) {
      queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', employeeForm.role] });
    }
  }, [employeeForm.role, showAddModal, showEditModal, queryClient]);

  // Fetch business units
  const { data: businessUnits = [] } = useQuery<BusinessUnit[]>({
    queryKey: ['business-units'],
    queryFn: async () => {
      try {
        const response = await authenticatedFetch('/api/v1/customer/business-units');
        if (!response.ok) {
          // Don't throw for connection errors
          if (response.status === 0 || response.type === 'error') {
            return [];
          }
        return [];
      }
      const data = await response.json();
      return data.data || [];
      } catch (error: any) {
        // Return empty array on connection errors
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return [];
        }
        return [];
      }
    },
    retry: false,
  });

  // Invite employee mutation with optimistic updates
  const inviteEmployeeMutation = useMutation({
    mutationFn: async (employeeData: typeof employeeForm) => {
      // Prepare the data
      const payload: any = {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone && employeeData.phoneCountryCode 
          ? `${employeeData.phoneCountryCode}${employeeData.phone}` 
          : employeeData.phone || undefined,
      };

      // Add business unit if selected (not "unassigned")
      if (employeeData.businessUnitId && employeeData.businessUnitId !== 'unassigned') {
        payload.businessUnitId = employeeData.businessUnitId;
      }

      // Add role if selected
      if (employeeData.role) {
        payload.role = employeeData.role;
      }

      // Add salary override if edited
      if (isEditingSalary && salaryOverride) {
        const base = salaryOverride.base || payrollTemplate?.base || 0;
        const hraPercent = salaryOverride.hraPercent ?? payrollTemplate?.hraPercent ?? 0;
        const taPercent = salaryOverride.taPercent ?? payrollTemplate?.taPercent ?? 0;
        const daPercent = salaryOverride.daPercent ?? payrollTemplate?.daPercent ?? 0;
        const pfPercent = salaryOverride.pfPercent ?? payrollTemplate?.pfPercent ?? 0;
        const tdsPercent = salaryOverride.tdsPercent ?? payrollTemplate?.tdsPercent ?? 0;
        const incentives = salaryOverride.incentives ?? payrollTemplate?.incentives ?? 0;

        // Calculate absolute values from percentages
        const hra = (base * hraPercent) / 100;
        const ta = (base * taPercent) / 100;
        const da = (base * daPercent) / 100;
        const pf = (base * pfPercent) / 100;
        const tds = (base * tdsPercent) / 100;

        // Calculate gross and net salary
        const grossSalary = base + hra + ta + da + incentives;
        const netSalary = grossSalary - pf - tds;

        payload.payrollDetails = {
          base,
          hra,
          ta,
          da,
          incentives,
          pf,
          tds,
          grossSalary,
          netSalary,
        };
      }

      const response = await authenticatedFetch('/api/v1/customer/employees/invite', {
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
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['employees'] });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees']);

      // Optimistically update the employees list
      const optimisticEmployee: Employee = {
        _id: `temp-${Date.now()}`, // Temporary ID
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone && employeeData.phoneCountryCode 
          ? `${employeeData.phoneCountryCode}${employeeData.phone}` 
          : employeeData.phone || undefined,
        role: employeeData.role || undefined,
        roleId: employeeData.role || undefined,
        businessUnitId: employeeData.businessUnitId && employeeData.businessUnitId !== 'unassigned' 
          ? employeeData.businessUnitId 
          : undefined,
        createdAt: new Date().toISOString(),
      };

      // Add the optimistic employee to the list
      queryClient.setQueryData<Employee[]>(['employees'], (old = []) => {
        return [...old, optimisticEmployee];
      });

      // Return context with previous employees for rollback
      return { previousEmployees };
    },
    onSuccess: (data, variables, context) => {
      // Immediately refetch to get the real employee data from server
      queryClient.refetchQueries({ queryKey: ['employees'] });
      
      setShowAddModal(false);
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+1',
        country: '',
        role: '',
        businessUnitId: '',
      });
      setPayrollTemplate(null);
      setIsEditingSalary(false);
      setSalaryOverride(null);
      
      const message = data.data?.emailSent
        ? 'Employee invited successfully! Invitation email sent with login credentials.'
        : data.message || 'Employee invited successfully!';
      showToast(message, 'success');
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees'], context.previousEmployees);
      }
      showToast(error.message || 'Failed to invite employee', 'error');
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: typeof employeeForm }) => {
      // Prepare the data
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone && data.phoneCountryCode 
          ? `${data.phoneCountryCode}${data.phone}` 
          : data.phone || undefined,
      };

      // Add business unit if selected (not "unassigned")
      if (data.businessUnitId && data.businessUnitId !== 'unassigned') {
        payload.businessUnitId = data.businessUnitId;
      } else {
        payload.businessUnitId = undefined;
      }

      // Add role if selected
      if (data.role) {
        payload.role = data.role;
      }

      // Add salary override if edited
      if (isEditingSalary && salaryOverride) {
        const base = salaryOverride.base || payrollTemplate?.base || 0;
        const hraPercent = salaryOverride.hraPercent ?? payrollTemplate?.hraPercent ?? 0;
        const taPercent = salaryOverride.taPercent ?? payrollTemplate?.taPercent ?? 0;
        const daPercent = salaryOverride.daPercent ?? payrollTemplate?.daPercent ?? 0;
        const pfPercent = salaryOverride.pfPercent ?? payrollTemplate?.pfPercent ?? 0;
        const tdsPercent = salaryOverride.tdsPercent ?? payrollTemplate?.tdsPercent ?? 0;
        const incentives = salaryOverride.incentives ?? payrollTemplate?.incentives ?? 0;

        // Calculate absolute values from percentages
        const hra = (base * hraPercent) / 100;
        const ta = (base * taPercent) / 100;
        const da = (base * daPercent) / 100;
        const pf = (base * pfPercent) / 100;
        const tds = (base * tdsPercent) / 100;

        // Calculate gross and net salary
        const grossSalary = base + hra + ta + da + incentives;
        const netSalary = grossSalary - pf - tds;

        payload.payrollDetails = {
          base,
          hra,
          ta,
          da,
          incentives,
          pf,
          tds,
          grossSalary,
          netSalary,
        };
      }

      const response = await authenticatedFetch(`/api/v1/customer/employees/${employeeId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
        businessUnitId: '',
      });
      setPayrollTemplate(null);
      setIsEditingSalary(false);
      setSalaryOverride(null);
      showToast('Employee updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update employee', 'error');
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await authenticatedFetch(`/api/v1/customer/employees/${employeeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete employee');
      }
      return response.json();
    },
    onMutate: async (employeeId) => {
      // Cancel ongoing refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['employees'] });

      // Snapshot previous employees
      const previousEmployees = queryClient.getQueryData<Employee[]>(['employees']);

      // Optimistically remove the employee
      queryClient.setQueryData<Employee[]>(['employees'], (old = []) =>
        old.filter((emp) => emp._id !== employeeId)
      );

      return { previousEmployees };
    },
    onSuccess: () => {
      // Refetch to sync with server
      queryClient.refetchQueries({ queryKey: ['employees'] });
      showToast('Employee deleted successfully!', 'success');
    },
    onError: (error: any, _vars, context) => {
      // Rollback optimistic change
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees'], context.previousEmployees);
      }
      showToast(error.message || 'Failed to delete employee', 'error');
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; description?: string }) => {
      const response = await authenticatedFetch('/api/v1/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleData.name,
          description: roleData.description,
          portalType: 'customer',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }
      return response.json();
    },
    onSuccess: async () => {
      await refetchRoles();
      setShowRoleModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
      showToast('Role created successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create role', 'error');
    },
  });

  // Real-time form validation
  const isFormValid = useMemo(() => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Check all required fields
    const firstNameValid = employeeForm.firstName.trim().length > 0;
    const lastNameValid = employeeForm.lastName.trim().length > 0;
    const emailValid = employeeForm.email.trim().length > 0 && emailRegex.test(employeeForm.email.trim());
    const countryValid = employeeForm.country.trim().length > 0;
    const phoneValid = employeeForm.phone.trim().length > 0 && employeeForm.phoneCountryCode.trim().length > 0;
    const roleValid = employeeForm.role.trim().length > 0;
    // Business Unit is optional - can be "Unassigned"
    
    return firstNameValid && lastNameValid && emailValid && countryValid && phoneValid && roleValid;
  }, [employeeForm]);

  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      showToast('Please fill in all required fields (First Name, Last Name, Email, Country, Phone with country code, Role)', 'error');
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
    // Extract country code from phone if it exists
    let phoneNumber = employee.phone || '';
    let countryCode = '+1'; // Default
    let country = ''; // Will be inferred from country code if possible
    
    if (phoneNumber) {
      // Try to extract country code from phone (format: +91XXXXXXXXXX)
      const match = phoneNumber.match(/^(\+\d{1,3})/);
      if (match) {
        countryCode = match[1];
        phoneNumber = phoneNumber.replace(match[1], '').trim();
        // Try to find country from country code
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
      businessUnitId: employee.businessUnitId || 'unassigned',
    });
    
    // Reset salary override state
    setIsEditingSalary(false);
    setSalaryOverride(null);
    
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
      const businessUnit = businessUnits.find((bu) => bu._id === employee.businessUnitId);
      const buName = businessUnit?.name.toLowerCase() || 'unassigned';

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        roleName.includes(query) ||
        buName.includes(query)
      );
    });
  }, [employees, searchQuery, businessUnits, roles]);

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
        // Support both role and roleId fields
        const roleId = employee.role || employee.roleId;
        
        if (!roleId) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
        
        // Find role by matching _id
        const role = roles.find((r) => r._id === roleId || r._id === String(roleId));
        
        if (role) {
          return (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {role.name}
            </span>
          );
        }
        
        // If roles are still loading, show loading state
        if (rolesLoading) {
          return <span className="text-gray-400 dark:text-gray-500 text-sm">Loading...</span>;
        }
        
        // If role not found in roles list, show the role ID as fallback
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {String(roleId).slice(-8)}
          </span>
        );
      },
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      render: (employee: Employee) => {
        if (!employee.businessUnitId) return 'Unassigned';
        const bu = businessUnits.find((b) => b._id === employee.businessUnitId);
        return bu?.name || 'Unassigned';
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
          placeholder="Search employees by name, email, phone, type, access level, or business unit..."
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
                  label="Country *"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
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
                  Role (from Customer Portal Role Management) *
                </label>
              <select
                  value={employeeForm.role}
                  onChange={(e) => {
                    const newRoleId = e.target.value;
                    setEmployeeForm((prev) => ({ ...prev, role: newRoleId }));
                    // Clear payroll template when role changes (will be auto-fetched)
                    setPayrollTemplate(null);
                    // Reset salary override when role changes
                    setIsEditingSalary(false);
                    setSalaryOverride(null);
                    // Invalidate and refetch payroll structure for the new role
                    if (newRoleId) {
                      queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', newRoleId] });
                    }
                  }}
                  disabled={rolesLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {rolesLoading ? 'Loading roles from Customer Portal...' : 'Select Role'}
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
                    No roles found. Create roles in Customer Portal Role Management.
                  </p>
                )}
              </div>

              {/* Auto-fetched Salary Template Display */}
              {employeeForm.role && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Salary Template {isEditingSalary ? '(Editing)' : '(Auto-loaded from Payroll Management)'}
                    </h4>
                    <div className="flex items-center gap-2">
                      {payrollLoading && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                      )}
                      {payrollTemplate && !payrollLoading && (
                        <>
                          {!isEditingSalary ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingSalary(true);
                                setSalaryOverride({
                                  base: payrollTemplate.base,
                                  hraPercent: payrollTemplate.hraPercent,
                                  taPercent: payrollTemplate.taPercent,
                                  daPercent: payrollTemplate.daPercent,
                                  pfPercent: payrollTemplate.pfPercent,
                                  tdsPercent: payrollTemplate.tdsPercent,
                                  incentives: payrollTemplate.incentives,
                                });
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <MdEdit className="w-4 h-4" />
                              Edit Salary
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSalary(false);
                                  setSalaryOverride(null);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              >
                                <MdCancel className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSalary(false);
                                  // Keep the override values for submission
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                <MdSave className="w-4 h-4" />
                                Save
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {payrollTemplate ? (
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const currentBase = salaryOverride?.base ?? payrollTemplate.base ?? 0;
                        const currentHraPercent = salaryOverride?.hraPercent ?? payrollTemplate.hraPercent ?? 0;
                        const currentTaPercent = salaryOverride?.taPercent ?? payrollTemplate.taPercent ?? 0;
                        const currentDaPercent = salaryOverride?.daPercent ?? payrollTemplate.daPercent ?? 0;
                        const currentPfPercent = salaryOverride?.pfPercent ?? payrollTemplate.pfPercent ?? 0;
                        const currentTdsPercent = salaryOverride?.tdsPercent ?? payrollTemplate.tdsPercent ?? 0;
                        const currentIncentives = salaryOverride?.incentives ?? payrollTemplate.incentives ?? 0;

                        // Calculate values
                        const hra = (currentBase * currentHraPercent) / 100;
                        const ta = (currentBase * currentTaPercent) / 100;
                        const da = (currentBase * currentDaPercent) / 100;
                        const pf = (currentBase * currentPfPercent) / 100;
                        const tds = (currentBase * currentTdsPercent) / 100;
                        const grossSalary = currentBase + hra + ta + da + currentIncentives;
                        const netSalary = grossSalary - pf - tds;

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Base Salary:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentBase}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, base: value }));
                                    }}
                                    className="ml-2 w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    ₹{currentBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Incentives:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentIncentives}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, incentives: value }));
                                    }}
                                    className="ml-2 w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    ₹{currentIncentives.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">HRA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentHraPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, hraPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentHraPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">TA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentTaPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, taPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentTaPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">DA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentDaPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, daPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentDaPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">PF:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentPfPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, pfPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentPfPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">TDS:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentTdsPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, tdsPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentTdsPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Gross Salary:</span>
                                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                                  ₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Net Salary:</span>
                                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                                  ₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            {isEditingSalary && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                * Salary override will be saved to this employee. Role default remains unchanged.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : !payrollLoading ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No salary template found for this role. Define one in Payroll Management.
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Unit
                </label>
              <select
                  value={employeeForm.businessUnitId}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, businessUnitId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unassigned">Unassigned</option>
                  {businessUnits.map((bu) => (
                    <option key={bu._id} value={bu._id}>
                      {bu.name}
                </option>
                    ))}
              </select>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setPayrollTemplate(null);
                    setIsEditingSalary(false);
                    setSalaryOverride(null);
                    setEmployeeForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      phoneCountryCode: '+1',
                      country: '',
                      role: '',
                      businessUnitId: '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
          <button
                  type="submit"
                  disabled={!isFormValid || inviteEmployeeMutation.isPending}
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
                  Role (from Customer Portal Role Management)
                </label>
                <select
                  value={employeeForm.role}
                  onChange={(e) => {
                    const newRoleId = e.target.value;
                    setEmployeeForm((prev) => ({ ...prev, role: newRoleId }));
                    // Clear payroll template when role changes (will be auto-fetched)
                    setPayrollTemplate(null);
                    // Reset salary override when role changes
                    setIsEditingSalary(false);
                    setSalaryOverride(null);
                    // Invalidate and refetch payroll structure for the new role
                    if (newRoleId) {
                      queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', newRoleId] });
                    }
                  }}
                  disabled={rolesLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {rolesLoading ? 'Loading roles from Customer Portal...' : 'Select Role'}
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
                    No roles found. Create roles in Customer Portal Role Management.
                  </p>
                )}
              </div>

              {/* Auto-fetched Salary Template Display */}
              {employeeForm.role && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Salary Template {isEditingSalary ? '(Editing)' : '(Auto-loaded from Payroll Management)'}
                    </h4>
                    <div className="flex items-center gap-2">
                      {payrollLoading && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                      )}
                      {payrollTemplate && !payrollLoading && (
                        <>
                          {!isEditingSalary ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingSalary(true);
                                setSalaryOverride({
                                  base: payrollTemplate.base,
                                  hraPercent: payrollTemplate.hraPercent,
                                  taPercent: payrollTemplate.taPercent,
                                  daPercent: payrollTemplate.daPercent,
                                  pfPercent: payrollTemplate.pfPercent,
                                  tdsPercent: payrollTemplate.tdsPercent,
                                  incentives: payrollTemplate.incentives,
                                });
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <MdEdit className="w-4 h-4" />
                              Edit Salary
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSalary(false);
                                  setSalaryOverride(null);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              >
                                <MdCancel className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSalary(false);
                                  // Keep the override values for submission
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                <MdSave className="w-4 h-4" />
                                Save
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {payrollTemplate ? (
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const currentBase = salaryOverride?.base ?? payrollTemplate.base ?? 0;
                        const currentHraPercent = salaryOverride?.hraPercent ?? payrollTemplate.hraPercent ?? 0;
                        const currentTaPercent = salaryOverride?.taPercent ?? payrollTemplate.taPercent ?? 0;
                        const currentDaPercent = salaryOverride?.daPercent ?? payrollTemplate.daPercent ?? 0;
                        const currentPfPercent = salaryOverride?.pfPercent ?? payrollTemplate.pfPercent ?? 0;
                        const currentTdsPercent = salaryOverride?.tdsPercent ?? payrollTemplate.tdsPercent ?? 0;
                        const currentIncentives = salaryOverride?.incentives ?? payrollTemplate.incentives ?? 0;

                        // Calculate values
                        const hra = (currentBase * currentHraPercent) / 100;
                        const ta = (currentBase * currentTaPercent) / 100;
                        const da = (currentBase * currentDaPercent) / 100;
                        const pf = (currentBase * currentPfPercent) / 100;
                        const tds = (currentBase * currentTdsPercent) / 100;
                        const grossSalary = currentBase + hra + ta + da + currentIncentives;
                        const netSalary = grossSalary - pf - tds;

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Base Salary:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentBase}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, base: value }));
                                    }}
                                    className="ml-2 w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    ₹{currentBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Incentives:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentIncentives}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, incentives: value }));
                                    }}
                                    className="ml-2 w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    ₹{currentIncentives.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">HRA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentHraPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, hraPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentHraPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">TA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentTaPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, taPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentTaPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">DA:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentDaPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, daPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentDaPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">PF:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentPfPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, pfPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentPfPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">TDS:</span>
                                {isEditingSalary ? (
                                  <input
                                    type="number"
                                    value={currentTdsPercent}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setSalaryOverride((prev) => ({ ...prev, tdsPercent: value }));
                                    }}
                                    className="ml-2 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {currentTdsPercent.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Gross Salary:</span>
                                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                                  ₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Net Salary:</span>
                                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                                  ₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            {isEditingSalary && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                * Salary override will be saved to this employee. Role default remains unchanged.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : !payrollLoading ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No salary template found for this role. Define one in Payroll Management.
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Unit
                </label>
              <select
                  value={employeeForm.businessUnitId}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, businessUnitId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unassigned">Unassigned</option>
                  {businessUnits.map((bu) => (
                    <option key={bu._id} value={bu._id}>
                      {bu.name}
                </option>
                    ))}
              </select>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setPayrollTemplate(null);
                    setIsEditingSalary(false);
                    setSalaryOverride(null);
                    setEditingEmployee(null);
                    setEmployeeForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      phoneCountryCode: '+1',
                      country: '',
                      role: '',
                      businessUnitId: '',
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

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Enter role description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRoleName('');
                  setNewRoleDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newRoleName.trim()) {
                    createRoleMutation.mutate({
                      name: newRoleName.trim(),
                      description: newRoleDescription.trim() || undefined,
                    });
                  }
                }}
                disabled={!newRoleName.trim() || createRoleMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createRoleMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
