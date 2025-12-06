import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { MdSearch, MdFilterList, MdDelete, MdEdit, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";

export function AssignRolesPage() {
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const portalFilter = "tech"; // fixed for tech portal only

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  /** Fetch Roles (Tech only) */
  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/assign-role/roles?portalType=tech`);
      const json = await res.json();
      return json.data || [];
    },
  });

  /** Fetch Users (Tech only) */
  const usersQuery = useQuery({
    queryKey: ["users", portalFilter],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/assign-role/users?portalType=${portalFilter}`
      );
      const json = await res.json();
      return json.data || [];
    },
  });

  const roles = rolesQuery.data || [];
  const users = usersQuery.data || [];

  /** Role dropdown options */
  const roleOptions = roles.map((r) => ({
    label: r.name, // readable name like CTO
    value: r._id,
  }));

  /** User dropdown options */
  const userOptions = users.map((u) => ({
    value: u._id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  /** Assign role */
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
      queryClient.invalidateQueries(["users"]);
      setSelectedRole(null);
      setSelectedUser(null);
    },
  });

  /** Remove role */
  const removeRoleMutation = useMutation({
    mutationFn: async (userId) => {
      await fetch(`${API_URL}/assign-role/assign/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  /** Filter users by search */
  const filteredUsers = useMemo(() => {
    let data = users;

    if (searchQuery.trim()) {
      data = data.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [users, searchQuery]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Assign Roles</h1>

      {/* ASSIGN ROLE FORM */}
      <div className="border rounded-lg p-5 bg-white shadow-sm max-w-md space-y-4">
        <h2 className="font-semibold">Assign Role</h2>

        <Select
          options={roleOptions}
          placeholder="Select Role..."
          value={selectedRole}
          onChange={setSelectedRole}
        />

        <Select
          options={userOptions}
          placeholder="Select User..."
          value={selectedUser}
          onChange={setSelectedUser}
        />

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

      {/* SEARCH */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-72">
          <MdSearch className="absolute left-3 top-2.5 text-gray-500" />
          <input
            className="border w-full pl-10 p-2 rounded-lg"
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
                <td className="p-2 border">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-2 border">{u.email}</td>

                {/* SHOW READABLE ROLE NAME */}
                <td className="p-2 border">{u.roleName || "No role"}</td>

                <td className="border p-2 align-middle text-center">
                  <div className="flex items-center justify-center gap-3">

                    {/* EDIT MODAL BUTTON */}
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditingRole(u.roleId || null);
                        setEditModalOpen(true);
                      }}
                      className="hover:bg-blue-100 p-1 rounded"
                    >
                      <MdEdit size={18} className="text-blue-600" />
                    </button>

                    {/* REMOVE ROLE */}
                    <button
                      onClick={() => removeRoleMutation.mutate(u._id)}
                      className="hover:bg-red-100 p-1 rounded"
                    >
                      <MdDelete size={18} className="text-red-600" />
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
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl space-y-4 relative">

            <button
              className="absolute right-3 top-3"
              onClick={() => setEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold text-lg">Edit User Role</h2>

            <p className="text-gray-600">
              {editingUser.firstName} {editingUser.lastName}
            </p>

            <Select
              options={roleOptions}
              value={roleOptions.find((r) => r.value === editingRole)}
              onChange={(opt) => setEditingRole(opt.value)}
            />

            <button
              className="bg-blue-600 text-white py-2 rounded-lg w-full hover:bg-blue-700"
              onClick={() => {
                assignRoleMutation.mutate({
                  userId: editingUser._id,
                  roleId: editingRole,
                });
                setEditModalOpen(false);
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
