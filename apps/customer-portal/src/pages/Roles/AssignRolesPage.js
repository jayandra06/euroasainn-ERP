import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, } from "@tanstack/react-query";
import Select from "react-select";
import { MdSearch, MdFilterList, MdDelete, MdEdit, MdClose, } from "react-icons/md";
const API_URL = "http://localhost:3000/api/v1";
const FIXED_PORTAL = "customer"; // This is the important part
export function AssignRolesPage() {
    const queryClient = useQueryClient();
    // -------------------------------------
    // FETCH CUSTOMER ROLES FROM BACKEND
    // -------------------------------------
    const rolesQuery = useQuery({
        queryKey: ["customer-roles"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/assign-role/roles?portalType=${FIXED_PORTAL}`);
            const json = await res.json();
            return json.data || [];
        },
    });
    // -------------------------------------
    // FETCH CUSTOMER USERS
    // -------------------------------------
    const usersQuery = useQuery({
        queryKey: ["customer-users"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/assign-role/users?portalType=${FIXED_PORTAL}`);
            const json = await res.json();
            return json.data || [];
        },
    });
    const roles = rolesQuery.data || [];
    const users = usersQuery.data || [];
    // Form states
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    // Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    // DROPDOWN OPTIONS
    const roleOptions = roles.map((r) => ({
        label: r.name,
        value: r._id,
        key: r.key,
    }));
    const userOptions = users.map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName} (${u.email})`,
    }));
    // -------------------------------------
    // FILTER USERS
    // -------------------------------------
    const filteredUsers = useMemo(() => {
        let data = users;
        if (roleFilter !== "all")
            data = data.filter((u) => u.role === roleFilter);
        if (searchQuery.trim()) {
            data = data.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase()));
        }
        return data;
    }, [users, searchQuery, roleFilter]);
    // -------------------------------------
    // ASSIGN ROLE
    // -------------------------------------
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
            queryClient.invalidateQueries(["customer-users"]);
            setSelectedUser(null);
            setSelectedRole(null);
        },
    });
    // -------------------------------------
    // REMOVE ROLE
    // -------------------------------------
    const removeRoleMutation = useMutation({
        mutationFn: async (userId) => fetch(`${API_URL}/assign-role/assign/${userId}`, {
            method: "DELETE",
        }),
        onSuccess: () => queryClient.invalidateQueries(["customer-users"]),
    });
    return (<div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">
        Assign Roles (Customer Portal)
      </h1>

      {/* ASSIGN ROLE FORM */}
      <div className="border rounded-lg p-5 bg-white shadow-sm max-w-md space-y-4">
        <h2 className="font-semibold">Assign Role</h2>

        <Select options={roleOptions} placeholder="Select Role..." value={selectedRole} onChange={setSelectedRole}/>

        <Select options={userOptions} placeholder="Select User..." value={selectedUser} onChange={setSelectedUser}/>

        <button disabled={!selectedUser || !selectedRole} onClick={() => assignRoleMutation.mutate({
            userId: selectedUser.value,
            roleId: selectedRole.value,
        })} className="bg-blue-600 text-white p-2 rounded w-full disabled:bg-gray-300">
          Assign Role
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex items-center bg-white p-4 rounded-lg border shadow-sm justify-between">
        <div className="relative w-72">
          <MdSearch className="absolute left-3 top-2.5 text-gray-500"/>
          <input className="border w-full pl-10 p-2 rounded-lg" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>

        <div className="flex items-center border rounded-lg px-3 py-2">
          <MdFilterList className="mr-2 text-gray-600"/>
          <select className="bg-transparent outline-none cursor-pointer" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map((r) => (<option value={r.name} key={r._id}>
                {r.name}
              </option>))}
          </select>
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
            {filteredUsers.map((u) => (<tr key={u._id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.roleName || "No role"}</td>

                <td className="p-2 border text-center">
                  <div className="flex justify-center gap-3">
                    {/* EDIT */}
                    <button className="text-blue-600" onClick={() => {
                setEditingUser(u);
                setSelectedRole(roleOptions.find((r) => r.value === u.roleId));
                setEditModalOpen(true);
            }}>
                      <MdEdit size={18}/>
                    </button>

                    {/* DELETE ROLE */}
                    <button className="text-red-600" onClick={() => removeRoleMutation.mutate(u._id)}>
                      <MdDelete size={18}/>
                    </button>
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editModalOpen && editingUser && (<div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl relative space-y-4">
            <button className="absolute right-3 top-3" onClick={() => setEditModalOpen(false)}>
              <MdClose size={22}/>
            </button>

            <h2 className="font-semibold text-lg">
              Edit Role for {editingUser.firstName}
            </h2>

            <input disabled value={`${editingUser.firstName} ${editingUser.lastName}`} className="border p-2 rounded bg-gray-100 w-full"/>

            <input disabled value={editingUser.email} className="border p-2 rounded bg-gray-100 w-full"/>

            <Select options={roleOptions} value={selectedRole} onChange={setSelectedRole}/>

            <button className="bg-blue-600 text-white py-2 rounded-lg w-full" onClick={() => {
                assignRoleMutation.mutate({
                    userId: editingUser._id,
                    roleId: selectedRole.value,
                });
                setEditModalOpen(false);
            }}>
              Save Changes
            </button>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=AssignRolesPage.js.map