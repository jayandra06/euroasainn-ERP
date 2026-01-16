import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose, MdAdd, MdSecurity, MdCheckCircle, MdSearch } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "react-router-dom";

const PORTALS = [{ label: "Vendor Portal", value: "vendor" }];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const BASE_API_URL = `${API_URL}/api/v1`;
const VENDOR_API_URL = `${API_URL}/api/v1/vendor`;

/* ---------------- AUTH FETCH (SAME AS TECH) ---------------- */
const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    console.error("No access token found in localStorage");
    throw new Error("No access token found");
  }

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Initialize URL params from user data
  useEffect(() => {
    if (user?.organizationId) {
      const params = new URLSearchParams(searchParams);
      if (!params.get("portalType")) {
        params.set("portalType", "vendor");
      }
      if (!params.get("organizationId")) {
        params.set("organizationId", user.organizationId);
      }
      setSearchParams(params, { replace: true });
    }
  }, [user?.organizationId]);

  /* ---------------- FETCH PERMISSIONS ---------------- */
  const fetchPermissions = async () => {
    const res = await authFetch(
      `${BASE_API_URL}/permissions?portalType=vendor`
    );
    const json = await res.json();
    if (json.success) setPermissionsList(json.data);
  };

  /* ---------------- FETCH ROLES ---------------- */
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return;
    if (!user?.organizationId) {
      console.warn("Cannot fetch roles: user or organizationId missing");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        setLoading(false);
        return;
      }

      // Update URL params
      const urlParams = new URLSearchParams(searchParams);
      urlParams.set("portalType", "vendor");
      urlParams.set("organizationId", user.organizationId);
      setSearchParams(urlParams, { replace: true });

      const params = new URLSearchParams({
        portalType: "vendor",
        organizationId: user.organizationId,
      });
      const res = await authFetch(
        `${BASE_API_URL}/roles?${params.toString()}`
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch roles:", res.status, errorText);
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setLoading(false);
      if (!json.success) {
        console.error("API returned error:", json.error);
        return;
      }

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
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      setLoading(false);
    }
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

    setIsCreating(true);
    const selectedPermissions = Object.keys(permissions).filter(
      (p) => permissions[p]
    );

    await authFetch(`${BASE_API_URL}/roles`, {
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
    setIsCreating(false);
    fetchRoles();
  };

  /* ---------------- DELETE ROLE ---------------- */
  const deleteRole = async (id: string) => {
    await authFetch(`${BASE_API_URL}/roles/${id}`, {
      method: "DELETE",
    });
    fetchRoles();
  };

  /* ---------------- UPDATE ROLE ---------------- */
  const saveEdit = async () => {
    if (!editingRole) return;

    try {
      const selectedPermissions = permissionsList
        .filter((p) => editingRole.permissions[p.key])
        .map((p) => p.key);

      const res = await authFetch(`${BASE_API_URL}/roles/${editingRole._id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      const json = await res.json();
      if (!json.success) {
        alert(`Failed to update role: ${json.error || "Unknown error"}`);
        return;
      }

      setIsEditModalOpen(false);
      setEditingRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(`Error updating role: ${error.message || "Unknown error"}`);
    }
  };

  // Filter roles
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.portal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MdSecurity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage roles with specific permissions for Vendor Portal
          </p>
        </div>
      </div>

      {/* CREATE ROLE CARD */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MdAdd className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Role
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Portal
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Manager, Admin, Viewer"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
        </div>

        {portal && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions ({Object.values(permissions).filter(Boolean).length} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                {permissionsList.map((perm: any) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key] || false}
                      onChange={() =>
                        setPermissions((prev) => ({
                          ...prev,
                          [perm.key]: !prev[perm.key],
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={!roleName.trim() || isCreating}
              onClick={handleAddRole}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MdAdd className="w-5 h-5" />
                  Create Role
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* EXISTING ROLES CARD */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* SEARCH BAR */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading roles...</p>
            </div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery ? "No roles found matching your search" : "No roles created yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Portal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRoles.map((r) => {
                    const activePermissions = Object.entries(r.permissions).filter(([_, v]) => v);
                    return (
                      <tr
                        key={r._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400">
                            {r.portal}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {r.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 max-w-xl">
                            {activePermissions.length > 0 ? (
                              (() => {
                                const isExpanded = expandedRoles.has(r._id);
                                const displayCount = isExpanded ? activePermissions.length : Math.min(5, activePermissions.length);
                                const permissionsToShow = activePermissions.slice(0, displayCount);
                                
                                return (
                                  <>
                                    {permissionsToShow.map(([p]) => {
                                      const label = permissionsList.find((x) => x.key === p)?.label;
                                      return (
                                        <span
                                          key={p}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                                        >
                                          <MdCheckCircle className="w-3 h-3" />
                                          {label}
                                        </span>
                                      );
                                    })}
                                    {activePermissions.length > 5 && (
                                      <button
                                        onClick={() => {
                                          setExpandedRoles((prev) => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(r._id)) {
                                              newSet.delete(r._id);
                                            } else {
                                              newSet.add(r._id);
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                                      >
                                        {isExpanded 
                                          ? "Show less" 
                                          : `+${activePermissions.length - 5} more`}
                                      </button>
                                    )}
                                  </>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                No permissions
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activePermissions.length} permission{activePermissions.length !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingRole(JSON.parse(JSON.stringify(r)));
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              title="Edit role"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete the role "${r.name}"? This action cannot be undone.`
                                  )
                                ) {
                                  deleteRole(r._id);
                                }
                              }}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                              title="Delete role"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Edit Role: {editingRole.name}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  disabled
                  value={editingRole.name}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permissions ({Object.values(editingRole.permissions).filter(Boolean).length} selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                  {permissionsList.map((perm: any) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={editingRole.permissions[perm.key] || false}
                        onChange={() =>
                          setEditingRole({
                            ...editingRole,
                            permissions: {
                              ...editingRole.permissions,
                              [perm.key]: !editingRole.permissions[perm.key],
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <MdCheckCircle className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
