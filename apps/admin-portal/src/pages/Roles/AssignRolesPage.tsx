import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import { MdSearch, MdDelete, MdEdit, MdClose, MdPersonAdd, MdFilterList } from "react-icons/md";
import { Pagination } from "../../components/shared/Pagination";

const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "admin";

/* 🔐 AUTH FETCH (401 FIX) */
const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("accessToken");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || "all");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // 1️⃣ FETCH ADMIN ROLES
  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  // 2️⃣ FETCH ADMIN USERS (for dropdown - all users)
  const allUsersQuery = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}&page=1&limit=10000`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  // 3️⃣ FETCH PAGINATED USERS (for table)
  const usersQuery = useQuery({
    queryKey: ["admin-users", currentPage, itemsPerPage, searchQuery, roleFilter],
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

  // ROLE OPTIONS
  const roleOptions = roles.map((r: any) => ({
    label: r.name,
    value: r._id,
    key: r.key,
  }));

  // USER OPTIONS (for dropdown - use all users)
  const userOptions = allUsers.map((u: any) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  // 4️⃣ ASSIGN ROLE
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: any) => {
      const res = await authFetch(
        `${API_URL}/assign-role/assign/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify({ roleId }),
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setSelectedRole(null);
      setSelectedUser(null);
    },
  });

  // 5️⃣ REMOVE ROLE
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      await authFetch(
        `${API_URL}/assign-role/assign/${userId}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
    },
  });

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

  return (
    <div className="p-6 space-y-6 bg-[hsl(var(--background))] min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
            Assign Roles
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage user roles and permissions for Admin Portal
          </p>
        </div>
      </div>

      {/* ASSIGN ROLE CARD */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MdPersonAdd className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
            Assign Role to User
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Select Role
            </label>
            <Select
              options={roleOptions}
              placeholder="Choose a role..."
              value={selectedRole}
              onChange={setSelectedRole}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                  "&:hover": {
                    borderColor: "hsl(var(--primary))",
                  },
                }),
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Select User
            </label>
            <Select
              options={userOptions}
              placeholder="Choose a user..."
              value={selectedUser}
              onChange={setSelectedUser}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                  "&:hover": {
                    borderColor: "hsl(var(--primary))",
                  },
                }),
              }}
            />
          </div>

          <div className="flex items-end">
            <button
              disabled={!selectedRole || !selectedUser || assignRoleMutation.isPending}
              onClick={() =>
                assignRoleMutation.mutate({
                  userId: selectedUser.value,
                  roleId: selectedRole.value,
                })
              }
              className="w-full px-6 py-3 bg-[hsl(var(--primary))] text-white font-medium rounded-lg hover:bg-[hsl(var(--primary))]/90 disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden">
        {/* FILTERS & SEARCH */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <MdFilterList className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
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
            <thead className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[hsl(var(--border))]">
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
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
                    className="hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                          <span className="text-[hsl(var(--primary))] font-semibold">
                            {u.firstName?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {u.firstName} {u.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[hsl(var(--foreground))]">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.roleName ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                          {u.roleName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
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
                          className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/20 transition-colors"
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
                          className="p-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl w-full max-w-md shadow-2xl relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Edit User Role
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <MdClose className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    User Name
                  </label>
                  <input
                    disabled
                    value={`${editingUser.firstName} ${editingUser.lastName}`}
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Email
                  </label>
                  <input
                    disabled
                    value={editingUser.email}
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
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
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                        "&:hover": {
                          borderColor: "hsl(var(--primary))",
                        },
                      }),
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors font-medium"
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
                        setEditModalOpen(false);
                      }
                    }}
                    disabled={!editingRoleId || assignRoleMutation.isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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
