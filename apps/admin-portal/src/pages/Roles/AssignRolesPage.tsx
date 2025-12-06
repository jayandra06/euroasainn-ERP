import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { MdSearch, MdDelete, MdEdit, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "admin";

export function AssignRolesPage() {
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);

  // 1️⃣ FETCH ADMIN ROLES
  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  // 2️⃣ FETCH ADMIN USERS
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const roles = rolesQuery.data || [];
  const users = usersQuery.data || [];

  // ROLE OPTIONS
  const roleOptions = roles.map((r) => ({
    label: r.name,
    value: r._id,
    key: r.key,
  }));

  // USER OPTIONS
  const userOptions = users.map((u) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  // 3️⃣ ASSIGN ROLE
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }) => {
      const res = await fetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      setSelectedRole(null);
      setSelectedUser(null);
    },
  });

  // 4️⃣ REMOVE ROLE
  const removeRoleMutation = useMutation({
    mutationFn: async (userId) => {
      await fetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => queryClient.invalidateQueries(["admin-users"]),
  });

  // 5️⃣ SEARCH FILTER
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Assign Roles (Admin Portal)</h1>

      {/* ASSIGN ROLE FORM */}
      <div className="border rounded-lg p-5 bg-white shadow-sm max-w-md space-y-4">
        <h2 className="font-semibold">Assign Role</h2>

        <Select options={roleOptions} placeholder="Select Role..." value={selectedRole} onChange={setSelectedRole} />
        <Select options={userOptions} placeholder="Select User..." value={selectedUser} onChange={setSelectedUser} />

        <button
          disabled={!selectedRole || !selectedUser}
          onClick={() =>
            assignRoleMutation.mutate({
              userId: selectedUser.value,
              roleId: selectedRole.value,
            })
          }
          className="bg-blue-600 text-white p-2 rounded w-full disabled:bg-gray-300"
        >
          Assign Role
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-72">
          <MdSearch className="absolute left-3 top-2.5 text-gray-500" />
          <input
            className="border pl-10 p-2 w-full rounded-lg"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="border rounded-lg p-5 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Users</h2>

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
            {filteredUsers.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="border p-2">{u.firstName} {u.lastName}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.roleName || "No role"}</td>

                <td className="border p-2 text-center">
                  <div className="flex justify-center gap-3">
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
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl relative space-y-4">
            <button className="absolute right-3 top-3" onClick={() => setEditModalOpen(false)}>
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold text-lg">Edit Role</h2>

            <input disabled value={`${editingUser.firstName} ${editingUser.lastName}`} className="border p-2 rounded bg-gray-100 w-full" />
            <input disabled value={editingUser.email} className="border p-2 rounded bg-gray-100 w-full" />

            <Select
              options={roleOptions}
              value={roleOptions.find((r) => r.value === editingRoleId) || null}
              onChange={(opt) => setEditingRoleId(opt.value)}
            />

            <button
              className="bg-blue-600 text-white py-2 rounded-lg w-full"
              onClick={() => {
                assignRoleMutation.mutate({
                  userId: editingUser._id,
                  roleId: editingRoleId!,
                });
                setEditModalOpen(false);
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
