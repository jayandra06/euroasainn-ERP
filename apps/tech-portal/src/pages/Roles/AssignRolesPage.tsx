import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { MdDelete, MdEdit, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "tech";

/* ---------------- AUTH FETCH ---------------- */
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

// Type definitions
interface Role {
  _id: string;
  name: string;
  key: string;
  portalType: string;
  permissions?: string[];
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role?: string;
  roleName?: string;
  roleId?: string;
}

interface RoleOption {
  label: string;
  value: string;
}

interface UserOption {
  label: string;
  value: string;
}

export function AssignRolesPage() {
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  /* ---------------- FETCH ROLES (TECH) ---------------- */
  const rolesQuery = useQuery({
    queryKey: ["roles", FIXED_PORTAL],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  /* ---------------- FETCH USERS (TECH) ---------------- */
  const usersQuery = useQuery({
    queryKey: ["users", FIXED_PORTAL],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    queryFn: async () => {
      const res = await authFetch(
        `${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  const roles: Role[] = rolesQuery.data || [];
  const users: User[] = usersQuery.data || [];

  const roleOptions = roles.map((r: any) => ({
    label: r.name,
    value: r._id,
  }));

  const userOptions = users.map((u: any) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  /* ---------------- ASSIGN ROLE ---------------- */
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
      queryClient.invalidateQueries({ queryKey: ["users", FIXED_PORTAL] });
      setSelectedRole(null);
      setSelectedUser(null);
    },
  });

  /* ---------------- REMOVE ROLE ---------------- */
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      await authFetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove role");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["users", FIXED_PORTAL] }),
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    return users.filter((u: any) =>
      `${u.firstName} ${u.lastName} ${u.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Assign Roles (Tech Portal)</h1>

      {/* ASSIGN FORM */}
      <div className="border rounded-lg p-5 bg-white shadow-sm max-w-md space-y-4">
        <Select
          options={roleOptions}
          placeholder="Select Role"
          value={selectedRole}
          onChange={setSelectedRole}
        />

        <Select
          options={userOptions}
          placeholder="Select User"
          value={selectedUser}
          onChange={setSelectedUser}
        />

        <button
          disabled={!selectedRole || !selectedUser}
          onClick={() => {
            if (selectedRole && selectedUser) {
              assignRoleMutation.mutate({
                userId: selectedUser.value,
                roleId: selectedRole.value,
              });
            }
          }}
          className="bg-blue-600 text-white p-2 rounded w-full disabled:bg-gray-300"
        >
          Assign Role
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border p-5 rounded-lg shadow-sm">
        <input
          className="border p-2 rounded mb-4 w-72"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u: any) => (
              <tr key={u._id}>
                <td className="border p-2">
                  {u.firstName} {u.lastName}
                </td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.roleName || "No role"}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setEditingRole(u.roleId);
                      setEditModalOpen(true);
                    }}
                  >
                    <MdEdit />
                  </button>
                  <button
                    onClick={() => removeRoleMutation.mutate(u._id)}
                    className="ml-2"
                  >
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold mb-2">Edit User Role</h2>

            <Select
              options={roleOptions}
              value={roleOptions.find((r) => r.value === editingRole)}
              onChange={(opt: any) => setEditingRole(opt.value)}
            />

            <button
              className="bg-blue-600 text-white py-2 rounded-lg w-full mt-4"
              onClick={() => {
                if (editingUser && editingRole) {
                  assignRoleMutation.mutate({
                    userId: editingUser._id,
                    roleId: editingRole,
                  });
                  setEditModalOpen(false);
                }
              }}
            >
              Save Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
