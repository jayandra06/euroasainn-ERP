// src/pages/vendor/RolesPage.tsx
import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";

const PORTALS = [{ label: "Vendor Portal", value: "vendor" }];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]); // ⭐ backend permissions

  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  // ⭐ 1️⃣ Fetch vendor permissions from backend
  const fetchPermissions = async () => {
    const res = await fetch(`${API_URL}/permissions?portalType=vendor`);
    const json = await res.json();

    if (json.success) {
      setPermissionsList(json.data); // [{key,label}]
    }
  };

  // ⭐ 2️⃣ Fetch vendor roles
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return; // wait until permissions loaded

    setLoading(true);
    const res = await fetch(`${API_URL}/roles?portalType=vendor`);
    const json = await res.json();
    setLoading(false);

    if (!json.success) return;

    const mapped = json.data.map((role: any) => ({
      ...role,
      permissions: Object.fromEntries(
        permissionsList.map((p: any) => [p.key, role.permissions.includes(p.key)])
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

  // ⭐ On portal selection (create form)
  const handlePortalChange = (value: string) => {
    setPortal(value);

    const map: Record<string, boolean> = {};
    permissionsList.forEach((p) => (map[p.key] = false));
    setPermissions(map);
  };

  // ⭐ Create role
  const handleAddRole = async () => {
    if (!portal || !roleName.trim()) return;

    const selectedPermissions = Object.keys(permissions).filter(
      (p) => permissions[p]
    );

    await fetch(`${API_URL}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roleName,
        portalType: "vendor",
        permissions: selectedPermissions,
      }),
    });

    setPortal("");
    setRoleName("");
    setPermissions({});
    fetchRoles();
  };

  // ⭐ Delete role
  const deleteRole = async (id: string) => {
    await fetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
    fetchRoles();
  };

  // ⭐ Save edit modal
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
      <h1 className="text-2xl font-semibold">Vendor Roles & Permissions</h1>

      {/* CREATE ROLE */}
      <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4 w-full">
        <h2 className="font-semibold text-lg">Create Vendor Role</h2>

        <div className="flex gap-4">
          <select
            className="border rounded-lg p-2 w-1/2"
            value={portal}
            onChange={(e) => handlePortalChange(e.target.value)}
          >
            <option value="">Select Portal</option>
            {PORTALS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <input
            className="border rounded-lg p-2 w-1/2"
            placeholder="Role Name"
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={handleAddRole}
        >
          + Add Role
        </button>
      </div>

      {/* EXISTING ROLES */}
      <div className="bg-white border p-6 rounded-lg shadow-sm w-full">
        <h2 className="font-semibold mb-4">Existing Vendor Roles</h2>

        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 w-[15%]">Portal</th>
              <th className="border p-2 w-[15%]">Role Name</th>
              <th className="border p-2 w-[60%]">Permissions</th>
              <th className="border p-2 w-[10%] text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="border p-2">{r.portalType}</td>
                <td className="border p-2">{r.name}</td>

                <td className="border p-2 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(r.permissions)
                      .filter(([_, v]) => v)
                      .map(([key]) => (
                        <div key={key}>
                          • {permissionsList.find((x) => x.key === key)?.label}
                        </div>
                      ))}
                  </div>
                </td>

                <td className="border p-2 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="hover:bg-blue-100 p-1 rounded"
                      onClick={() => {
                        setEditingRole(r);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <MdEdit size={20} className="text-blue-600" />
                    </button>

                    <button
                      className="hover:bg-red-100 p-1 rounded"
                      onClick={() => deleteRole(r._id)}
                    >
                      <MdDelete size={20} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-3 text-gray-500 border">
                  No vendor roles found. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl relative space-y-4">
            <button
              className="absolute right-3 top-3"
              onClick={() => setIsEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h2 className="text-lg font-semibold">Edit Vendor Role</h2>

            <input
              disabled
              value={editingRole.name}
              className="border p-2 rounded w-full bg-gray-100"
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
              className="bg-blue-600 text-white w-full py-2 rounded-lg"
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
