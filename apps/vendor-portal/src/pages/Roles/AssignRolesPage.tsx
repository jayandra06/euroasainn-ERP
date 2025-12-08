// src/pages/vendor/AssignRolesPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { MdSearch, MdFilterList, MdDelete, MdEdit, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "vendor"; // <- VERY IMPORTANT: backend PortalType

export default function AssignRolesPage() {
  const queryClient = useQueryClient();

  // form states
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // -----------------------------
  // 1️⃣ FETCH VENDOR ROLES
  // -----------------------------
  const rolesQuery = useQuery({
    queryKey: ["vendor-roles"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  // -----------------------------
  // 2️⃣ FETCH VENDOR USERS
  // -----------------------------
  const usersQuery = useQuery({
    queryKey: ["vendor-users"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const roles = rolesQuery.data || [];
  const users = usersQuery.data || [];

  // -----------------------------
  // ROLE DROPDOWN OPTIONS
  // -----------------------------
  const roleOptions = roles.map((r: any) => ({
    label: r.name, // e.g. "Vendor Super Admin"
    value: r._id,  // roleId
    key: r.key,    // "vendor_super_admin"
  }));

  // -----------------------------
  // USER DROPDOWN OPTIONS
  // -----------------------------
  const userOptions = users.map((u: any) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  // -----------------------------
  // 3️⃣ ASSIGN ROLE MUTATION
  // -----------------------------
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const res = await fetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to assign role");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-users"] });
      setSelectedRole(null);
      setSelectedUser(null);
      setEditModalOpen(false);
    },
  });

  // -----------------------------
  // 4️⃣ REMOVE ROLE MUTATION
  // -----------------------------
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to remove role");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-users"] });
    },
  });

  // -----------------------------
  // 5️⃣ FILTER USERS TABLE
  // -----------------------------
  const filteredUsers = useMemo(() => {
    let data = users as any[];

    if (roleFilter !== "all") {
      data = data.filter((u) => u.roleName === roleFilter || u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      data = data.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [users, roleFilter, searchQuery]);

  // Create list of roles for filter dropdown
  const uniqueRoleNames = Array.from(
    new Set(
      (users || [])
        .map((u: any) => u.roleName || u.role)
        .filter(Boolean)
    )
  ) as string[];

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Assign Vendor Portal Roles</h1>

      {/* ASSIGN ROLE FORM */}
      <div className="border rounded-lg p-5 bg-white shadow-sm max-w-md space-y-4">
        <h2 className="font-semibold">Assign Role</h2>

        <Select
          options={roleOptions}
          placeholder="Select Role..."
          value={selectedRole}
          onChange={(opt) => setSelectedRole(opt)}
        />

        <Select
          options={userOptions}
          placeholder="Select User..."
          value={selectedUser}
          onChange={(opt) => setSelectedUser(opt)}
        />

        <button
          disabled={!selectedRole || !selectedUser || assignRoleMutation.isPending}
          className="bg-blue-600 text-white p-2 rounded w-full disabled:bg-gray-300"
          onClick={() =>
            assignRoleMutation.mutate({
              userId: (selectedUser as any).value,
              roleId: (selectedRole as any).value,
            })
          }
        >
          {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        {/* Search */}
        <div className="relative w-72">
          <MdSearch className="absolute left-3 top-2.5 text-gray-500" />
          <input
            className="border w-full pl-10 p-2 rounded-lg"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center border rounded-lg px-3 py-2">
          <MdFilterList className="mr-2 text-gray-600" />
          <select
            className="bg-transparent outline-none cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {uniqueRoleNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="border rounded-lg p-5 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Vendor Users</h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u: any) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.roleName || u.role || "No role"}</td>

                <td className="p-2 border">
                  <div className="flex items-center justify-center gap-3">
                    {/* EDIT */}
                    <button
                      className="text-blue-600"
                      onClick={() => {
                        setEditingUser(u);
                        setEditingRoleId(u.roleId || null);
                        setEditModalOpen(true);
                      }}
                    >
                      <MdEdit size={18} />
                    </button>

                    {/* DELETE ROLE */}
                    <button
                      className="text-red-600"
                      onClick={() => removeRoleMutation.mutate(u._id)}
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-sm text-gray-500 py-4 border"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT ROLE MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl relative space-y-4">
            <button
              className="absolute right-3 top-3"
              onClick={() => setEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold text-lg">Edit Vendor Role</h2>

            <input
              disabled
              value={`${editingUser.firstName} ${editingUser.lastName}`}
              className="border p-2 rounded bg-gray-100 w-full"
            />

            <input
              disabled
              value={editingUser.email}
              className="border p-2 rounded bg-gray-100 w-full"
            />

            <Select
              options={roleOptions}
              value={
                roleOptions.find((r) => r.value === editingRoleId) || null
              }
              onChange={(opt: any) => setEditingRoleId(opt.value)}
            />

            <button
              className="bg-blue-600 text-white py-2 rounded-lg w-full"
              onClick={() => {
                if (!editingRoleId) return;
                assignRoleMutation.mutate({
                  userId: editingUser._id,
                  roleId: editingRoleId,
                });
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
