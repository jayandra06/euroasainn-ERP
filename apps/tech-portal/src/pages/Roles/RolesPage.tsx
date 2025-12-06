import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";

const PORTALS = [{ label: "Tech Portal", value: "tech" }];
const API_URL = "http://localhost:3000/api/v1";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]); // ⭐ backend permissions
  const [loading, setLoading] = useState(false);

  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // ⭐ Fetch permissions from backend
  const fetchPermissions = async () => {
    const res = await fetch(`${API_URL}/permissions?portalType=tech`);
    const json = await res.json();

    if (json.success) {
      setPermissionsList(json.data); // [{key,label}]
    }
  };

  // ⭐ Fetch roles
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return;

    setLoading(true);
    const res = await fetch(`${API_URL}/roles?portalType=tech`);
    const json = await res.json();
    setLoading(false);

    if (!json.success) return;

    const mapped = json.data.map((role) => ({
      _id: role._id,
      portal: role.portalType,
      name: role.name,

      // ⭐ Map permissions with backend labels
      permissions: Object.fromEntries(
        permissionsList.map((p) => [p.key, role.permissions.includes(p.key)])
      ),
    }));

    setRoles(mapped);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [permissionsList]);

  // ⭐ Add new role
  const handleAddRole = async () => {
    if (!roleName.trim() || !portal) return;

    const selectedPermissions = Object.keys(permissions).filter(
      (p) => permissions[p]
    );

    await fetch(`${API_URL}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roleName,
        portalType: portal,
        permissions: selectedPermissions,
      }),
    });

    setPortal("");
    setRoleName("");
    setPermissions({});
    fetchRoles();
  };

  // ⭐ Delete role
  const deleteRole = async (id) => {
    await fetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
    fetchRoles();
  };

  // ⭐ Save edited role
  const saveEdit = async () => {
    const selectedPermissions = Object.keys(editingRole.permissions).filter(
      (p) => editingRole.permissions[p]
    );

    await fetch(`${API_URL}/roles/${editingRole._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: selectedPermissions }),
    });

    setIsEditModalOpen(false);
    fetchRoles();
  };

  return (
    <div className="p-6 space-y-10 w-full">
      <h1 className="text-2xl font-semibold">Tech Portal — Roles & Permissions</h1>

      {/* CREATE ROLE */}
      <div className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-lg">Create New Tech Role</h2>

        <div className="flex gap-4">
          <select
            className="border p-2 rounded-lg w-1/2"
            value={portal}
            onChange={(e) => {
              const val = e.target.value;
              setPortal(val);

              // ⭐ Default map: all false
              const permMap = {};
              permissionsList.forEach((p) => (permMap[p.key] = false));
              setPermissions(permMap);
            }}
          >
            <option value="">Select Portal</option>
            {PORTALS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <input
            className="border p-2 rounded-lg w-1/2"
            placeholder="Enter Role Name (e.g., Tech Lead)"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>

        {portal && (
          <div className="grid grid-cols-2 gap-3">
            {permissionsList.map((perm) => (
              <label key={perm.key} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() =>
                    setPermissions((prev) => ({
                      ...prev,
                      [perm.key]: !prev[perm.key],
                    }))
                  }
                />
                {perm.label}
              </label>
            ))}
          </div>
        )}

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={handleAddRole}
        >
          + Add Role
        </button>
      </div>

      {/* EXISTING ROLES TABLE */}
      <div className="bg-white border p-6 rounded-lg shadow-sm">
        <h2 className="font-semibold mb-4">Existing Tech Roles</h2>

        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 w-[20%]">Portal</th>
              <th className="border p-2 w-[20%]">Role</th>
              <th className="border p-2 w-[50%]">Permissions</th>
              <th className="border p-2 w-[10%] text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="border p-2">{r.portal}</td>
                <td className="border p-2">{r.name}</td>

                <td className="border p-2 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    {permissionsList
                      .filter((p) => r.permissions[p.key])
                      .map((p) => (
                        <div key={p.key}>• {p.label}</div>
                      ))}
                  </div>
                </td>

                <td className="border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingRole(r);
                      setIsEditModalOpen(true);
                    }}
                    className="hover:bg-blue-100 p-1 rounded"
                  >
                    <MdEdit size={18} className="text-blue-600" />
                  </button>

                  <button
                    onClick={() => deleteRole(r._id)}
                    className="hover:bg-red-100 p-1 rounded"
                  >
                    <MdDelete size={18} className="text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT ROLE MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setIsEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold text-lg">Edit Tech Role</h2>

            <input
              disabled
              value={editingRole.portal}
              className="border p-2 rounded bg-gray-100 w-full"
            />

            <input
              disabled
              value={editingRole.name}
              className="border p-2 rounded bg-gray-100 w-full"
            />

            <div className="grid grid-cols-2 gap-3">
              {permissionsList.map((perm) => (
                <label key={perm.key} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingRole.permissions[perm.key]}
                    onChange={() =>
                      setEditingRole({
                        ...editingRole,
                        permissions: {
                          ...editingRole.permissions,
                          [perm.key]: !editingRole.permissions[perm.key],
                        },
                      })
                    }
                  />
                  {perm.label}
                </label>
              ))}
            </div>

            <button
              className="bg-blue-600 text-white py-2 rounded-lg w-full mt-4"
              onClick={saveEdit}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
