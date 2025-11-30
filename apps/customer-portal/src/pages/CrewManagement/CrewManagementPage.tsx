import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';

interface Role {
  _id: string;
  name: string;
  description?: string;
  portalType: string;
}

export function CrewManagementPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<{ id: number }[]>([{ id: 1 }]);
  const [rowRoles, setRowRoles] = useState<Record<number, string>>({});
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [creatingForRowId, setCreatingForRowId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Fetch roles for customer portal
  const { data: roles = [], refetch: refetchRoles } = useQuery<Role[]>({
    queryKey: ['customer-roles'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/roles?portalType=customer');
      if (!response.ok) {
        console.error('Failed to fetch roles:', response.status);
        return [];
      }
      const data = await response.json();
      console.log('Fetched roles from API:', data.data);
      return data.data || [];
    },
    staleTime: 0, // Always refetch when invalidated
    refetchOnWindowFocus: false,
  });
  
  console.log('Current roles in component:', roles);

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
    onSuccess: async (data) => {
      const createdRole = data.data;
      const createdRoleName = createdRole?.name || newRoleName.trim();
      
      console.log('Role created:', createdRole);
      console.log('Role name:', createdRoleName);
      
      // Optimistically update the cache with the new role
      if (createdRole) {
        queryClient.setQueryData<Role[]>(['customer-roles'], (oldRoles = []) => {
          // Check if role already exists to avoid duplicates
          const exists = oldRoles.some(r => r._id === createdRole._id || r.name === createdRoleName);
          if (exists) {
            console.log('Role already exists in cache');
            return oldRoles;
          }
          console.log('Adding role to cache:', createdRole);
          return [...oldRoles, createdRole];
        });
      }
      
      // Refetch to ensure we have the latest data
      const refetchResult = await refetchRoles();
      console.log('Refetched roles:', refetchResult.data);
      
      // Set the role for the row that triggered creation
      if (creatingForRowId !== null) {
        setRowRoles((prev) => ({
          ...prev,
          [creatingForRowId]: createdRoleName,
        }));
        console.log('Set role for row:', creatingForRowId, createdRoleName);
      }
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['customer-roles'] });
      
      setShowRoleModal(false);
      setCreatingForRowId(null);
      setNewRoleName('');
      setNewRoleDescription('');
      showToast('Role created successfully and selected!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create role', 'error');
    },
  });

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Date.now() }]);
  };

  const handleRoleChange = (rowId: number, value: string, selectElement: HTMLSelectElement) => {
    if (value === '__create_role__') {
      setCreatingForRowId(rowId);
      setShowRoleModal(true);
      // Reset select to current value (or empty) after opening modal
      selectElement.value = rowRoles[rowId] || '';
    } else {
      // Update the role for this row
      setRowRoles((prev) => ({
        ...prev,
        [rowId]: value,
      }));
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Add Employee</h1>
      </div>

      {/* Form */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Name</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Mail ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact No.</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Role</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
        </div>

        <div className="space-y-4 mb-6">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-6 gap-4">
              <input
                type="text"
                value="New"
                readOnly
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="text"
                placeholder="Enter employee name"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="email"
                placeholder="Enter an Email"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="tel"
                placeholder="Enter a phone number"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                value={rowRoles[row.id] || ''}
                onChange={(e) => handleRoleChange(row.id, e.target.value, e.target)}
              >
                <option value="">Select Role</option>
                {/* Static maritime roles */}
                <option value="Captain">Captain</option>
                <option value="Chief Engineer">Chief Engineer</option>
                <option value="Chief Officer">Chief Officer</option>
                <option value="Second Engineer">Second Engineer</option>
                <option value="Second Officer">Second Officer</option>
                <option value="Third Engineer">Third Engineer</option>
                <option value="Third Officer">Third Officer</option>
                <option value="Deck Cadet">Deck Cadet</option>
                <option value="Engine Cadet">Engine Cadet</option>
                <option value="Able Seaman">Able Seaman</option>
                <option value="Ordinary Seaman">Ordinary Seaman</option>
                <option value="Oiler">Oiler</option>
                <option value="Wiper">Wiper</option>
                <option value="Cook">Cook</option>
                <option value="Steward">Steward</option>
                <option value="Electrician">Electrician</option>
                <option value="Pumpman">Pumpman</option>
                <option value="Bosun">Bosun</option>
                {/* Dynamic roles from API */}
                {roles.length > 0 && (
                  <>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </>
                )}
                {/* Create Role option at the end */}
                <option value="__create_role__" className="font-semibold text-blue-600">
                  + Create New Role
                </option>
              </select>
              <button className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors text-sm">
                Save
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  setCreatingForRowId(null);
                  setNewRoleName('');
                  setNewRoleDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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




