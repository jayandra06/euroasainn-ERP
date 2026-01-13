import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
import { DataTable } from '../../components/shared/DataTable';
export function PayrollManagementPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingStructure, setEditingStructure] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    // Form state for payroll structure
    const [payrollForm, setPayrollForm] = useState({
        roleId: '',
        base: '',
        hraPercent: '',
        taPercent: '',
        daPercent: '',
        pfPercent: '',
        tdsPercent: '',
        incentives: '',
    });
    // Calculate payroll totals from base and percentages
    const calculatePayroll = useMemo(() => {
        const parseNumber = (value) => parseFloat(value) || 0;
        const base = parseNumber(payrollForm.base);
        const hraPercent = parseNumber(payrollForm.hraPercent);
        const taPercent = parseNumber(payrollForm.taPercent);
        const daPercent = parseNumber(payrollForm.daPercent);
        const pfPercent = parseNumber(payrollForm.pfPercent);
        const tdsPercent = parseNumber(payrollForm.tdsPercent);
        const incentives = parseNumber(payrollForm.incentives);
        // Calculate amounts from percentages
        const hra = base * (hraPercent / 100);
        const ta = base * (taPercent / 100);
        const da = base * (daPercent / 100);
        const pf = base * (pfPercent / 100);
        const tds = base * (tdsPercent / 100);
        // Calculate Gross Salary (base + calculated allowances + incentives)
        const grossSalary = base + hra + ta + da + incentives;
        // Calculate Net Salary (Gross - deductions)
        const netSalary = grossSalary - (pf + tds);
        return { hra, ta, da, pf, tds, grossSalary, netSalary };
    }, [payrollForm.base, payrollForm.hraPercent, payrollForm.taPercent, payrollForm.daPercent, payrollForm.pfPercent, payrollForm.tdsPercent, payrollForm.incentives]);
    // Fetch roles from Customer Portal Role Management API
    const { data: roles = [], isLoading: rolesLoading } = useQuery({
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
                    return data.data;
                }
                // Handle case where data might be directly an array
                if (Array.isArray(data)) {
                    return data;
                }
                // Handle case where data.data exists but is not an array
                if (data.data && Array.isArray(data.data)) {
                    return data.data;
                }
                return [];
            }
            catch (error) {
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
    // Fetch payroll structures
    const { data: structures = [], isLoading: structuresLoading } = useQuery({
        queryKey: ['role-payroll-structures'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/customer/role-payroll-structures');
            if (!response.ok) {
                throw new Error('Failed to fetch payroll structures');
            }
            const data = await response.json();
            // Filter out structures with null/undefined roleId
            const allStructures = data.data || [];
            return allStructures.filter((s) => s.roleId?._id);
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    });
    // Fetch payroll structure for selected role (auto-fill when role is selected)
    const { data: fetchedPayrollStructure, isLoading: fetchingTemplate } = useQuery({
        queryKey: ['role-payroll-structure', payrollForm.roleId],
        queryFn: async () => {
            if (!payrollForm.roleId)
                return null;
            try {
                // Fetch payroll structure for the selected role from Role-Based Payroll Management API
                const response = await authenticatedFetch(`/api/v1/customer/role-payroll-structures/${payrollForm.roleId}`);
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
                if (data.success && data.data) {
                    return data.data;
                }
                return null;
            }
            catch (error) {
                // Return null on connection errors
                if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    return null;
                }
                return null;
            }
        },
        enabled: !!payrollForm.roleId && showModal && !editingStructure, // Only fetch when role is selected, modal is open, and not editing
        retry: false,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    });
    // Auto-fill form when payroll structure is fetched
    useEffect(() => {
        if (fetchedPayrollStructure && fetchedPayrollStructure.payrollStructure && !editingStructure) {
            const payroll = fetchedPayrollStructure.payrollStructure;
            setPayrollForm((prev) => ({
                ...prev,
                base: payroll.base?.toString() || '',
                hraPercent: payroll.hraPercent?.toString() || '',
                taPercent: payroll.taPercent?.toString() || '',
                daPercent: payroll.daPercent?.toString() || '',
                pfPercent: payroll.pfPercent?.toString() || '',
                tdsPercent: payroll.tdsPercent?.toString() || '',
                incentives: payroll.incentives?.toString() || '',
            }));
        }
        else if (!fetchedPayrollStructure && payrollForm.roleId && !editingStructure && showModal) {
            // Clear form if no template exists for the selected role
            setPayrollForm((prev) => ({
                ...prev,
                base: '',
                hraPercent: '',
                taPercent: '',
                daPercent: '',
                pfPercent: '',
                tdsPercent: '',
                incentives: '',
            }));
        }
    }, [fetchedPayrollStructure, editingStructure, payrollForm.roleId, showModal]);
    // Create or update payroll structure mutation
    const savePayrollStructureMutation = useMutation({
        mutationFn: async (formData) => {
            const parseNumber = (value) => {
                const num = parseFloat(value);
                return isNaN(num) ? undefined : num;
            };
            const payrollStructure = {};
            if (formData.base)
                payrollStructure.base = parseNumber(formData.base);
            if (formData.hraPercent)
                payrollStructure.hraPercent = parseNumber(formData.hraPercent);
            if (formData.taPercent)
                payrollStructure.taPercent = parseNumber(formData.taPercent);
            if (formData.daPercent)
                payrollStructure.daPercent = parseNumber(formData.daPercent);
            if (formData.pfPercent)
                payrollStructure.pfPercent = parseNumber(formData.pfPercent);
            if (formData.tdsPercent)
                payrollStructure.tdsPercent = parseNumber(formData.tdsPercent);
            if (formData.incentives)
                payrollStructure.incentives = parseNumber(formData.incentives);
            const roleId = editingStructure && editingStructure.roleId?._id ? editingStructure.roleId._id : formData.roleId;
            const url = editingStructure
                ? `/api/v1/customer/role-payroll-structures/${roleId}`
                : '/api/v1/customer/role-payroll-structures';
            const response = await authenticatedFetch(url, {
                method: editingStructure ? 'PUT' : 'POST',
                body: JSON.stringify({
                    roleId,
                    payrollStructure,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save payroll structure');
            }
            return response.json();
        },
        onSuccess: (data, variables) => {
            const roleId = editingStructure && editingStructure.roleId?._id ? editingStructure.roleId._id : variables.roleId;
            // Invalidate all related queries to ensure data refreshes automatically
            queryClient.invalidateQueries({ queryKey: ['role-payroll-structures'] });
            if (roleId) {
                queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', roleId] });
            }
            // Also invalidate all role-payroll-structure queries (for any role)
            queryClient.invalidateQueries({ queryKey: ['role-payroll-structure'] });
            setShowModal(false);
            setEditingStructure(null);
            setPayrollForm({
                roleId: '',
                base: '',
                hraPercent: '',
                taPercent: '',
                daPercent: '',
                pfPercent: '',
                tdsPercent: '',
                incentives: '',
            });
            showToast('Payroll structure saved successfully!', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to save payroll structure', 'error');
        },
    });
    // Delete payroll structure mutation
    const deletePayrollStructureMutation = useMutation({
        mutationFn: async (roleId) => {
            const response = await authenticatedFetch(`/api/v1/customer/role-payroll-structures/${roleId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete payroll structure');
            }
            return response.json();
        },
        onSuccess: (data, roleId) => {
            // Invalidate all related queries to ensure data refreshes automatically
            queryClient.invalidateQueries({ queryKey: ['role-payroll-structures'] });
            queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', roleId] });
            // Also invalidate all role-payroll-structure queries (for any role)
            queryClient.invalidateQueries({ queryKey: ['role-payroll-structure'] });
            showToast('Payroll structure deleted successfully!', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete payroll structure', 'error');
        },
    });
    const handleEditStructure = (structure) => {
        setEditingStructure(structure);
        const payroll = structure.payrollStructure || {};
        if (!structure.roleId?._id) {
            toast.error('Invalid structure: role information is missing');
            return;
        }
        setPayrollForm({
            roleId: structure.roleId._id,
            base: payroll.base?.toString() || '',
            hraPercent: payroll.hraPercent?.toString() || '',
            taPercent: payroll.taPercent?.toString() || '',
            daPercent: payroll.daPercent?.toString() || '',
            pfPercent: payroll.pfPercent?.toString() || '',
            tdsPercent: payroll.tdsPercent?.toString() || '',
            incentives: payroll.incentives?.toString() || '',
        });
        setShowModal(true);
    };
    const handleDeleteStructure = (roleId) => {
        if (window.confirm('Are you sure you want to delete this payroll structure?')) {
            deletePayrollStructureMutation.mutate(roleId);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!payrollForm.roleId && !editingStructure) {
            showToast('Please select a role', 'error');
            return;
        }
        if (!payrollForm.base) {
            showToast('Base Salary is required', 'error');
            return;
        }
        if (!payrollForm.hraPercent || !payrollForm.taPercent || !payrollForm.daPercent || !payrollForm.pfPercent || !payrollForm.tdsPercent) {
            showToast('All percentage fields are required', 'error');
            return;
        }
        savePayrollStructureMutation.mutate(payrollForm);
    };
    // Filter structures based on search query
    const filteredStructures = useMemo(() => {
        if (!searchQuery.trim()) {
            return structures;
        }
        const query = searchQuery.toLowerCase().trim();
        return structures.filter((structure) => {
            // Filter out structures with null/undefined roleId
            if (!structure.roleId)
                return false;
            const roleName = structure.roleId?.name?.toLowerCase() || '';
            return roleName.includes(query);
        });
    }, [structures, searchQuery]);
    // Filter roles that don't have a payroll structure yet
    const availableRoles = useMemo(() => {
        const structureRoleIds = new Set(structures.filter((s) => s.roleId?._id).map((s) => s.roleId._id));
        return roles.filter((role) => !structureRoleIds.has(role._id) || (editingStructure && editingStructure.roleId?._id && role._id === editingStructure.roleId._id));
    }, [roles, structures, editingStructure]);
    // Table columns
    const columns = [
        {
            key: 'role',
            header: 'Role',
            render: (structure) => (<span className="font-medium">{structure.roleId?.name || '-'}</span>),
        },
        {
            key: 'base',
            header: 'Base Salary',
            render: (structure) => structure.payrollStructure?.base
                ? `₹${structure.payrollStructure.base.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '-',
        },
        {
            key: 'hra',
            header: 'HRA',
            render: (structure) => {
                const payroll = structure.payrollStructure;
                if (payroll?.hraPercent !== undefined) {
                    return `${payroll.hraPercent}%`;
                }
                return '-';
            },
        },
        {
            key: 'pf',
            header: 'PF',
            render: (structure) => {
                const payroll = structure.payrollStructure;
                if (payroll?.pfPercent !== undefined) {
                    return `${payroll.pfPercent}%`;
                }
                return '-';
            },
        },
        {
            key: 'grossSalary',
            header: 'Gross Salary',
            render: (structure) => structure.payrollStructure?.grossSalary
                ? `₹${structure.payrollStructure.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '-',
        },
        {
            key: 'netSalary',
            header: 'Net Salary',
            render: (structure) => structure.payrollStructure?.netSalary
                ? `₹${structure.payrollStructure.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '-',
        },
        {
            key: 'status',
            header: 'Status',
            render: (structure) => (<span className={`px-2 py-1 rounded-full text-xs font-medium ${structure.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
          {structure.isActive ? 'Active' : 'Inactive'}
        </span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (structure) => (<div className="flex items-center gap-2">
          <button onClick={() => handleEditStructure(structure)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
            <MdEdit className="w-4 h-4"/>
          </button>
          <button onClick={() => {
                    if (structure.roleId?._id) {
                        handleDeleteStructure(structure.roleId._id);
                    }
                    else {
                        toast.error('Cannot delete: role information is missing');
                    }
                }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete" disabled={!structure.roleId?._id}>
            <MdDelete className="w-4 h-4"/>
          </button>
        </div>),
        },
    ];
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Role-Based Payroll Management</h1>
        <button onClick={() => {
            setEditingStructure(null);
            setPayrollForm({
                roleId: '',
                base: '',
                hraPercent: '',
                taPercent: '',
                daPercent: '',
                pfPercent: '',
                tdsPercent: '',
                incentives: '',
            });
            setShowModal(true);
        }} className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors shadow-sm">
          <MdAdd className="w-5 h-5"/>
          Define Salary Structure
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by role name..." className="w-full pl-10 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"/>
      </div>

      {/* Payroll Structures Table */}
      {structuresLoading ? (<div className="p-16 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">Loading payroll structures...</p>
        </div>) : (<DataTable columns={columns} data={filteredStructures} emptyMessage={searchQuery
                ? `No payroll structures found matching "${searchQuery}".`
                : "No payroll structures defined. Click 'Define Salary Structure' to create one."}/>)}

      {/* Add/Edit Payroll Structure Modal */}
      {showModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingStructure ? 'Edit Salary Structure' : 'Define Salary Structure'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (from Customer Portal Role Management) *
                </label>
                <select value={payrollForm.roleId} onChange={(e) => {
                const newRoleId = e.target.value;
                // Clear form when role changes (will be auto-filled if template exists)
                // Only clear if not editing an existing structure
                if (!editingStructure) {
                    setPayrollForm({
                        roleId: newRoleId,
                        base: '',
                        hraPercent: '',
                        taPercent: '',
                        daPercent: '',
                        pfPercent: '',
                        tdsPercent: '',
                        incentives: '',
                    });
                    // Invalidate and refetch payroll structure for the new role
                    if (newRoleId) {
                        queryClient.invalidateQueries({ queryKey: ['role-payroll-structure', newRoleId] });
                    }
                }
                else {
                    // If editing, just update the roleId
                    setPayrollForm((prev) => ({ ...prev, roleId: newRoleId }));
                }
            }} required={!editingStructure} disabled={!!editingStructure || rolesLoading} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">
                    {rolesLoading ? 'Loading roles from Customer Portal...' : 'Select Role'}
                  </option>
                  {availableRoles.map((role) => (<option key={role._id} value={role._id}>
                      {role.name}
                    </option>))}
                </select>
                {!editingStructure && fetchingTemplate && payrollForm.roleId && (<p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Loading salary template for this role...
                  </p>)}
                {!editingStructure && !fetchingTemplate && payrollForm.roleId && fetchedPayrollStructure && (<p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Salary template loaded. You can edit the values below.
                  </p>)}
                {!editingStructure && !fetchingTemplate && payrollForm.roleId && !fetchedPayrollStructure && (<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No existing template found for this role. Fill in the details below.
                  </p>)}
              </div>

              {/* Payroll Details Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Default Payroll Template</h4>
                
                <div className="space-y-4">
                  {/* Base Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Salary *
                    </label>
                    <input type="number" step="0.01" min="0" value={payrollForm.base} onChange={(e) => setPayrollForm((prev) => ({ ...prev, base: e.target.value }))} placeholder="Enter base salary" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>

                  {/* Percentage-based Allowances */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Allowances (Percentage of Base Salary)</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">HRA % *</label>
                        <input type="number" step="0.01" min="0" max="100" value={payrollForm.hraPercent} onChange={(e) => setPayrollForm((prev) => ({ ...prev, hraPercent: e.target.value }))} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        {payrollForm.base && payrollForm.hraPercent && (<p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{calculatePayroll.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>)}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">TA % *</label>
                        <input type="number" step="0.01" min="0" max="100" value={payrollForm.taPercent} onChange={(e) => setPayrollForm((prev) => ({ ...prev, taPercent: e.target.value }))} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        {payrollForm.base && payrollForm.taPercent && (<p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{calculatePayroll.ta.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>)}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">DA % *</label>
                        <input type="number" step="0.01" min="0" max="100" value={payrollForm.daPercent} onChange={(e) => setPayrollForm((prev) => ({ ...prev, daPercent: e.target.value }))} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        {payrollForm.base && payrollForm.daPercent && (<p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{calculatePayroll.da.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>)}
                      </div>
                    </div>
                  </div>

                  {/* Percentage-based Deductions */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Deductions (Percentage of Base Salary)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">PF % *</label>
                        <input type="number" step="0.01" min="0" max="100" value={payrollForm.pfPercent} onChange={(e) => setPayrollForm((prev) => ({ ...prev, pfPercent: e.target.value }))} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        {payrollForm.base && payrollForm.pfPercent && (<p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{calculatePayroll.pf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>)}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">TDS % *</label>
                        <input type="number" step="0.01" min="0" max="100" value={payrollForm.tdsPercent} onChange={(e) => setPayrollForm((prev) => ({ ...prev, tdsPercent: e.target.value }))} placeholder="0.00" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                        {payrollForm.base && payrollForm.tdsPercent && (<p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{calculatePayroll.tds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>)}
                      </div>
                    </div>
                  </div>

                  {/* Absolute Value - Incentives */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Incentives (Absolute Value)
                    </label>
                    <input type="number" step="0.01" min="0" value={payrollForm.incentives} onChange={(e) => setPayrollForm((prev) => ({ ...prev, incentives: e.target.value }))} placeholder="Enter incentives amount" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>

                {/* Calculated Totals */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Calculated Totals</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gross Salary</label>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{calculatePayroll.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Net Salary</label>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹{calculatePayroll.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => {
                setShowModal(false);
                setEditingStructure(null);
                setPayrollForm({
                    roleId: '',
                    base: '',
                    hraPercent: '',
                    taPercent: '',
                    daPercent: '',
                    pfPercent: '',
                    tdsPercent: '',
                    incentives: '',
                });
            }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savePayrollStructureMutation.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savePayrollStructureMutation.isPending ? 'Saving...' : editingStructure ? 'Update Structure' : 'Save Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=PayrollManagementPage.js.map