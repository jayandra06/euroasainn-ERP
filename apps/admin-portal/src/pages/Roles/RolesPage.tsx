import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";

const PORTALS = [{ label: "Admin Portal", value: "admin" }];
const API_URL = "http://localhost:3000/api/v1";

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]); // ⭐ dynamic permissions from backend
  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // ⭐ 1️⃣ Load Admin Permissions From Backend
  const fetchPermissions = async () => {
    const res = await fetch(`${API_URL}/permissions?portalType=admin`);
    const json = await res.json();
    if (json.success) {
      setPermissionsList(json.data); // [{ key, label }]
    }
  };

  // ⭐ 2️⃣ Load Roles
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return;

    setLoading(true);
    const res = await fetch(`${API_URL}/roles?portalType=admin`);
    const json = await res.json();
    setLoading(false);

    const parsed = json.data.map((role) => ({
      ...role,
      permissions: Object.fromEntries(
        permissionsList.map((p) => [p.key, role.permissions.includes(p.key)])
      ),
    }));

    setRoles(parsed);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [permissionsList]);

  // ⭐ Create Role
  const handleAddRole = async () => {
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

  // ⭐ Delete Role
  const deleteRole = async (id) => {
    await fetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
    fetchRoles();
  };

  // ⭐ Save Edit
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
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Roles & Permissions (Admin Portal)</h1>

      {/* CREATE ROLE */}
      <div className="bg-white p-6 border rounded shadow space-y-4">
        <h2 className="font-semibold">Create Role</h2>

        <div className="flex gap-4">
          <select
            value={portal}
            onChange={(e) => {
              setPortal(e.target.value);

              const map = {};
              permissionsList.forEach((p) => (map[p.key] = false));
              setPermissions(map);
            }}
            className="border p-2 rounded w-1/2"
          >
            <option value="">Select Portal</option>
            {PORTALS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter Role Name"
            className="border p-2 rounded w-1/2"
          />
        </div>

        {portal && (
          <div className="grid grid-cols-2 gap-3">
            {permissionsList.map((perm) => (
              <label key={perm.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() =>
                    setPermissions({
                      ...permissions,
                      [perm.key]: !permissions[perm.key],
                    })
                  }
                />
                {perm.label}
              </label>
            ))}
          </div>
        )}

        <button
          className="bg-blue-600 text-white p-2 rounded"
          onClick={handleAddRole}
        >
          + Add Role
        </button>
      </div>

      {/* EXISTING ROLES */}
      <div className="bg-white p-6 border rounded shadow">
        <h2 className="font-semibold mb-4">Existing Roles</h2>

        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Portal</th>
              <th className="p-2 border">Role Name</th>
              <th className="p-2 border">Permissions</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r._id}>
                <td className="border p-2">{r.portalType}</td>
                <td className="border p-2">{r.name}</td>

                {/* ⭐ Permissions in 2 columns */}
                <td className="border p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(r.permissions)
                      .filter(([_, v]) => v)
                      .map(([p]) => {
                        const label = permissionsList.find((x) => x.key === p)?.label;
                        return <div key={p}>• {label}</div>;
                      })}
                  </div>
                </td>

                <td className="border p-2">
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setEditingRole(r);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <MdEdit size={20} className="text-blue-600" />
                    </button>

                    <button onClick={() => deleteRole(r._id)}>
                      <MdDelete size={20} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-xl w-[400px] relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setIsEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Edit Role</h2>

            <input
              disabled
              value={editingRole.name}
              className="border p-2 rounded w-full bg-gray-100"
            />

            <div className="grid grid-cols-2 gap-2 mt-3">
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
              className="bg-blue-600 text-white p-2 rounded w-full mt-4"
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
