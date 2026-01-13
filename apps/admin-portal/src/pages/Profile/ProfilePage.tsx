/**
 * FINAL ProfilePage - Complete with Working Edit & Save (Restricted Fields)
 * - Only Phone & Location are editable for the logged-in user
 * - All core fields (name, email, role, etc.) are read-only
 * - Real PATCH update to backend (/api/v1/admin/users/:id)
 * - Permissions from useAuth()
 * - Beautiful, modern design with hero, stats, security score, etc.
 */

import React, { useState, useEffect } from "react";
import { Modal } from "../../components/shared/Modal";
import {
  MdPerson,
  MdEmail,
  MdSecurity,
  MdAccessTime,
  MdEdit,
  MdCheckCircle,
  MdCancel,
  MdCameraAlt,
  MdLock,
  MdBusiness,
  MdCode,
  MdLocationOn,
  MdPhone,
  MdLanguage,
  MdGppGood,
  MdShield,
  MdErrorOutline,
  MdHistory,
  MdTerminal,
} from "react-icons/md";

import { cn } from "../../lib/utils";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/shared/Toast";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// -------------------------- TYPES --------------------------
interface BackendUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  portalType: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  mfaEnabled?: boolean;
}

interface BackendProfile {
  phone?: string;
  department?: string;
  designation?: string;
  location?: string;
}

interface UserApiResponse {
  success: boolean;
  data: {
    user: BackendUser;
    profile: BackendProfile | null;
  };
  message?: string;
}

interface DisplayProfile {
  firstName: string;
  lastName: string;
  email: string;
  portalType: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  mfaEnabled: boolean;
  organization: string;
  department: string;
  designation: string;
  primaryRoleType: string;
  primaryTechStack: string[];
  environmentAccess: string[];
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  location?: string;
  timeZone: string;
  language: string;
  theme: "light" | "dark" | "system";
}

