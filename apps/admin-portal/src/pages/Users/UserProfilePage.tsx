// src/pages/Users/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MdArrowBack, 
  MdEdit, 
  MdLockReset,
  MdDelete,
  MdPhone,
  MdLocationOn,
  MdSupervisorAccount,
  MdBadge,
  MdPerson,
  MdAccessTime,
  MdPublic,
  MdBusinessCenter,
  MdCheckCircle,
  MdCancel,
} from 'react-icons/md';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  portalType: string;
  role: string;
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

interface UserResponse {
  user: User;
  profile: UserProfileData | null;
}

const fetchUserProfile = async (userId: string): Promise<UserResponse> => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch');
  return json.data;
};

const updateUserProfile = async (userId: string, updates: Partial<UserProfileData>) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to update');
  return json.data;
};

const deleteUser = async (userId: string) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || 'Failed to delete user');
  }
};

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: userData, isLoading, isError, error, refetch } = useQuery<UserResponse>({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData?.profile) {
      setEditData(userData.profile);
    }
  }, [userData]);

  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      await updateUserProfile(userId, editData);

      showToast('User profile updated successfully', 'success');
      await refetch();
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;

    const userEmail = userData?.user.email || 'this user';
    if (!window.confirm(`Are you sure you want to permanently delete ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteUser(userId);

      showToast('User deleted successfully', 'success');

      // Clean up this specific profile cache
      queryClient.removeQueries({ queryKey: ['userProfile', userId] });

      // Invalidate users list queries
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });

      // IMPORTANT: Immediately redirect to users list and replace history entry
      // This fixes the URL lingering issue and prevents back-button to deleted profile
      navigate('/users', { replace: true });
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !userData?.user) {
    return (
      <div className="py-32 text-center text-red-600">
        Profile Not Found
        <br />
        {(error as any)?.message || 'Unknown error'}
        <button
          onClick={handleBack}
          className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  const user = userData.user;
  const profile = userData.profile || {};

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-lg font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
        >
          <MdArrowBack className="w-6 h-6" /> Back to Users List
        </button>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsEditModalOpen(true)}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdEdit className="w-5 h-5" /> Edit User
          </button>
          <button
            onClick={() => {} /* Reset Password - implement later if needed */}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <MdLockReset className="w-5 h-5" /> Reset Password
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className={cn(
              "px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed",
              deleting && "animate-pulse"
            )}
          >
            {deleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <MdDelete className="w-5 h-5" />
                Delete User
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
            {user.firstName[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{user.fullName || `${user.firstName} ${user.lastName}`}</h1>
            <p className="text-xl text-muted-foreground mt-2">{user.email}</p>
            <div className="flex items-center gap-4 mt-6">
              <span className="px-5 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-5 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Employee Details */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <MdBadge className="w-6 h-6 text-primary" /> Employee Details
          </h3>
          <div className="space-y-6 text-base">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-medium">{profile.employeeId || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium flex items-center gap-2">
                <MdPhone className="w-5 h-5 text-primary" />
                {profile.phone || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{profile.department || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">{profile.designation || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reporting To</span>
              <span className="font-medium flex items-center gap-2">
                <MdSupervisorAccount className="w-5 h-5 text-primary" />
                {profile.reportingTo?.fullName || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium flex items-center gap-2">
                <MdLocationOn className="w-5 h-5 text-primary" />
                {profile.location || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Created By</span>
              <span className="font-medium flex items-center gap-2">
                <MdPerson className="w-5 h-5 text-primary" />
                {profile.createdBy?.fullName || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Timeline */}
        <div className="p-8 rounded-2xl border bg-card shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <MdAccessTime className="w-6 h-6 text-primary" /> Account Timeline
          </h3>
          <div className="space-y-6 text-base">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Created</span>
              <span className="font-medium">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span className="font-medium">
                {user.lastLogin ? `${formatDate(user.lastLogin)}, ${formatTime(user.lastLogin)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Login IP</span>
              <span className="font-medium flex items-center gap-2">
                <MdPublic className="w-5 h-5 text-primary" />
                {user.ipLastLogin || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Portal Access</span>
              <span className="font-medium flex items-center gap-2">
                <MdBusinessCenter className="w-5 h-5 text-primary" />
                {user.portalType.charAt(0).toUpperCase() + user.portalType.slice(1)} Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        size="large"
      >
        <div className="p-8 space-y-10">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <p className="text-amber-800 dark:text-amber-300 text-base leading-relaxed">
              <strong>Note:</strong> Only phone, department, designation, and location can be edited here. Core fields (name, email, role) are system-managed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Read-only Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed">
                  {user.role}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full px-5 py-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                <input
                  type="text"
                  value={editData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Engineering"
                  className="w-full px-5 py-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Designation</label>
                <input
                  type="text"
                  value={editData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full px-5 py-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Delhi, India"
                  className="w-full px-5 py-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
              className="px-10 py-4 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "px-12 py-4 rounded-xl font-semibold shadow-lg transition-all text-lg flex items-center gap-3",
                saving
                  ? "bg-slate-400 text-slate-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {saving ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <MdCheckCircle size={22} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}