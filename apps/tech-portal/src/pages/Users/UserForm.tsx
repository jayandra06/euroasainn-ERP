/**
 * Ultra-Modern User Form Component
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  tech: [
    { id: 'tech_lead', key: 'tech_lead', name: 'Tech Lead', permissions: ['*'], description: 'Full control of deployments, environments, and access policies' },
    { id: 'tech_developer', key: 'tech_developer', name: 'Developer', permissions: ['logs:read', 'issues:update', 'deployments:read'], description: 'Work on issues, view logs, and monitor deployments' },
    { id: 'tech_devops_engineer', key: 'tech_devops_engineer', name: 'DevOps Engineer', permissions: ['pipeline:*', 'health:read', 'servers:update'], description: 'Manage CI/CD pipelines, server health, and runtime configuration' },
    { id: 'tech_qa_engineer', key: 'tech_qa_engineer', name: 'QA Engineer', permissions: ['testcases:read', 'bugs:update', 'deployments:read'], description: 'Oversee test cases, track bugs, and validate releases' },
    { id: 'tech_intern', key: 'tech_intern', name: 'Tech Intern', permissions: ['issues:read', 'deployments:read'], description: 'View-only access to issues and deployment status for training' },
  ],
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
  { value: 'tech', label: 'Tech Portal' },
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

const TECH_PERMISSION_GROUPS: PermissionGroup[] = [
  { key: 'deployments', label: 'Deployments', description: 'Trigger releases and monitor rollout status' },
  { key: 'issues', label: 'Issues & Boards', description: 'Manage sprint boards and backlog items' },
  { key: 'logs', label: 'System Logs', description: 'Inspect infrastructure and application logs', actions: ['read'] },
  { key: 'pipeline', label: 'CI/CD Pipeline', description: 'Configure build pipelines and approvals', actions: ['read', 'write'] },
  { key: 'servers', label: 'Servers & Environments', description: 'Patch servers and adjust environment variables' },
  { key: 'health', label: 'Monitoring & Health', description: 'Access observability dashboards and alerts', actions: ['read'] },
  { key: 'testcases', label: 'Test Suites', description: 'Review automated tests and QA runs', actions: ['read', 'write'] },
];

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
  tech: TECH_PERMISSION_GROUPS,
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
    portalType: user?.portalType || 'tech',
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
      setFormData({
        email: user.email || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        portalType: user.portalType || 'tech',
        roleId: typeof user.roleId === 'string' ? user.roleId : typeof user.roleId === 'object' ? user.roleId?._id : '',
        roleKey: typeof user.roleId === 'object' ? user.roleId?.key : user.role || '',
        isActive: user.isActive ?? true,
        organizationId: user.organizationId || '',
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
        const response = await fetch(`${API_URL}/api/v1/roles?portalType=${formData.portalType}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
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
        const response = await fetch(`${API_URL}/api/v1/tech/organizations?type=${organizationType}&isActive=true`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
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
      const response = await fetch(`${API_URL}/api/v1/tech/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
        toast.success(`Invitation sent. Temporary password: ${data.data.temporaryPassword}`);
      } else {
        toast.success('Invitation sent successfully!');
      }
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/v1/tech/users/${user!._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('User updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; permissions: string[] }) => {
      const response = await fetch(`${API_URL}/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
      toast.success('Role created successfully!');
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
        <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
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
            'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
            errors.email ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
          )}
          placeholder="user@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.email}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
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
            'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
            errors.fullName ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
          )}
          placeholder="Jane Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.fullName}</p>
        )}
      </div>

      {/* Portal Type */}
      <div>
        <label htmlFor="portalType" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
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
              organizationId: '', // Reset organization when portal type changes
            }));
            setErrors({ ...errors, organizationId: '' }); // Clear organization error
          }}
          disabled={!!user}
          className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
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
        <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          <MdSecurity className="w-4 h-4 text-gray-400" />
          Role *
        </label>
        <select
          id="role"
          value={selectedRoleValue}
          onChange={(e) => handleRoleSelect(e.target.value)}
          disabled={isRolesLoading}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
            errors.role ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
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
          <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.role}</p>
        )}
      </div>

      {/* Organization - Only for Customer/Vendor users */}
      {needsOrganization && (
        <div>
          <label htmlFor="organizationId" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdBusiness className="w-4 h-4 text-gray-400" />
            {formData.portalType === 'customer' ? 'Customer' : 'Vendor'} Organization *
          </label>
          <select
            id="organizationId"
            value={formData.organizationId}
            onChange={(e) => {
              setFormData({ ...formData, organizationId: e.target.value });
              setErrors({ ...errors, organizationId: '' });
            }}
            disabled={isOrganizationsLoading || !!user}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
              errors.organizationId ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]',
              (isOrganizationsLoading || !!user) && 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed'
            )}
          >
            <option value="">Select {formData.portalType === 'customer' ? 'customer' : 'vendor'} organization...</option>
            {organizationsData?.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>
          {errors.organizationId && (
            <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.organizationId}</p>
          )}
          {isOrganizationsLoading && (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Loading organizations...</p>
          )}
          {!isOrganizationsLoading && organizationsData && organizationsData.length === 0 && (
            <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">
              No {formData.portalType === 'customer' ? 'customer' : 'vendor'} organizations found. Please create one first.
            </p>
          )}
        </div>
      )}

      {/* Active Status */}
      {user && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
          <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer">
            <MdCheckCircle className="w-4 h-4 text-emerald-500" />
            User is active
          </label>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] font-semibold hover:bg-[hsl(var(--muted))] transition-colors"
          disabled={isSaving}
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
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
            <label htmlFor="roleName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              id="roleName"
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
              placeholder="e.g. Deployment Manager"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Select permissions</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Enable modules and choose the required access level.
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
                      className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_120px] items-start sm:items-center gap-4 px-4 sm:px-5 py-4 bg-[hsl(var(--card))]"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <input
                          id={`module-${group.key}`}
                          type="checkbox"
                          className="mt-1 sm:mt-0 w-4 h-4 text-[hsl(var(--primary))] border-[hsl(var(--border))] rounded focus:ring-[hsl(var(--primary))]"
                          checked={selection?.enabled ?? false}
                          onChange={() => handleToggleGroup(group.key)}
                        />
                        <div>
                          <label
                            htmlFor={`module-${group.key}`}
                            className="text-sm font-semibold text-[hsl(var(--foreground))]"
                          >
                            {group.label}
                          </label>
                          {group.description && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{group.description}</p>
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
                            <span className="sm:hidden text-[hsl(var(--muted-foreground))]">{action.label}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAction(group.key, action.key)}
                              disabled={!isEnabled}
                              className={cn(
                                'mt-1 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold border transition-all duration-150',
                                !isEnabled &&
                                  'cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 border-[hsl(var(--border))]',
                                isEnabled &&
                                  !isActive &&
                                  'bg-[hsl(var(--card))] text-gray-600 dark:text-gray-300 border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]',
                                isEnabled && isActive && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-blue-600 shadow-sm hover:bg-blue-700'
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => {
                if (!isCreatingRole) {
                  setIsCreateRoleOpen(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              disabled={isCreatingRole}
            >
              <MdCancel className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleCreateRole}
              disabled={isCreatingRole}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              <MdAddCircleOutline className="w-4 h-4" />
              <span>{isCreatingRole ? 'Creating...' : 'Create Role'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
