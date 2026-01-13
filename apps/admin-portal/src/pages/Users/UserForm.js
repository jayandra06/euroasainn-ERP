/**
 * User Form Component
 * Professional Admin Portal Design
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MdSave, MdCancel, MdAddCircleOutline } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/shared/Modal';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_ADMIN_ROLES = [
    {
        id: 'admin_superuser',
        key: 'admin_superuser',
        name: 'Super Admin',
        permissions: ['*'],
        description: 'Full platform access across all modules',
    },
    {
        id: 'admin_system_admin',
        key: 'admin_system_admin',
        name: 'System Admin',
        permissions: ['users:manage', 'licenses:manage', 'settings:update', 'logs:view'],
        description: 'Manage users, licenses, audit logs, and system settings',
    },
    {
        id: 'admin_finance_admin',
        key: 'admin_finance_admin',
        name: 'Finance Admin',
        permissions: ['invoices:*', 'transactions:read', 'reports:generate'],
        description: 'Handle invoices, transactions, and financial reporting',
    },
    {
        id: 'admin_hr_admin',
        key: 'admin_hr_admin',
        name: 'HR Admin',
        permissions: ['employees:*', 'attendance:read', 'leaves:approve'],
        description: 'Manage employee records, attendance, and leave approvals',
    },
    {
        id: 'admin_auditor',
        key: 'admin_auditor',
        name: 'Auditor',
        permissions: ['logs:read', 'invoices:read', 'users:read'],
        description: 'Read-only access to financials and system logs',
    },
    {
        id: 'admin_support_agent',
        key: 'admin_support_agent',
        name: 'Support Agent',
        permissions: ['tickets:*', 'customers:read'],
        description: 'Respond to support requests and view customer records',
    },
];
const formatRoleName = (roleKey) => roleKey
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
const PERMISSION_ACTIONS = [
    { key: 'read', label: 'Read' },
    { key: 'write', label: 'Write' },
    { key: 'edit', label: 'Edit' },
];
const ADMIN_PERMISSION_GROUPS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Analytics overview, KPIs, and system status',
        actions: ['read', 'edit'],
    },
    {
        key: 'users',
        label: 'Users',
        description: 'Administration of user accounts across portals',
    },
    {
        key: 'organizations',
        label: 'Organizations',
        description: 'Create and manage customer or vendor organizations',
        actions: ['read', 'write', 'edit'],
    },
    {
        key: 'licenses',
        label: 'Licenses',
        description: 'Issue, revoke, and adjust license usage',
        actions: ['read', 'write'],
    },
    {
        key: 'support',
        label: 'Support Tickets',
        description: 'Monitor and resolve customer support cases',
        actions: ['read', 'write'],
    },
    {
        key: 'reports',
        label: 'Reports',
        description: 'Generate and export operational or financial reports',
        actions: ['read', 'write'],
    },
    {
        key: 'settings',
        label: 'System Settings',
        description: 'Configure platform parameters and integrations',
        actions: ['read', 'edit'],
    },
];
const buildInitialPermissionSelection = (groups) => groups.reduce((acc, group) => {
    const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
    const actions = actionKeys.reduce((map, actionKey) => ({
        ...map,
        [actionKey]: false,
    }), {});
    return {
        ...acc,
        [group.key]: {
            enabled: false,
            actions,
        },
    };
}, {});
const selectionToPermissionList = (selection, groups) => {
    const groupMap = groups.reduce((map, group) => {
        map[group.key] = group;
        return map;
    }, {});
    const permissions = [];
    Object.entries(selection).forEach(([groupKey, value]) => {
        if (!value.enabled)
            return;
        const group = groupMap[groupKey];
        if (!group)
            return;
        const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
        actionKeys.forEach((actionKey) => {
            if (value.actions[actionKey]) {
                permissions.push(`${groupKey}:${actionKey}`);
            }
        });
    });
    return permissions;
};
export function UserForm({ user, onSuccess, onCancel }) {
    const queryClient = useQueryClient();
    const normalizeFullName = (first, last) => {
        const safeFirst = first?.trim() || '';
        const safeLast = last?.trim() || '';
        if (!safeLast || safeFirst.toLowerCase() === safeLast.toLowerCase()) {
            return safeFirst;
        }
        return `${safeFirst} ${safeLast}`.trim();
    };
    const [formData, setFormData] = useState({
        email: user?.email || '',
        fullName: user ? normalizeFullName(user.firstName, user.lastName) : '',
        roleId: typeof user?.roleId === 'string'
            ? user?.roleId
            : typeof user?.roleId === 'object'
                ? user?.roleId?._id
                : '',
        roleKey: typeof user?.roleId === 'object' ? user?.roleId?.key : user?.role || '',
        isActive: user?.isActive ?? true,
    });
    const [errors, setErrors] = useState({});
    const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [createRoleError, setCreateRoleError] = useState('');
    const [hasInitialisedRole, setHasInitialisedRole] = useState(false);
    const [permissionSelection, setPermissionSelection] = useState(() => buildInitialPermissionSelection(ADMIN_PERMISSION_GROUPS));
    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                fullName: normalizeFullName(user.firstName, user.lastName),
                roleId: typeof user.roleId === 'string' ? user.roleId : typeof user.roleId === 'object' ? user.roleId?._id : '',
                roleKey: typeof user.roleId === 'object' ? user.roleId?.key : user.role || '',
                isActive: user.isActive ?? true,
            });
            setHasInitialisedRole(false);
            setPermissionSelection(buildInitialPermissionSelection(ADMIN_PERMISSION_GROUPS));
        }
    }, [user]);
    const { data: rolesResponse, isLoading: isRolesLoading, } = useQuery({
        queryKey: ['roles', 'admin'],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/roles?portalType=admin`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
                if (!response.ok) {
                    return DEFAULT_ADMIN_ROLES.map((role) => ({
                        _id: undefined,
                        name: role.name,
                        key: role.key,
                        permissions: role.permissions,
                        portalType: 'admin',
                    }));
                }
                const data = await response.json();
                return data.data || [];
            }
            catch (error) {
                console.error('Failed to fetch roles', error);
                return DEFAULT_ADMIN_ROLES.map((role) => ({
                    _id: undefined,
                    name: role.name,
                    key: role.key,
                    permissions: role.permissions,
                    portalType: 'admin',
                }));
            }
        },
    });
    const roleOptions = useMemo(() => {
        let options = !rolesResponse || rolesResponse.length === 0
            ? DEFAULT_ADMIN_ROLES
            : rolesResponse.map((role) => ({
                id: role._id || role.key,
                mongoId: role._id,
                key: role.key,
                name: role.name,
                permissions: role.permissions || [],
                description: role.description,
            }));
        const currentRoleKey = user?.role;
        if (currentRoleKey && !options.some((option) => option.key === currentRoleKey)) {
            options = [
                ...options,
                {
                    id: currentRoleKey,
                    key: currentRoleKey,
                    name: formatRoleName(currentRoleKey),
                    permissions: [],
                },
            ];
        }
        return options;
    }, [rolesResponse, user]);
    const computedPermissionList = useMemo(() => selectionToPermissionList(permissionSelection, ADMIN_PERMISSION_GROUPS), [permissionSelection]);
    const selectedModuleCount = useMemo(() => Object.values(permissionSelection).filter((value) => value.enabled).length, [permissionSelection]);
    useEffect(() => {
        if (!roleOptions.length) {
            return;
        }
        // Initialize role selection only once per user/form load
        if (!hasInitialisedRole) {
            if (user) {
                const existingRole = roleOptions.find((role) => typeof user.roleId === 'object'
                    ? role.mongoId === user.roleId?._id
                    : typeof user.roleId === 'string'
                        ? role.mongoId === user.roleId
                        : role.key === user.role) || roleOptions.find((role) => role.key === user.role);
                if (existingRole) {
                    setFormData((prev) => ({
                        ...prev,
                        roleId: existingRole.mongoId || '',
                        roleKey: existingRole.key,
                    }));
                    setHasInitialisedRole(true);
                }
            }
            else if (!formData.roleId && !formData.roleKey) {
                const defaultRole = roleOptions[0];
                setFormData((prev) => ({
                    ...prev,
                    roleId: defaultRole.mongoId || '',
                    roleKey: defaultRole.key,
                }));
                setHasInitialisedRole(true);
            }
        }
    }, [roleOptions, user, hasInitialisedRole, formData.roleId, formData.roleKey]);
    const createMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await fetch(`${API_URL}/api/v1/admin/users/invite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    let errorMessage = 'Failed to create user';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    }
                    catch (e) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                return response.json();
            }
            catch (error) {
                // Handle network errors
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    throw new Error('Network error: Unable to connect to server. Please check your connection.');
                }
                throw error;
            }
        },
        onSuccess,
        onError: (error) => {
            setErrors({ submit: error.message });
        },
    });
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await fetch(`${API_URL}/api/v1/admin/users/${user?._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    let errorMessage = 'Failed to update user';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    }
                    catch (e) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                return response.json();
            }
            catch (error) {
                // Handle network errors
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    throw new Error('Network error: Unable to connect to server. Please check your connection.');
                }
                throw error;
            }
        },
        onSuccess,
        onError: (error) => {
            setErrors({ submit: error.message });
        },
    });
    const createRoleMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await fetch(`${API_URL}/api/v1/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    name: payload.name,
                    permissions: payload.permissions,
                    portalType: 'admin',
                }),
            });
            if (!response.ok) {
                let errorMessage = 'Failed to create role';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                }
                catch {
                    /* ignore */
                }
                throw new Error(errorMessage);
            }
            return response.json();
        },
        onSuccess: (data) => {
            setCreateRoleError('');
            setIsCreateRoleOpen(false);
            setNewRoleName('');
            setPermissionSelection(buildInitialPermissionSelection(ADMIN_PERMISSION_GROUPS));
            queryClient.invalidateQueries({ queryKey: ['roles', 'admin'] });
            const created = data.data;
            setFormData((prev) => ({
                ...prev,
                roleId: created._id || '',
                roleKey: created.key,
            }));
        },
        onError: (error) => {
            setCreateRoleError(error.message);
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        // Validation
        if (!formData.email.trim()) {
            setErrors({ email: 'Email is required' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }
        if (!formData.fullName.trim()) {
            setErrors({ fullName: 'Full name is required' });
            return;
        }
        if (!formData.roleId && !formData.roleKey) {
            setErrors({ role: 'Role is required' });
            return;
        }
        const [firstNameRaw, ...rest] = formData.fullName.trim().split(/\s+/);
        const firstName = firstNameRaw;
        const lastName = rest.length > 0 ? rest.join(' ') : firstNameRaw;
        const payload = {
            email: formData.email.trim().toLowerCase(),
            firstName,
            lastName,
            portalType: 'admin',
            roleId: formData.roleId || undefined,
            role: formData.roleId ? undefined : formData.roleKey,
            isActive: formData.isActive,
        };
        if (user) {
            updateMutation.mutate(payload);
        }
        else {
            createMutation.mutate(payload);
        }
    };
    const isLoading = createMutation.isPending || updateMutation.isPending;
    const isCreatingRole = createRoleMutation.isPending;
    const handleRoleSelect = (value) => {
        if (value === '__create__') {
            setCreateRoleError('');
            setNewRoleName('');
            setPermissionSelection(buildInitialPermissionSelection(ADMIN_PERMISSION_GROUPS));
            setIsCreateRoleOpen(true);
            return;
        }
        const selected = roleOptions.find((role) => role.id === value);
        if (selected) {
            setFormData((prev) => ({
                ...prev,
                roleId: selected.mongoId || '',
                roleKey: selected.key,
            }));
        }
    };
    const selectedRoleValue = formData.roleId || formData.roleKey;
    const handleCreateRole = () => {
        const trimmedName = newRoleName.trim();
        if (!trimmedName) {
            setCreateRoleError('Role name is required');
            return;
        }
        const permissions = computedPermissionList;
        if (permissions.length === 0) {
            setCreateRoleError('Please select at least one permission');
            return;
        }
        createRoleMutation.mutate({
            name: trimmedName,
            permissions,
        });
    };
    const handleToggleGroup = (groupKey) => {
        setPermissionSelection((prev) => {
            const current = prev[groupKey];
            if (!current)
                return prev;
            const nextEnabled = !current.enabled;
            const updatedActions = Object.keys(current.actions).reduce((map, actionKey) => ({
                ...map,
                [actionKey]: nextEnabled ? (actionKey === 'read' ? true : current.actions[actionKey]) : false,
            }), {});
            return {
                ...prev,
                [groupKey]: {
                    enabled: nextEnabled,
                    actions: updatedActions,
                },
            };
        });
    };
    const handleToggleAction = (groupKey, actionKey) => {
        setPermissionSelection((prev) => {
            const current = prev[groupKey];
            if (!current || !current.enabled) {
                return prev;
            }
            return {
                ...prev,
                [groupKey]: {
                    ...current,
                    actions: {
                        ...current.actions,
                        [actionKey]: !current.actions[actionKey],
                    },
                },
            };
        });
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!user} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.email ? 'border-red-500' : 'border-[hsl(var(--border))]', user && 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed')} placeholder="user@example.com"/>
        {user && (<p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Email cannot be changed after user creation
          </p>)}
        {errors.email && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.email}</p>}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input id="fullName" type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.fullName ? 'border-red-500' : 'border-[hsl(var(--border))]')} placeholder="John Doe"/>
        {errors.fullName && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.fullName}</p>}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select id="role" value={selectedRoleValue} onChange={(e) => handleRoleSelect(e.target.value)} disabled={isRolesLoading} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.role ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
          {roleOptions.map((role) => (<option key={role.id} value={role.id}>
              {role.name}
            </option>))}
          <option value="__create__">Create a new role…</option>
        </select>
        {errors.role && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.role}</p>}
      </div>

      {/* Active Status */}
      {user && (<div className="flex items-center gap-3">
          <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 text-[hsl(var(--primary))] border-[hsl(var(--border))] rounded focus:ring-[hsl(var(--primary))]"/>
          <label htmlFor="isActive" className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Active User
          </label>
        </div>)}

      {errors.submit && (<div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
          {errors.submit}
        </div>)}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50">
          <MdCancel className="w-4 h-4"/>
          <span>Cancel</span>
        </button>
        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl">
          <MdSave className="w-4 h-4"/>
          <span>{isLoading ? 'Saving...' : user ? 'Update' : 'Invite User'}</span>
        </button>
      </div>

      <Modal isOpen={isCreateRoleOpen} onClose={() => {
            if (!isCreatingRole) {
                setIsCreateRoleOpen(false);
            }
        }} title="Create Role" size="large">
        <div className="space-y-6">
          <div>
            <label htmlFor="roleName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input id="roleName" type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all" placeholder="e.g. Compliance Manager"/>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Select permissions</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Enable modules and choose read, write, or edit access.
                </p>
              </div>
              <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                {selectedModuleCount} module{selectedModuleCount === 1 ? '' : 's'} selected · {computedPermissionList.length}{' '}
                permission{computedPermissionList.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_120px] bg-gray-50 dark:bg-gray-900/40 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                <div className="px-5 py-3">Module</div>
                {PERMISSION_ACTIONS.map((action) => (<div key={action.key} className="px-5 py-3 text-center">
                    {action.label}
                  </div>))}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {ADMIN_PERMISSION_GROUPS.map((group) => {
            const selection = permissionSelection[group.key];
            const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
            return (<div key={group.key} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_120px] items-start sm:items-center gap-4 px-4 sm:px-5 py-4 bg-[hsl(var(--card))]">
                      <div className="flex items-start sm:items-center gap-3">
                        <input id={`module-${group.key}`} type="checkbox" className="mt-1 sm:mt-0 w-4 h-4 text-[hsl(var(--primary))] border-[hsl(var(--border))] rounded focus:ring-[hsl(var(--primary))]" checked={selection?.enabled ?? false} onChange={() => handleToggleGroup(group.key)}/>
                        <div>
                          <label htmlFor={`module-${group.key}`} className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {group.label}
                          </label>
                          {group.description && (<p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{group.description}</p>)}
                        </div>
                      </div>
                      {PERMISSION_ACTIONS.map((action) => {
                    if (!actionKeys.includes(action.key)) {
                        return (<div key={`${group.key}-${action.key}`} className="hidden sm:flex items-center justify-center text-xs text-gray-300">
                              —
                            </div>);
                    }
                    const isEnabled = selection?.enabled ?? false;
                    const isActive = Boolean(selection?.actions?.[action.key]);
                    return (<div key={`${group.key}-${action.key}`} className="flex sm:block items-center justify-between sm:justify-center text-xs font-semibold text-gray-500 sm:text-sm">
                            <span className="sm:hidden text-[hsl(var(--muted-foreground))]">{action.label}</span>
                            <button type="button" onClick={() => handleToggleAction(group.key, action.key)} disabled={!isEnabled} className={cn('mt-1 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold border transition-all duration-150', !isEnabled &&
                            'cursor-not-allowed bg-[hsl(var(--secondary))] text-gray-400 border-[hsl(var(--border))]', isEnabled &&
                            !isActive &&
                            'bg-[hsl(var(--card))] text-gray-600 dark:text-gray-300 border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]', isEnabled && isActive && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-blue-600 shadow-sm hover:bg-blue-700')}>
                              {isActive ? 'On' : 'Off'}
                            </button>
                          </div>);
                })}
                    </div>);
        })}
              </div>
            </div>
          </div>

          {createRoleError && (<div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
              {createRoleError}
            </div>)}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => {
            if (!isCreatingRole) {
                setIsCreateRoleOpen(false);
            }
        }} className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors" disabled={isCreatingRole}>
              <MdCancel className="w-4 h-4"/>
              <span>Cancel</span>
            </button>
            <button type="button" onClick={handleCreateRole} disabled={isCreatingRole} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl">
              <MdAddCircleOutline className="w-4 h-4"/>
              <span>{isCreatingRole ? 'Creating...' : 'Create Role'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </form>);
}
//# sourceMappingURL=UserForm.js.map