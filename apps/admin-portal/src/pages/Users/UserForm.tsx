/**
 * Ultra-Modern User Form Component for Admin Portal
 * World-Class SaaS ERP Platform Design
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MdEmail,
  MdPerson,
  MdWork,
  MdSecurity,
  MdCheckCircle,
  MdCancel,
  MdSave,
  MdAddCircleOutline,
  MdBusiness,
} from 'react-icons/md';
import { useToast } from '../../components/shared/Toast';
import { Modal } from '../../components/shared/Modal';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role: string;
  roleId?: string | {
    _id: string;
    name: string;
    key: string;
    permissions?: string[];
  };
  isActive: boolean;
  organizationId?: string;
}

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
  defaultInviteMode?: boolean;
}

interface RoleDto {
  _id?: string;
  name: string;
  key: string;
  portalType: string;
  permissions: string[];
  description?: string;
}

interface RoleOption {
  id: string;
  mongoId?: string;
  key: string;
  name: string;
  permissions: string[];
  description?: string;
}

const DEFAULT_ROLES: Record<string, RoleOption[]> = {
  admin: [
    { id: 'admin_superuser', key: 'admin_superuser', name: 'Super Admin', permissions: ['*'], description: 'Full platform access across every admin module' },
    { id: 'admin_system_admin', key: 'admin_system_admin', name: 'System Admin', permissions: ['users:*', 'roles:*', 'settings:update', 'logs:view'], description: 'Manage users, roles, settings, and activity logs' },
    { id: 'admin_finance_admin', key: 'admin_finance_admin', name: 'Finance Admin', permissions: ['invoices:*', 'transactions:read', 'reports:generate'], description: 'Handle billing, transactions, and financial reporting' },
    { id: 'admin_hr_admin', key: 'admin_hr_admin', name: 'HR Admin', permissions: ['employees:*', 'attendance:read', 'leaves:approve'], description: 'Maintain employee records, attendance, and leave approvals' },
    { id: 'admin_auditor', key: 'admin_auditor', name: 'Auditor', permissions: ['logs:read', 'invoices:read', 'users:read'], description: 'Read-only access for compliance and audits' },
    { id: 'admin_support_agent', key: 'admin_support_agent', name: 'Support Agent', permissions: ['tickets:*', 'customers:read'], description: 'Respond to support tickets and review customer info' },
  ],
  customer: [
    { id: 'customer_admin', key: 'customer_admin', name: 'Customer Admin', permissions: ['*'], description: 'Invite team members and view all transactions' },
    { id: 'customer_manager', key: 'customer_manager', name: 'Customer Manager', permissions: ['orders:create', 'orders:update', 'tickets:create'], description: 'Place and update orders, raise support tickets' },
    { id: 'customer_accountant', key: 'customer_accountant', name: 'Customer Accountant', permissions: ['invoices:read', 'transactions:read'], description: 'Track invoices and payment history' },
    { id: 'customer_viewer', key: 'customer_viewer', name: 'Customer Viewer', permissions: ['orders:read', 'invoices:read', 'dashboard:read'], description: 'Read-only access to dashboards and order status' },
  ],
  vendor: [
    { id: 'vendor_admin', key: 'vendor_admin', name: 'Vendor Admin', permissions: ['*'], description: 'Full vendor portal access, including invitations' },
    { id: 'vendor_manager', key: 'vendor_manager', name: 'Vendor Manager', permissions: ['orders:update', 'products:create'], description: 'Manage orders, catalogue items, and listings' },
    { id: 'vendor_accountant', key: 'vendor_accountant', name: 'Vendor Accountant', permissions: ['invoices:read', 'transactions:update'], description: 'Handle invoices and financial reconciliations' },
    { id: 'vendor_staff', key: 'vendor_staff', name: 'Vendor Staff', permissions: ['orders:read', 'products:read'], description: 'Access assigned orders and product information' },
    { id: 'vendor_viewer', key: 'vendor_viewer', name: 'Vendor Viewer', permissions: ['dashboard:read', 'orders:read'], description: 'Read-only dashboard access for leadership or auditors' },
  ],
};

const formatRoleName = (roleKey: string) =>
  roleKey
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const PORTAL_OPTIONS = [
  { value: 'admin', label: 'Admin Portal' },
  { value: 'customer', label: 'Customer Portal' },
  { value: 'vendor', label: 'Vendor Portal' },
];

type PermissionActionKey = 'read' | 'write' | 'edit';

const PERMISSION_ACTIONS: { key: PermissionActionKey; label: string }[] = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'edit', label: 'Edit' },
];

interface PermissionGroup {
  key: string;
  label: string;
  description?: string;
  actions?: PermissionActionKey[];
}

const ADMIN_PERMISSION_GROUPS: PermissionGroup[] = [
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
    description: 'Manage customer and vendor organizations',
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    description: 'Review and approve customer/vendor onboarding submissions',
  },
  {
    key: 'licenses',
    label: 'Licenses',
    description: 'Create and manage organization licenses with pricing',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'Generate and track invoices for organizations',
  },
  {
    key: 'transactions',
    label: 'Transactions',
    description: 'View payment history and financial transactions',
    actions: ['read'],
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Generate analytics and business reports',
    actions: ['read', 'write'],
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Configure platform parameters and integrations',
    actions: ['read', 'edit'],
  },
];

const VENDOR_PERMISSION_GROUPS: PermissionGroup[] = [
  { key: 'catalogue', label: 'Catalogue', description: 'Manage product listings, categories, and pricing' },
  { key: 'orders', label: 'Orders', description: 'Process customer orders and fulfilment tasks' },
  { key: 'brands', label: 'Brands', description: 'Maintain brand assets and marketing content', actions: ['read', 'write'] },
  { key: 'b2b', label: 'B2B Accounts', description: 'Handle corporate accounts and negotiated deals', actions: ['read', 'write', 'edit'] },
  { key: 'inventory', label: 'Inventory', description: 'Track stock levels across warehouses and channels' },
  { key: 'reports', label: 'Reports', description: 'Generate sales and performance reports', actions: ['read', 'write'] },
];

const CUSTOMER_PERMISSION_GROUPS: PermissionGroup[] = [
  { key: 'orders', label: 'Orders', description: 'Create, edit, and track purchase orders' },
  { key: 'tickets', label: 'Support Tickets', description: 'Raise or update support requests', actions: ['read', 'write'] },
  { key: 'invoices', label: 'Invoices', description: 'Review invoices and transaction history', actions: ['read'] },
  { key: 'dashboard', label: 'Dashboard', description: 'Read-only access to analytics and KPIs', actions: ['read'] },
  { key: 'payments', label: 'Payments', description: 'Manage payment methods and view receipts', actions: ['read', 'write'] },
];

const PERMISSION_GROUPS: Record<string, PermissionGroup[]> = {
  admin: ADMIN_PERMISSION_GROUPS,
  customer: CUSTOMER_PERMISSION_GROUPS,
  vendor: VENDOR_PERMISSION_GROUPS,
};

type PermissionSelectionState = Record<
  string,
  {
    enabled: boolean;
    actions: Record<PermissionActionKey, boolean>;
  }
>;

const buildInitialPermissionSelection = (groups: PermissionGroup[]): PermissionSelectionState =>
  groups.reduce((acc, group) => {
    const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
    const actions = actionKeys.reduce(
      (map, actionKey) => ({
        ...map,
        [actionKey]: false,
      }),
      {} as Record<PermissionActionKey, boolean>
    );
    return {
      ...acc,
      [group.key]: {
        enabled: false,
        actions,
      },
    };
  }, {} as PermissionSelectionState);

const selectionToPermissionList = (selection: PermissionSelectionState, groups: PermissionGroup[]): string[] => {
  const groupMap = groups.reduce<Record<string, PermissionGroup>>((map, group) => {
    map[group.key] = group;
    return map;
  }, {});

  const permissions: string[] = [];
  Object.entries(selection).forEach(([groupKey, value]) => {
    if (!value.enabled) return;
    const group = groupMap[groupKey];
    if (!group) return;
    const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
    actionKeys.forEach((actionKey) => {
      if (value.actions[actionKey]) {
        permissions.push(`${groupKey}:${actionKey}`);
      }
    });
  });
  return permissions;
};

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    portalType: user?.portalType || 'admin',
    roleId: typeof user?.roleId === 'string' ? user.roleId : typeof user?.roleId === 'object' ? user.roleId?._id : '',
    roleKey: typeof user?.roleId === 'object' ? user.roleId?.key : user?.role || '',
    isActive: user?.isActive ?? true,
    organizationId: user?.organizationId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [createRoleError, setCreateRoleError] = useState('');
  const [hasInitialisedRole, setHasInitialisedRole] = useState(false);
  const permissionGroups = useMemo(
    () => PERMISSION_GROUPS[formData.portalType] || [],
    [formData.portalType]
  );
  const [permissionSelection, setPermissionSelection] = useState<PermissionSelectionState>(() =>
    buildInitialPermissionSelection(permissionGroups)
  );

  useEffect(() => {
    if (user) {
      const orgId = typeof user.organizationId === 'object'
        ? user.organizationId._id || user.organizationId
        : user.organizationId;
      setFormData({
        email: user.email || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        portalType: user.portalType || 'admin',
        roleId: typeof user.roleId === 'string' ? user.roleId : typeof user.roleId === 'object' ? user.roleId?._id : '',
        roleKey: typeof user.roleId === 'object' ? user.roleId?.key : user.role || '',
        isActive: user.isActive ?? true,
        organizationId: orgId ? orgId.toString() : '',
      });
      setHasInitialisedRole(false);
    }
  }, [user]);

  useEffect(() => {
    if (isCreateRoleOpen) {
      setPermissionSelection(buildInitialPermissionSelection(permissionGroups));
    }
  }, [isCreateRoleOpen, permissionGroups]);

  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
  } = useQuery({
    queryKey: ['roles', formData.portalType],
    queryFn: async (): Promise<RoleDto[]> => {
      try {
        const url = API_URL ? `${API_URL}/api/v1/roles?portalType=${formData.portalType}` : `/api/v1/roles?portalType=${formData.portalType}`;
        const response = await apiFetch(url);
        if (!response.ok) {
          const fallback = DEFAULT_ROLES[formData.portalType] || [];
          return fallback.map((role) => ({
            _id: undefined,
            name: role.name,
            key: role.key,
            permissions: role.permissions,
            portalType: formData.portalType,
          }));
        }
        const data = await response.json();
        return (data.data as RoleDto[]) || [];
      } catch (error) {
        console.error('Failed to fetch roles', error);
        const fallback = DEFAULT_ROLES[formData.portalType] || [];
        return fallback.map((role) => ({
          _id: undefined,
          name: role.name,
          key: role.key,
          permissions: role.permissions,
          portalType: formData.portalType,
        }));
      }
    },
  });

  // Fetch organizations for customer/vendor portal types
  const needsOrganization = formData.portalType === 'customer' || formData.portalType === 'vendor';
  const organizationType = formData.portalType === 'customer' ? 'customer' : formData.portalType === 'vendor' ? 'vendor' : undefined;
  
  const { data: organizationsData, isLoading: isOrganizationsLoading } = useQuery({
    queryKey: ['organizations', organizationType],
    queryFn: async () => {
      if (!organizationType) return [];
      try {
        const url = API_URL ? `${API_URL}/api/v1/admin/organizations?type=${organizationType}&isActive=true` : `/api/v1/admin/organizations?type=${organizationType}&isActive=true`;
        const response = await apiFetch(url);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return (data.data || []) as Array<{ _id: string; name: string; type: string }>;
      } catch (error) {
        console.error('Failed to fetch organizations', error);
        return [];
      }
    },
    enabled: needsOrganization,
  });

  const roleOptions: RoleOption[] = useMemo(() => {
    let options: RoleOption[] =
      !rolesResponse || rolesResponse.length === 0
        ? DEFAULT_ROLES[formData.portalType] || []
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
  }, [rolesResponse, formData.portalType, user]);

  const computedPermissionList = useMemo(
    () => selectionToPermissionList(permissionSelection, permissionGroups),
    [permissionSelection, permissionGroups]
  );

  const selectedModuleCount = useMemo(
    () => Object.values(permissionSelection).filter((value) => value.enabled).length,
    [permissionSelection]
  );

  useEffect(() => {
    if (!roleOptions.length) {
      return;
    }

    if (!hasInitialisedRole) {
      if (user) {
        const existingRole =
          roleOptions.find((role) =>
            typeof user.roleId === 'object'
              ? role.mongoId === user.roleId?._id
              : typeof user.roleId === 'string'
              ? role.mongoId === user.roleId
              : role.key === user.role
          ) || roleOptions.find((role) => role.key === user.role);

        if (existingRole) {
          setFormData((prev) => ({
            ...prev,
            roleId: existingRole.mongoId || '',
            roleKey: existingRole.key,
          }));
        }
      } else if (!formData.roleId && !formData.roleKey) {
        const defaultRole = roleOptions[0];
        setFormData((prev) => ({
          ...prev,
          roleId: defaultRole.mongoId || '',
          roleKey: defaultRole.key,
        }));
      }
      setHasInitialisedRole(true);
    }
  }, [roleOptions, user, hasInitialisedRole, formData.roleId, formData.roleKey]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/users/invite` : `/api/v1/admin/users/invite`;
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.data?.temporaryPassword) {
        toast.showToast(`Invitation sent. Temporary password: ${data.data.temporaryPassword}`, 'success');
      } else {
        toast.showToast('Invitation sent successfully!', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.showToast(`Failed to invite user: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/users/${user!._id}` : `/api/v1/admin/users/${user!._id}`;
      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.showToast('User updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.showToast(`Failed to update user: ${error.message}`, 'error');
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; permissions: string[] }) => {
      const url = API_URL ? `${API_URL}/api/v1/roles` : `/api/v1/roles`;
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          permissions: payload.permissions,
          portalType: formData.portalType,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create role';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
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
      setPermissionSelection(buildInitialPermissionSelection(permissionGroups));
      queryClient.invalidateQueries({ queryKey: ['roles', formData.portalType] });
      const created = data.data as RoleDto;
      setFormData((prev) => ({
        ...prev,
        roleId: created._id || '',
        roleKey: created.key,
      }));
      toast.showToast('Role created successfully!', 'success');
    },
    onError: (error: Error) => {
      setCreateRoleError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email || !formData.email.includes('@')) {
      setErrors({ email: 'Valid email is required' });
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

    // Validate organization for customer/vendor users
    if (needsOrganization && !formData.organizationId) {
      setErrors({ organizationId: `${formData.portalType === 'customer' ? 'Customer' : 'Vendor'} organization is required` });
      return;
    }

    const [firstNameRaw, ...rest] = formData.fullName.trim().split(/\s+/);
    const firstName = firstNameRaw;
    const lastName = rest.length > 0 ? rest.join(' ') : firstNameRaw;

    const payload: any = {
      email: formData.email.trim().toLowerCase(),
      firstName,
      lastName,
      portalType: formData.portalType,
      roleId: formData.roleId || undefined,
      role: formData.roleId ? undefined : formData.roleKey,
      isActive: formData.isActive,
    };

    // Include organizationId for customer/vendor users (required)
    // For tech/admin users, organizationId is optional and not included
    if (needsOrganization && formData.organizationId) {
      payload.organizationId = formData.organizationId;
    }

    if (user) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRoleSelect = (value: string) => {
    if (value === '__create__') {
      setCreateRoleError('');
      setNewRoleName('');
      setPermissionSelection(buildInitialPermissionSelection(permissionGroups));
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

  const handleToggleGroup = (groupKey: string) => {
    setPermissionSelection((prev) => {
      const current = prev[groupKey];
      if (!current) return prev;
      const nextEnabled = !current.enabled;
      const updatedActions = Object.keys(current.actions).reduce(
        (map, actionKey) => ({
          ...map,
          [actionKey]: nextEnabled ? (actionKey === 'read' ? true : current.actions[actionKey as PermissionActionKey]) : false,
        }),
        {} as Record<PermissionActionKey, boolean>
      );
      return {
        ...prev,
        [groupKey]: {
          enabled: nextEnabled,
          actions: updatedActions,
        },
      };
    });
  };

  const handleToggleAction = (groupKey: string, actionKey: PermissionActionKey) => {
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

  const selectedRoleValue = formData.roleId || formData.roleKey;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isCreatingRole = createRoleMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <MdEmail className="w-4 h-4 text-gray-400" />
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setErrors({ ...errors, email: '' });
          }}
          disabled={!!user}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
            errors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
          )}
          placeholder="user@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <MdPerson className="w-4 h-4 text-gray-400" />
          Full Name *
        </label>
        <input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value });
            setErrors({ ...errors, fullName: '' });
          }}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all',
            errors.fullName ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
          )}
          placeholder="Jane Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>
        )}
      </div>

      {/* Portal Type */}
      <div>
        <label htmlFor="portalType" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <MdWork className="w-4 h-4 text-gray-400" />
          Portal Type *
        </label>
        <select
          id="portalType"
          value={formData.portalType}
          onChange={(e) => {
            const newPortal = e.target.value;
            setHasInitialisedRole(false);
            setFormData((prev) => ({
              ...prev,
              portalType: newPortal,
              roleId: '',
              roleKey: '',
            }));
          }}
          disabled={!!user}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
        >
          {PORTAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <MdSecurity className="w-4 h-4 text-gray-400" />
          Role *
        </label>
        <select
          id="role"
          value={selectedRoleValue}
          onChange={(e) => handleRoleSelect(e.target.value)}
          disabled={isRolesLoading}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all',
            errors.role ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
          )}
        >
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
          <option value="__create__">Create a new role…</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role}</p>
        )}
      </div>

      {/* Active Status */}
      {user && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
            <MdCheckCircle className="w-4 h-4 text-emerald-500" />
            User is active
          </label>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isSaving}
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
        >
          <MdSave className="w-4 h-4" />
          {isSaving ? 'Saving...' : user ? 'Update User' : 'Send Invitation'}
        </button>
      </div>

      <Modal
        isOpen={isCreateRoleOpen}
        onClose={() => {
          if (!isCreatingRole) {
            setIsCreateRoleOpen(false);
          }
        }}
        title="Create Role"
        size="large"
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="roleName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              id="roleName"
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g. Finance Manager"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select permissions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable modules and choose the required access level.
                </p>
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {selectedModuleCount} module{selectedModuleCount === 1 ? '' : 's'} selected · {computedPermissionList.length}{' '}
                permission{computedPermissionList.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_120px] bg-gray-50 dark:bg-gray-900/40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <div className="px-5 py-3">Module</div>
                {PERMISSION_ACTIONS.map((action) => (
                  <div key={action.key} className="px-5 py-3 text-center">
                    {action.label}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {permissionGroups.map((group) => {
                  const selection = permissionSelection[group.key];
                  const actionKeys = group.actions ?? PERMISSION_ACTIONS.map((action) => action.key);
                  return (
                    <div
                      key={group.key}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_120px] items-start sm:items-center gap-4 px-4 sm:px-5 py-4 bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <input
                          id={`module-${group.key}`}
                          type="checkbox"
                          className="mt-1 sm:mt-0 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={selection?.enabled ?? false}
                          onChange={() => handleToggleGroup(group.key)}
                        />
                        <div>
                          <label
                            htmlFor={`module-${group.key}`}
                            className="text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            {group.label}
                          </label>
                          {group.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.description}</p>
                          )}
                        </div>
                      </div>
                      {PERMISSION_ACTIONS.map((action) => {
                        if (!actionKeys.includes(action.key)) {
                          return (
                            <div
                              key={`${group.key}-${action.key}`}
                              className="hidden sm:flex items-center justify-center text-xs text-gray-300"
                            >
                              —
                            </div>
                          );
                        }
                        const isEnabled = selection?.enabled ?? false;
                        const isActive = Boolean(selection?.actions?.[action.key]);
                        return (
                          <div
                            key={`${group.key}-${action.key}`}
                            className="flex sm:block items-center justify-between sm:justify-center text-xs font-semibold text-gray-500 sm:text-sm"
                          >
                            <span className="sm:hidden text-gray-500 dark:text-gray-400">{action.label}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAction(group.key, action.key)}
                              disabled={!isEnabled}
                              className={cn(
                                'mt-1 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold border transition-all duration-150',
                                !isEnabled &&
                                  'cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700',
                                isEnabled &&
                                  !isActive &&
                                  'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800',
                                isEnabled && isActive && 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700'
                              )}
                            >
                              {isActive ? 'On' : 'Off'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {createRoleError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {createRoleError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsCreateRoleOpen(false)}
              disabled={isCreatingRole}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateRole}
              disabled={isCreatingRole}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <MdAddCircleOutline className="w-4 h-4" />
              {isCreatingRole ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
