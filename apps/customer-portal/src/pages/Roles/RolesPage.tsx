import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";

const API_URL = "http://localhost:3000/api/v1";

const PORTALS = [{ label: "Customer Portal", value: "customer" }];

const PERMISSION_MAP = {
  customer: [
    "rfqManage",
    "rfqView",
    "vesselsManage",
    "vesselsView",
    "employeesManage",
    "crewManage",
    "crewView",
    "portManage",
    "financeView",
    "financeManage",
    "customerBillingView",
    "customerBillingManage",
    "vendorOrgsManage",
    "vendorOrgsView",
    "customerOrgsManage",
    "claimManage",
    "claimView",
    "licensesIssue",
    "licensesRevoke",
    "documentsUpload",
    "documentsView",
    "shipmentTracking",
  ],
};

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // -----------------------------------------
  // LOAD ROLES FROM BACKEND
  // -----------------------------------------
  const fetchRoles = async () => {
    const res = await fetch(`${API_URL}/roles?portalType=customer`);
    const json = await res.json();
    if (!json.success) return;

    const mapped = json.data.map((r) => ({
      _id: r._id,
      portal: r.portalType,
      name: r.name,
      permissions: Object.fromEntries(
        PERMISSION_MAP.customer.map((p) => [p, r.permissions.includes(p)])
      ),
    }));

    setRoles(mapped);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handlePortalChange = (value) => {
    setPortal(value);
    const perms = {};
    PERMISSION_MAP[value]?.forEach((p) => (perms[p] = false));
    setPermissions(perms);
  };

  // -----------------------------------------
  // CREATE ROLE
  // -----------------------------------------
  const handleAddRole = async () => {
    if (!portal || !roleName.trim()) return;

    const selectedPermissions = Object.keys(permissions).filter((p) => permissions[p]);

    await fetch(`${API_URL}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roleName,
        portalType: "customer",
        permissions: selectedPermissions,
      }),
    });

    setPortal("");
    setRoleName("");
    setPermissions({});
    fetchRoles();
  };

  const deleteRole = async (id) => {
    await fetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
    fetchRoles();
  };

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
      <h1 className="text-2xl font-semibold">Customer Portal Roles</h1>

      {/* CREATE FORM */}
      <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">Create Role</h2>

        <div className="flex gap-4">
          <select
            className="border p-2 rounded w-1/2"
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
            className="border p-2 rounded w-1/2"
            placeholder="Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>

        {portal && (
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(permissions).map((perm) => (
              <label key={perm} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={permissions[perm]}
                  onChange={() =>
                    setPermissions({ ...permissions, [perm]: !permissions[perm] })
                  }
                />
                {perm.replace(/([A-Z])/g, " $1")}
              </label>
            ))}
          </div>
        )}

        <button
          onClick={handleAddRole}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          + Add Role
        </button>
      </div>

      {/* EXISTING ROLES */}
      <div className="bg-white border p-6 rounded-lg shadow-sm">
        <h2 className="font-semibold mb-4">Existing Roles</h2>

        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Portal</th>
              <th className="border p-2">Role Name</th>
              <th className="border p-2">Permissions</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r._id}>
                <td className="border p-2">{r.portal}</td>
                <td className="border p-2">{r.name}</td>
                <td className="border p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(r.permissions)
                      .filter(([_, v]) => v)
                      .map(([p]) => (
                        <div key={p}>• {p.replace(/([A-Z])/g, " $1")}</div>
                      ))}
                  </div>
                </td>
                <td className="border p-2 flex gap-3">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditingRole(r);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <MdEdit size={20} />
                  </button>
                  <button className="text-red-600" onClick={() => deleteRole(r._id)}>
                    <MdDelete size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[400px] space-y-4 relative">
            <button
              className="absolute top-3 right-3"
              onClick={() => setIsEditModalOpen(false)}
            >
              <MdClose size={22} />
            </button>

            <h3 className="text-lg font-semibold">Edit Role Permissions</h3>

            <div className="grid grid-cols-2 gap-3">
              {Object.keys(editingRole.permissions).map((perm) => (
                <label key={perm} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingRole.permissions[perm]}
                    onChange={() =>
                      setEditingRole({
                        ...editingRole,
                        permissions: {
                          ...editingRole.permissions,
                          [perm]: !editingRole.permissions[perm],
                        },
                      })
                    }
                  />
                  {perm.replace(/([A-Z])/g, " $1")}
                </label>
              ))}
            </div>

            <button
              onClick={saveEdit}
              className="bg-blue-600 text-white py-2 rounded w-full"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
