import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdClose, MdAdd, MdSecurity, MdCheckCircle, MdSearch } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "react-router-dom";

const PORTALS = [{ label: "Admin Portal", value: "admin" }];
const API_URL = "http://localhost:3000/api/v1";

/* 🔐 AUTH FETCH (401 FIX) */
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

export function RolesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [portal, setPortal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(false);

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
        params.set("portalType", "admin");
      }
      if (!params.get("organizationId")) {
        params.set("organizationId", user.organizationId);
      }
      setSearchParams(params, { replace: true });
    }
  }, [user?.organizationId]);

  // ⭐ 1️⃣ Load Admin Permissions
  const fetchPermissions = async () => {
    const res = await authFetch(
      `${API_URL}/permissions?portalType=admin`
    );
    const json = await res.json();
    if (json.success) {
      setPermissionsList(json.data);
    }
  };

  // ⭐ 2️⃣ Load Roles
  const fetchRoles = async () => {
    if (permissionsList.length === 0) return;
    if (!user?.organizationId) return;

    setLoading(true);
    
    // Update URL params
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set("portalType", "admin");
    urlParams.set("organizationId", user.organizationId);
    setSearchParams(urlParams, { replace: true });

    const params = new URLSearchParams({
      portalType: "admin",
      organizationId: user.organizationId,
    });
    const res = await authFetch(
      `${API_URL}/roles?${params.toString()}`
    );
    const json = await res.json();
    setLoading(false);

    const parsed = json.data.map((role: any) => ({
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
    if (!roleName.trim() || !portal) return;
    
    setIsCreating(true);
    const selectedPermissions = Object.keys(permissions).filter(
      (p) => permissions[p]
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
    setIsCreating(false);
    fetchRoles();
  };

  // Filter roles
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.portalType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ⭐ Delete Role
  const deleteRole = async (id: string) => {
    await authFetch(`${API_URL}/roles/${id}`, {
      method: "DELETE",
    });
    fetchRoles();
  };

  // ⭐ Save Edit
  const saveEdit = async () => {
    const selectedPermissions = Object.keys(editingRole.permissions).filter(
      (p) => editingRole.permissions[p]
    );

    await authFetch(`${API_URL}/roles/${editingRole._id}`, {
      method: "PUT",
      body: JSON.stringify({ permissions: selectedPermissions }),
    });

    setIsEditModalOpen(false);
    fetchRoles();
  };

  return (
    <div className="p-6 space-y-6 bg-[hsl(var(--background))] min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MdSecurity className="w-8 h-8 text-[hsl(var(--primary))]" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Create and manage roles with specific permissions for Admin Portal
          </p>
        </div>
      </div>

      {/* CREATE ROLE CARD */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MdAdd className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
            Create New Role
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Portal
            </label>
            <select
              value={portal}
              onChange={(e) => {
                setPortal(e.target.value);
                const map: any = {};
                permissionsList.forEach((p) => (map[p.key] = false));
                setPermissions(map);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
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
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Role Name
            </label>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Manager, Admin, Viewer"
              className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
            />
          </div>
        </div>

        {portal && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                Permissions ({Object.values(permissions).filter(Boolean).length} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))]">
                {permissionsList.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key] || false}
                      onChange={() =>
                        setPermissions({
                          ...permissions,
                          [perm.key]: !permissions[perm.key],
                        })
                      }
                      className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] cursor-pointer"
                    />
                    <span className="text-sm text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              disabled={!roleName.trim() || isCreating}
              onClick={handleAddRole}
              className="px-6 py-2.5 bg-[hsl(var(--primary))] text-white font-medium rounded-lg hover:bg-[hsl(var(--primary))]/90 disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden">
        {/* SEARCH BAR */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <div className="relative max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
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
              <div className="w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading roles...</p>
            </div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {searchQuery ? "No roles found matching your search" : "No roles created yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                      Portal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                      Permissions ({Object.values(filteredRoles[0]?.permissions || {}).filter(Boolean).length} total)
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {filteredRoles.map((r) => {
                    const activePermissions = Object.entries(r.permissions).filter(([_, v]) => v);
                    return (
                      <tr
                        key={r._id}
                        className="hover:bg-[hsl(var(--muted))] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            {r.portalType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[hsl(var(--foreground))]">
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
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400"
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
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/20 transition-colors cursor-pointer"
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
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                No permissions
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            {activePermissions.length} permission{activePermissions.length !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingRole(r);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/20 transition-colors"
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
                              className="p-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors"
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
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <MdEdit className="w-5 h-5 text-[hsl(var(--primary))]" />
                  Edit Role: {editingRole.name}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <MdClose className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Role Name
                </label>
                <input
                  disabled
                  value={editingRole.name}
                  className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                  Permissions ({Object.values(editingRole.permissions).filter(Boolean).length} selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))]">
                  {permissionsList.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors group"
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
                        className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] cursor-pointer"
                      />
                      <span className="text-sm text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[hsl(var(--border))] flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 transition-colors font-medium flex items-center justify-center gap-2"
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