// -------------------------- MAIN COMPONENT --------------------------
export function ProfilePage() {
  const {
    user: currentUser,
    permissions: authPermissions,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const toast = useToast();

  const [profile, setProfile] = useState<DisplayProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Editable fields
  const [editPhone, setEditPhone] = useState<string>("");
  const [editLocation, setEditLocation] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fallback = {
    organization: "EuroAsian Maritime ERP",
    primaryRoleType: "Staff / Developer",
    primaryTechStack: ["React", "Node.js", "TypeScript", "Tailwind CSS"],
    environmentAccess: ["DEV", "STAGING"],
    mfaEnabled: true,
    timeZone: "IST (UTC+5:30)",
    language: "English (US)",
    theme: "system" as const,
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !currentUser) {
      setError("You must be logged in to view your profile.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No authentication token found");

        if (!currentUser._id) throw new Error("User ID not available");

        const response = await axios.get<UserApiResponse>(
          `${API_URL}/api/v1/admin/users/${currentUser._id}`, // or /tech/users/ if different endpoint
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to load profile");
        }

        const { user, profile: userProfile } = response.data.data;

        const displayProfile: DisplayProfile = {
          firstName: user.firstName || "Unknown",
          lastName: user.lastName || "",
          email: user.email || "Not available",
          portalType: user.portalType || "tech",
          role: user.role || "User",
          permissions: authPermissions || [],
          isActive: user.isActive ?? true,
          mfaEnabled: user.mfaEnabled ?? fallback.mfaEnabled,
          organization: fallback.organization,
          department: userProfile?.department || "Not specified",
          designation: userProfile?.designation || "Not specified",
          primaryRoleType: fallback.primaryRoleType,
          primaryTechStack: fallback.primaryTechStack,
          environmentAccess: fallback.environmentAccess,
          lastLogin: user.lastLogin || "Never",
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
          phone: userProfile?.phone || "",
          location: userProfile?.location || "",
          timeZone: fallback.timeZone,
          language: fallback.language,
          theme: fallback.theme,
        };

        setProfile(displayProfile);
        setEditPhone(displayProfile.phone || "");
        setEditLocation(displayProfile.location || "");
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load your profile. Please check your connection and try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, authPermissions, isAuthenticated, authLoading, toast]);

  const handleSaveChanges = async () => {
    if (!profile || !currentUser?._id) return;

    try {
      setSaving(true);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required");

      const updateData = {
        phone: editPhone.trim() || undefined,
        location: editLocation.trim() || undefined,
      };

      const response = await axios.patch<UserApiResponse>(
        `${API_URL}/api/v1/admin/users/${currentUser._id}`, // or /tech/users/
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Update failed");
      }

      toast.success("Profile updated successfully!");

      // Refresh profile with latest data from server
      const { user, profile: userProfile } = response.data.data;

      setProfile(prev =>
        prev
          ? {
              ...prev,
              phone: userProfile?.phone || prev.phone,
              location: userProfile?.location || prev.location,
              updatedAt: user.updatedAt || prev.updatedAt,
            }
          : null
      );

      setIsEditModalOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save changes";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl text-slate-600 dark:text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-10 text-center shadow-2xl">
          <MdErrorOutline className="mx-auto text-red-500" size={64} />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-6">
            Error Loading Profile
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-gray-100 transition shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HERO SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-2xl font-semibold text-gray-700 dark:text-gray-300">
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{fullName}</h1>
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      Verified
                    </span>
                    {profile.isActive && (
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    {profile.role} • {profile.department}
                  </p>
                </div>
                {profile.designation && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {profile.designation}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <MdEdit size={16} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Primary Tech"
                value={profile.primaryTechStack[0]}
                icon={<MdCode className="text-gray-600 dark:text-gray-400" size={18} />}
              />
              <StatCard
                label="Security Clearance"
                value="Level 3"
                icon={<MdShield className="text-gray-600 dark:text-gray-400" size={18} />}
              />
              <StatCard
                label="Environment Access"
                value={`${profile.environmentAccess.length} Zones`}
                icon={<MdTerminal className="text-gray-600 dark:text-gray-400" size={18} />}
              />
              <StatCard
                label="System Uptime"
                value="99.98%"
                icon={<MdHistory className="text-gray-600 dark:text-gray-400" size={18} />}
              />
            </div>

            {/* Contact & Organizational */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileSection title="Contact Information" icon={<MdPerson className="text-gray-600 dark:text-gray-400" />}>
                <DataField label="Work Email" value={profile.email} copyable />
                <DataField label="Phone" value={profile.phone || "Not provided"} />
                <DataField label="Location" value={profile.location || "Not specified"} />
                <DataField label="Time Zone" value={profile.timeZone} />
                <DataField label="Preferred Language" value={profile.language} />
              </ProfileSection>

              <ProfileSection title="Organizational Structure" icon={<MdBusiness className="text-gray-600 dark:text-gray-400" />}>
                <DataField label="Organization" value={profile.organization} />
                <DataField label="Department" value={profile.department} />
                <DataField label="Designation" value={profile.designation} />
                <DataField label="Portal Type" value={profile.portalType.toUpperCase()} />
                <DataField
                  label="Account Status"
                  value={profile.isActive ? "Active" : "Inactive"}
                  badge={
                    profile.isActive
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                  }
                />
              </ProfileSection>
            </div>

            {/* Access Permissions */}
            <ProfileSection title="Access Permissions" icon={<MdSecurity className="text-gray-600 dark:text-gray-400" />}>
              <div className="flex flex-wrap gap-2">
                {profile.permissions.length > 0 ? (
                  profile.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-3 py-1.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-slate-700"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No permissions loaded.
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permissions managed via RBAC policy. Contact Security team for changes.
                </p>
              </div>
            </ProfileSection>

            {/* Technical Expertise */}
            <ProfileSection title="Technical Expertise" icon={<MdCode className="text-gray-600 dark:text-gray-400" />}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {profile.primaryTechStack.map((tech) => (
                  <div
                    key={tech}
                    className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 text-center"
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{tech}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Environment Access:
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.environmentAccess.map((env) => (
                    <span
                      key={env}
                      className="px-3 py-1 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium"
                    >
                      {env}
                    </span>
                  ))}
                </div>
              </div>
            </ProfileSection>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-gray-900 dark:bg-slate-800 rounded-lg border border-gray-800 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white dark:text-white flex items-center gap-2">
                    <MdGppGood size={18} /> Security Score
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Account health</p>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Excellent</span>
              </div>
              <div className="text-4xl font-bold text-white mb-4">97</div>
              <div className="w-full bg-gray-800 dark:bg-slate-700 rounded-full h-2 mb-4">
                <div className="bg-green-500 w-[97%] h-2 rounded-full" />
              </div>
              <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
                <li className="flex items-center gap-2"><MdCheckCircle className="text-green-400" size={16} /> MFA Enabled</li>
                <li className="flex items-center gap-2"><MdCheckCircle className="text-green-400" size={16} /> Strong Password</li>
                <li className="flex items-center gap-2"><MdCheckCircle className="text-green-400" size={16} /> Normal Activity</li>
              </ul>
            </div>

            <ProfileSection title="Security Controls" icon={<MdLock className="text-gray-600 dark:text-gray-400" />}>
              <div className="space-y-4">
                <ToggleField label="Two-Factor Authentication" enabled={profile.mfaEnabled} />
                <ToggleField label="IP Address Whitelisting" enabled={true} />
                <ToggleField label="Session Timeout Enforcement" enabled={true} />
                <ToggleField label="Biometric Login" enabled={false} />
              </div>
            </ProfileSection>

            <ProfileSection title="Audit Trail" icon={<MdAccessTime className="text-gray-600 dark:text-gray-400" />}>
              <div className="space-y-4">
                <AuditItem label="Account Created" date={profile.createdAt} description="Initial system provisioning" />
                <AuditItem label="Last Profile Update" date={profile.updatedAt} description="Minor details updated" />
                <AuditItem label="Most Recent Login" date={profile.lastLogin} description="From trusted device" />
              </div>
            </ProfileSection>
          </div>
        </div>
      </div>

      {/* EDIT MODAL - Restricted Edit */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Profile Information" size="large">
        <div className="p-8 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              <strong>Note:</strong> Only phone and location can be updated here. Core fields (name, email, role, etc.) are managed by administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Editable fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
              className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className={cn(
                "px-8 py-3 rounded-xl font-semibold shadow-md transition-colors flex items-center gap-2",
                saving
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-gray-100"
              )}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// -------------------------- SUB-COMPONENTS --------------------------
function ProfileSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-slate-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-md">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function DataField({ label, value, copyable, badge }: { label: string; value: string; copyable?: boolean; badge?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      <div className={cn("flex items-center justify-between", copyable && "cursor-pointer group")}>
        <p className={cn("text-sm font-medium text-gray-900 dark:text-gray-100", copyable && "group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors")}>
          {value}
        </p>
        {badge && <span className={cn("px-2 py-0.5 rounded text-xs font-medium", badge)}>{value}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-3">
      <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-md">{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ToggleField({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {enabled ? <MdCheckCircle className="text-green-600 dark:text-green-400" size={18} /> : <MdCancel className="text-gray-400" size={18} />}
    </div>
  );
}

function AuditItem({ label, date, description }: { label: string; date: string; description?: string }) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const formattedTime = new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="border-l border-gray-300 dark:border-slate-700 pl-4 py-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {formattedDate} at {formattedTime}
      </p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>}
    </div>
  );
}