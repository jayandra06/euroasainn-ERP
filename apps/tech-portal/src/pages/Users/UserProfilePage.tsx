// src/pages/Users/UserProfilePage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import { Modal } from '../../components/shared/Modal';
import { UserForm } from './UserForm';
import { 
  MdArrowBack, 
  MdEdit, 
  MdDelete,
  MdPhone,
  MdLocationOn,
  MdSupervisorAccount,
  MdBadge,
  MdPerson,
  MdAccessTime,
  MdPublic,
  MdBusinessCenter,
  MdSecurity,
  MdVerifiedUser,
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  portalType: string;
  role: string;
  roleName?: string;
  roleId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  ipLastLogin?: string;
}

interface UserProfileData {
  employeeId?: string;
  phone?: string;
  department?: string;
  designation?: string;
  location?: string;
  reportingTo?: { fullName: string } | null;
  createdBy?: { fullName: string } | null;
}

interface Role {
  _id: string;
  name: string;
  key: string;
  permissions: string[];
  description?: string;
}

interface UserResponse {
  user: User;
  profile: UserProfileData | null;
}

const fetchUserProfile = async (userId: string): Promise<UserResponse> => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/api/v1/tech/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch');
  return json.data;
};

const fetchRoleDetails = async (roleId: string | undefined, roleKey: string, portalType: string): Promise<Role | null> => {
  if (!roleId && !roleKey) {
    return null;
  }
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  try {
    // Use the same endpoint pattern as AssignRolesPage
    const response = await fetch(`${API_URL}/api/v1/assign-role/roles?portalType=${portalType}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const json = await response.json();
    const roles = json.data || [];
    
    // Try to find by roleId first, then by role key
    if (roleId) {
      const found = roles.find((r: Role) => {
        const rId = r._id?.toString() || r._id;
        return rId === roleId || rId === roleId?.toString();
      });
      if (found) return found;
    }
    if (roleKey) {
      const found = roles.find((r: Role) => r.key === roleKey);
      if (found) return found;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching role details:', error);
    return null;
  }
};

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { permissions } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canUpdate = permissions.includes('techUsersUpdate');
  const canDelete = permissions.includes('techUsersDelete');

  const { data: userData, isLoading, isError, error } = useQuery<UserResponse>({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  const { data: roleData, isLoading: roleLoading } = useQuery<Role | null>({
    queryKey: ['userRole', userData?.user?.roleId, userData?.user?.role, userData?.user?.portalType],
    queryFn: () => {
      if (!userData?.user) return null;
      return fetchRoleDetails(userData.user.roleId, userData.user.role, userData.user.portalType);
    },
    enabled: !!(userData?.user && (userData.user.roleId || userData.user.role) && userData.user.portalType),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      toast.success('User deleted successfully!');
      navigate('/users');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const handleEdit = () => {
    if (canUpdate && userData?.user) {
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (!canDelete || !userData?.user) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${userData.user.firstName} ${userData.user.lastName} (${userData.user.email})? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteMutation.mutate(userData.user._id);
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    queryClient.invalidateQueries({ queryKey: ['tech-users'] });
    setIsEditModalOpen(false);
    toast.success('User updated successfully!');
  };

  if (isLoading) return <div className="py-32 text-center"><div className="inline-block w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (isError || !userData?.user) return <div className="py-32 text-center text-red-600">Profile Not Found<br/>{(error as any)?.message}<button onClick={() => navigate('/users')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">← Back</button></div>;

  const user = userData.user;
  const profile = userData.profile || {};
  const role = roleData;
  const rolePermissions = role?.permissions || [];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <button onClick={() => navigate('/users')} className="flex items-center gap-2 text-lg font-medium">
        <MdArrowBack className="w-5 h-5" /> Back to Users List
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
            {user.firstName[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{user.fullName || `${user.firstName} ${user.lastName}`}</h1>
            <p className="text-xl text-muted-foreground mt-2">{user.email}</p>
            <div className="flex items-center gap-4 mt-6">
              <span className={`px-5 py-2 rounded-full text-sm font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-5 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                {user.roleName || user.role}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {canUpdate && (
            <button
              onClick={handleEdit}
              disabled={!userData?.user}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdEdit className="w-5 h-5" /> Edit User
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={!userData?.user || deleteMutation.isPending}
              className="px-6 py-3 bg-red-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <MdDelete className="w-5 h-5" /> Delete User
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Employee Details */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3"><MdBadge className="w-6 h-6 text-primary" /> Employee Details</h3>
          <div className="space-y-6 text-base">
            <div className="flex justify-between"><span className="text-muted-foreground">Employee ID</span><span className="font-medium">{profile.employeeId || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Phone</span><span className="font-medium flex items-center gap-2"><MdPhone className="w-5 h-5 text-primary" />{profile.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{profile.department || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span className="font-medium">{profile.designation || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Reporting To</span><span className="font-medium flex items-center gap-2"><MdSupervisorAccount className="w-5 h-5 text-primary" />{profile.reportingTo?.fullName || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Location</span><span className="font-medium flex items-center gap-2"><MdLocationOn className="w-5 h-5 text-primary" />{profile.location || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Created By</span><span className="font-medium flex items-center gap-2"><MdPerson className="w-5 h-5 text-primary" />{profile.createdBy?.fullName || '—'}</span></div>
          </div>
        </div>

        {/* Account Timeline */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3"><MdAccessTime className="w-6 h-6 text-primary" /> Account Timeline</h3>
          <div className="space-y-6 text-base">
            <div className="flex justify-between"><span className="text-muted-foreground">Account Created</span><span className="font-medium">{formatDate(user.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last Login</span><span className="font-medium">{user.lastLogin ? `${formatDate(user.lastLogin)}, ${formatTime(user.lastLogin)}` : '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Last Login IP</span><span className="font-medium flex items-center gap-2"><MdPublic className="w-5 h-5 text-primary" />{user.ipLastLogin || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Portal Access</span><span className="font-medium flex items-center gap-2"><MdBusinessCenter className="w-5 h-5 text-primary" />{user.portalType.charAt(0).toUpperCase() + user.portalType.slice(1)} Portal</span></div>
          </div>
        </div>
      </div>

      {/* Role & Permissions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Role Information */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <MdVerifiedUser className="w-6 h-6 text-primary" /> Role Information
          </h3>
          {roleLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : role ? (
            <div className="space-y-6 text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role Name</span>
                <span className="font-medium">{role.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role Key</span>
                <span className="font-medium font-mono text-sm">{role.key}</span>
              </div>
              {role.description && (
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium">{role.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Permissions</span>
                <span className="font-medium">{rolePermissions.length}</span>
              </div>
            </div>
          ) : user.roleName || user.role ? (
            <div className="space-y-6 text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role Name</span>
                <span className="font-medium">{user.roleName || user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role Key</span>
                <span className="font-medium font-mono text-sm">{user.role}</span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                Full role details not available. Role may need to be assigned.
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No role information available
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <MdSecurity className="w-6 h-6 text-primary" /> Permissions
          </h3>
          {roleLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : rolePermissions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                {rolePermissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-slate-700"
                  >
                    {permission}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {rolePermissions.length} permission{rolePermissions.length !== 1 ? 's' : ''} assigned to this role
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No permissions assigned
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && userData?.user && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          size="large"
        >
          <UserForm
            user={userData.user}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}