/**
 * Ultra-Modern User Form Component - Admin Portal Only
 * - Only admin portal allowed
 * - Create Role feature completely removed
 * - Uses existing roles only
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MdEmail,
  MdPerson,
  MdPhone,
  MdBadge,
  MdWork,
  MdLocationOn,
  MdSupervisorAccount,
  MdSecurity,
  MdBusiness,
  MdCheckCircle,
  MdSave,
} from 'react-icons/md';
import { useToast } from '../../components/shared/Toast';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  reportingManager?: string;
  location?: string;
  portalType: string;
  role?: string;
  roleId?: string | { _id: string; name: string; key: string; permissions?: string[] };
  isActive?: boolean;
}

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
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

const DEFAULT_ADMIN_ROLES: RoleOption[] = [
  { id: 'admin_superuser', key: 'admin_superuser', name: 'Super Admin', permissions: ['*'], description: 'Full platform access across every admin module' },
  { id: 'admin_system_admin', key: 'admin_system_admin', name: 'System Admin', permissions: ['users:*', 'roles:*', 'settings:update', 'logs:view'], description: 'Manage users, roles, settings, and activity logs' },
  { id: 'admin_finance_admin', key: 'admin_finance_admin', name: 'Finance Admin', permissions: ['invoices:*', 'transactions:read', 'reports:generate'], description: 'Handle billing, transactions, and financial reporting' },
  { id: 'admin_hr_admin', key: 'admin_hr_admin', name: 'HR Admin', permissions: ['employees:*', 'attendance:read', 'leaves:approve'], description: 'Maintain employee records, attendance, and leave approvals' },
  { id: 'admin_auditor', key: 'admin_auditor', name: 'Auditor', permissions: ['logs:read', 'invoices:read', 'users:read'], description: 'Read-only access for compliance and audits' },
  { id: 'admin_support_agent', key: 'admin_support_agent', name: 'Support Agent', permissions: ['tickets:*', 'customers:read'], description: 'Respond to support tickets and review customer info' },
];

const formatRoleName = (roleKey: string) =>
  roleKey
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
    phone: user?.phone || '',
    employeeId: user?.employeeId || '',
    department: user?.department || '',
    designation: user?.designation || '',
    reportingManager: user?.reportingManager || '',
    location: user?.location || '',
    portalType: 'admin', // Fixed - only admin
    roleId: typeof user?.roleId === 'string' ? user.roleId : user?.roleId?._id || '',
    roleKey: (typeof user?.roleId === 'object' ? user.roleId?.key : user?.role) || '',
    isActive: user?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: user.phone || '',
        employeeId: user.employeeId || '',
        department: user.department || '',
        designation: user.designation || '',
        reportingManager: user.reportingManager || '',
        location: user.location || '',
        portalType: 'admin',
        roleId: typeof user.roleId === 'string' ? user.roleId : user.roleId?._id || '',
        roleKey: (typeof user.roleId === 'object' ? user.roleId?.key : user?.role) || '',
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
  } = useQuery({
    queryKey: ['roles', 'admin'],
    queryFn: async (): Promise<RoleDto[]> => {
      try {
        const response = await fetch(`${API_URL}/api/v1/roles?portalType=admin`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        return data.data || [];
      } catch {
        return DEFAULT_ADMIN_ROLES.map((r) => ({
          name: r.name,
          key: r.key,
          permissions: r.permissions,
          portalType: 'admin',
        }));
      }
    },
  });

  const roleOptions: RoleOption[] = useMemo(() => {
    let options = rolesResponse?.length
      ? rolesResponse.map((r) => ({
          id: r._id || r.key,
          mongoId: r._id,
          key: r.key,
          name: r.name,
          permissions: r.permissions || [],
          description: r.description,
        }))
      : DEFAULT_ADMIN_ROLES;

    const currentRoleKey = user?.role;
    if (currentRoleKey && !options.some((o) => o.key === currentRoleKey)) {
      options.push({
        id: currentRoleKey,
        key: currentRoleKey,
        name: formatRoleName(currentRoleKey),
        permissions: [],
      });
    }

    return options;
  }, [rolesResponse, user]);

  const createMutation = useMutation({
    mutationFn: async (data: any) =>
      fetch(`${API_URL}/api/v1/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to invite user');
        return res.json();
      }),
    onSuccess: (data) => {
      toast.success(data.data?.temporaryPassword ? `Invitation sent. Temp password: ${data.data.temporaryPassword}` : 'Invitation sent!');
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) =>
      fetch(`${API_URL}/api/v1/admin/users/${user!._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
      }),
    onSuccess: () => {
      toast.success('User updated successfully!');
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email.includes('@')) return setErrors((p) => ({ ...p, email: 'Valid email required' }));
    if (!formData.fullName.trim()) return setErrors((p) => ({ ...p, fullName: 'Full name required' }));
    if (!formData.roleId && !formData.roleKey) return setErrors((p) => ({ ...p, role: 'Role required' }));

    const parts = formData.fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || parts[0];

    const payload: any = {
      email: formData.email.trim().toLowerCase(),
      firstName,
      lastName,
      phone: formData.phone.trim() || undefined,
      employeeId: formData.employeeId.trim() || undefined,
      department: formData.department.trim() || undefined,
      designation: formData.designation.trim() || undefined,
      reportingTo: formData.reportingManager.trim() || undefined,
      location: formData.location.trim() || undefined,
      portalType: 'admin',
      roleId: formData.roleId || undefined,
      role: formData.roleKey,
      isActive: formData.isActive,
    };

    user?._id ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const handleRoleSelect = (value: string) => {
    const selected = roleOptions.find((r) => r.id === value);
    if (selected) {
      setFormData((p) => ({ ...p, roleId: selected.mongoId || '', roleKey: selected.key }));
    }
  };

  const selectedRoleValue = formData.roleId || formData.roleKey;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Personal Information */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-[hsl(var(--foreground))]">
          <MdPerson className="w-8 h-8 text-[hsl(var(--primary))]" />
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdEmail className="w-4 h-4 text-gray-500" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              disabled={!!user}
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all',
                errors.email ? 'border-red-400' : 'border-[hsl(var(--border))]',
                user && 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed'
              )}
              placeholder="admin@company.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdPerson className="w-4 h-4 text-gray-500" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]',
                errors.fullName && 'border-red-400'
              )}
              placeholder="Admin Name"
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdPhone className="w-4 h-4 text-gray-500" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdBadge className="w-4 h-4 text-gray-500" />
              Employee ID
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData((p) => ({ ...p, employeeId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="ADM-001"
            />
          </div>
        </div>
      </section>

      {/* Employment Details */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-[hsl(var(--foreground))]">
          <MdWork className="w-8 h-8 text-[hsl(var(--primary))]" />
          Employment Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Administration"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData((p) => ({ ...p, designation: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="System Administrator"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdSupervisorAccount className="w-4 h-4 text-gray-500" />
              Reporting Manager
            </label>
            <input
              type="text"
              value={formData.reportingManager}
              onChange={(e) => setFormData((p) => ({ ...p, reportingManager: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Enter manager's email (recommended) or full name"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 ml-1">
              Tip: Use email for best accuracy
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdLocationOn className="w-4 h-4 text-gray-500" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Head Office"
            />
          </div>
        </div>
      </section>

      {/* Access Configuration - Fixed to Admin */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-[hsl(var(--foreground))]">
          <MdSecurity className="w-8 h-8 text-[hsl(var(--primary))]" />
          Access Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal Type - Fixed display, not selectable */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdWork className="w-4 h-4 text-gray-500" />
              Portal Type
            </label>
            <div className="w-full px-4 py-3 rounded-xl border bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))] cursor-not-allowed">
              Admin Portal
            </div>
          </div>

          {/* Role Selection - Only existing roles */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <MdSecurity className="w-4 h-4 text-gray-500" />
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoleValue}
              onChange={(e) => handleRoleSelect(e.target.value)}
              disabled={isRolesLoading}
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] focus:ring-2 focus:ring-[hsl(var(--primary))]',
                errors.role && 'border-red-400'
              )}
            >
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>
        </div>
      </section>

      {/* Active Status (Edit only) */}
      {user && (
        <div className="flex items-center gap-4 p-6 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
            className="w-5 h-5 text-[hsl(var(--primary))] rounded focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
          <label htmlFor="isActive" className="text-lg font-semibold cursor-pointer flex items-center gap-3">
            <MdCheckCircle className="w-6 h-6 text-emerald-500" />
            User Account is Active
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-8 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-8 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold hover:bg-[hsl(var(--muted))] transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-3 shadow-lg"
        >
          <MdSave className="w-5 h-5" />
          {isSaving ? 'Saving...' : user ? 'Update User' : 'Send Invitation'}
        </button>
      </div>
    </form>
  );
}