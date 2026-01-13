import { useState, useMemo, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import {
  MdSearch,
  MdFilterList,
  MdDelete,
  MdEdit,
  MdClose,
  MdPersonAdd,
} from "react-icons/md";
import { Pagination } from "../../components/shared/Pagination";

const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "customer";

// Helper to get token from localStorage
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
};

export function AssignRolesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit') || '10', 10));
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || "all");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // FETCH CUSTOMER ROLES
  const rolesQuery = useQuery({
    queryKey: ["customer-roles"],
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  // FETCH ALL USERS (for dropdown)
  const allUsersQuery = useQuery({
    queryKey: ["customer-all-users"],
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}&page=1&limit=10000`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  // FETCH PAGINATED USERS (for table)
  const usersQuery = useQuery({
    queryKey: ["customer-users", currentPage, itemsPerPage, searchQuery, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        portalType: FIXED_PORTAL,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchQuery.trim()) params.append("search", searchQuery);
      if (roleFilter !== "all") params.append("roleFilter", roleFilter);

      const res = await authFetch(
        `${API_URL}/assign-role/users?${params.toString()}`
      );
      const json = await res.json();
      return json;
    },
  });

  const roles = rolesQuery.data || [];
  const allUsers = allUsersQuery.data || [];
  const users = usersQuery.data?.data || [];
  const pagination = usersQuery.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // DROPDOWN OPTIONS
  const roleOptions = roles.map((r: any) => ({
    label: r.name,
    value: r._id,
    key: r.key,
  }));

  const userOptions = allUsers.map((u: any) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== 10) params.set('limit', itemsPerPage.toString());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, currentPage, itemsPerPage, roleFilter, setSearchParams]);

  // Reset to page 1 when search or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // ASSIGN ROLE
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: any) => {
      const res = await authFetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ roleId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-users"] });
      queryClient.invalidateQueries({ queryKey: ["customer-all-users"] });
      setSelectedUser(null);
      setSelectedRole(null);
      setEditModalOpen(false);
    },
  });

  // REMOVE ROLE
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) =>
      authFetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-users"] });
      queryClient.invalidateQueries({ queryKey: ["customer-all-users"] });
    },
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assign Roles
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and permissions for Customer Portal
          </p>
        </div>
      </div>

      {/* ASSIGN ROLE CARD */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MdPersonAdd className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Assign Role to User
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Role
            </label>
            <Select
              options={roleOptions}
              placeholder="Choose a role..."
              value={selectedRole}
              onChange={setSelectedRole}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User
            </label>
            <Select
              options={userOptions}
              placeholder="Choose a user..."
              value={selectedUser}
              onChange={setSelectedUser}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="flex items-end">
            <button
              disabled={!selectedUser || !selectedRole || assignRoleMutation.isPending}
              onClick={() =>
                assignRoleMutation.mutate({
                  userId: selectedUser.value,
                  roleId: selectedRole.value,
                })
              }
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {assignRoleMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <MdPersonAdd className="w-5 h-5" />
                  Assign Role
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* USERS TABLE CARD */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* FILTERS & SEARCH */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <MdFilterList className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                {roles.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchQuery || roleFilter !== "all"
                        ? "No users found matching your criteria"
                        : "No users found"}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {u.firstName?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.roleName ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400">
                          {u.roleName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          No role assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditingRoleId(u.roleId || null);
                            setEditModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          title="Edit role"
                        >
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to remove the role from ${u.firstName} ${u.lastName}?`
                              )
                            ) {
                              removeRoleMutation.mutate(u._id);
                            }
                          }}
                          disabled={removeRoleMutation.isPending}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove role"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* EDIT MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-md shadow-2xl relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit User Role
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Name
                  </label>
                  <input
                    disabled
                    value={`${editingUser.firstName} ${editingUser.lastName}`}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    disabled
                    value={editingUser.email}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <Select
                    options={roleOptions}
                    value={
                      roleOptions.find(
                        (r) => r.value === editingRoleId
                      ) || null
                    }
                    onChange={(opt: any) =>
                      setEditingRoleId(opt.value)
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingRoleId) {
                        assignRoleMutation.mutate({
                          userId: editingUser._id,
                          roleId: editingRoleId,
                        });
                      }
                    }}
                    disabled={!editingRoleId || assignRoleMutation.isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {assignRoleMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
