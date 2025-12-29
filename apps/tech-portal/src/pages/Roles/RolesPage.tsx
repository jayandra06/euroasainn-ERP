import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";

const PORTALS = [{ label: "Tech Portal", value: "tech" }];
const API_URL = "http://localhost:3000/api/v1";

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

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  /* ---------------- FETCH PERMISSIONS ---------------- */
  const fetchPermissions = async () => {
    const res = await authFetch(`${API_URL}/permissions?portalType=tech`);
    const json = await res.json();
    if (json.success) setPermissionsList(json.data);
  };

  /* ---------------- FETCH ROLES ---------------- */
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return;

    setLoading(true);
    const res = await authFetch(`${API_URL}/roles?portalType=tech`);
    const json = await res.json();
    setLoading(false);
    if (!json.success) return;

    const mapped = json.data.map((role: any) => ({
      _id: role._id,
      portal: role.portalType,
      name: role.name,
      permissions: permissionsList.reduce((acc: any, p: any) => {
        acc[p.key] = role.permissions?.includes(p.key) ?? false;
        return acc;
      }, {}),
    }));

    setRoles(mapped);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [permissionsList]);

  /* ---------------- CREATE ROLE ---------------- */
  const handleAddRole = async () => {
    if (!roleName.trim() || !portal) return;

    const selectedPermissions = Object.keys(permissions).filter(
      (p: string) => permissions[p]
    );

    await authFetch(`${API_URL}/roles`, {
      method: "POST",
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

  /* ---------------- DELETE ROLE ---------------- */
  const deleteRole = async (id: string) => {
    await authFetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
    fetchRoles();
  };

  /* ---------------- UPDATE ROLE (FIXED) ---------------- */
  const saveEdit = async () => {
    // ✅ ALWAYS send FULL permission state
    const selectedPermissions = permissionsList
      .filter((p) => editingRole.permissions[p.key])
      .map((p) => p.key);

    await authFetch(`${API_URL}/roles/${editingRole._id}`, {
      method: "PUT",
      body: JSON.stringify({ permissions: selectedPermissions }),
    });

    setIsEditModalOpen(false);
    setEditingRole(null);
    fetchRoles();
  };

  return (
    <div className="p-6 space-y-10 w-full">
      <h1 className="text-2xl font-semibold">
        Tech Portal — Roles & Permissions
      </h1>

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

              const permMap: Record<string, boolean> = {};
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
            placeholder="Enter Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>

        {portal && (
          <div className="grid grid-cols-2 gap-3">
            {permissionsList.map((perm: Permission) => (
              <label key={perm.key} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={permissions[perm.key] || false}
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={handleAddRole}
        >
          + Add Role
        </button>
      </div>

      {/* ROLES TABLE */}
      <div className="bg-white border p-6 rounded-lg shadow-sm">
        <h2 className="font-semibold mb-4">Existing Tech Roles</h2>

        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Portal</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Permissions</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r._id}>
                <td className="border p-2">{r.portal}</td>
                <td className="border p-2">{r.name}</td>
                <td className="border p-2 text-sm">
                  {permissionsList
                    .filter((p) => r.permissions[p.key])
                    .map((p) => (
                      <div key={p.key}>• {p.label}</div>
                    ))}
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingRole(JSON.parse(JSON.stringify(r)));
                      setIsEditModalOpen(true);
                    }}
                    className="hover:bg-blue-100 p-1 rounded"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => deleteRole(r._id)}
                    className="hover:bg-red-100 p-1 rounded ml-2"
                  >
                    <MdDelete size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setIsEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="font-semibold text-lg mb-2">Edit Tech Role</h2>

            <input
              disabled
              value={editingRole.name}
              className="border p-2 rounded bg-gray-100 w-full mb-3"
            />

            <div className="grid grid-cols-2 gap-3">
              {permissionsList.map((perm: Permission) => (
                <label key={perm.key} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingRole.permissions[perm.key] || false}
                    onChange={() =>
                      setEditingRole({
                        ...editingRole,
                        permissions: {
                          ...editingRole.permissions,
                          [perm.key]:
                            !editingRole.permissions[perm.key],
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
