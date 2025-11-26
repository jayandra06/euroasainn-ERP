import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// =======================
// Types
// =======================
interface Organization {
  _id: string;
  name: string;
}


export interface License {
  _id?: string;
  organizationId: string | { _id: string };    // backend allowance
  licenseType: "customer" | "vendor";
  expiryDate: string;
  maxUsers: number;
  maxVessels?: number;
  maxItems?: number;
  features: string[];
}


interface LicenseFormState {
  organizationId: string;
  licenseType: "customer" | "vendor";
  expiryDate: string;
  maxUsers: number;
  maxVessels: number;
  maxItems: number;
  features: string[];
}

interface LicenseFormProps {
  license?: License;
  organizations: Organization[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function LicenseForm({
  license,
  organizations,
  onSuccess,
  onCancel,
}: LicenseFormProps) {
  // =====================================
  // FORM STATE
  // =====================================
  const [formData, setFormData] = useState<LicenseFormState>({
    organizationId: "",
    licenseType: "customer",
    expiryDate: "",
    maxUsers: 10,
    maxVessels: 0,
    maxItems: 0,
    features: [],
  });

  // =====================================
  // ON LOAD (EDIT MODE / CREATE MODE)
  // =====================================
  useEffect(() => {
    if (license) {
      const orgId =
        typeof license.organizationId === "object"
          ? license.organizationId._id
          : license.organizationId;

      setFormData({
        organizationId: orgId,
        licenseType: license.licenseType,
        expiryDate: license.expiryDate
          ? new Date(license.expiryDate).toISOString().split("T")[0]
          : "",
        maxUsers: license.maxUsers ?? 10,
        maxVessels: license.maxVessels ?? 0,
        maxItems: license.maxItems ?? 0,
        features: license.features ?? [],
      });
    } else {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);

      setFormData((prev) => ({
        ...prev,
        expiryDate: d.toISOString().split("T")[0],
      }));
    }
  }, [license]);

  // =====================================
  // MUTATION (CREATE + UPDATE)
  // =====================================
  const mutation = useMutation({
    mutationFn: async (data: LicenseFormState) => {
      const url = license
        ? `${API_URL}/api/v1/tech/licenses/${license._id}`
        : `${API_URL}/api/v1/tech/licenses`;

      const method = license ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");

      return json;
    },

    onSuccess: () => {
      alert(license ? "License updated!" : "License created!");
      onSuccess();
    },

    onError: (err: Error) => alert(err.message),
  });

  // =====================================
  // SUBMIT HANDLER
  // =====================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: LicenseFormState = { ...formData };

    if (payload.licenseType === "customer") payload.maxItems = 0;
    if (payload.licenseType === "vendor") payload.maxVessels = 0;

    mutation.mutate(payload);
  };

  // =====================================
  // FEATURE LIST
  // =====================================
  const featureList: string[] = [
    "rfq_management",
    "quotation_management",
    "inventory_management",
    "vessel_management",
    "reporting",
    "api_access",
    "advanced_analytics",
  ];

  const toggleFeature = (f: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  };

  // =====================================
  // UI
  // =====================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))]">
      <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
        {license ? "Edit License" : "Create License"}
      </h2>

      {/* Organization */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Organization *</label>
        <select
          disabled={!!license}
          value={formData.organizationId}
          onChange={(e) =>
            setFormData({ ...formData, organizationId: e.target.value })
          }
          className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
          required
        >
          <option value="">Select Organization</option>
          {organizations.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* License Type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[hsl(var(--foreground))]">License Type *</label>
        <select
          disabled={!!license}
          value={formData.licenseType}
          onChange={(e) =>
            setFormData({
              ...formData,
              licenseType: e.target.value as "customer" | "vendor",
            })
          }
          className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
        >
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      {/* Expiry */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Expiry Date *</label>
        <input
          type="date"
          value={formData.expiryDate}
          onChange={(e) =>
            setFormData({ ...formData, expiryDate: e.target.value })
          }
          className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
        />
      </div>

      {/* Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Max Users */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Max Users *</label>
          <input
            type="number"
            min="1"
            value={formData.maxUsers}
            onChange={(e) =>
              setFormData({ ...formData, maxUsers: Number(e.target.value) })
            }
            className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
          />
        </div>

        {/* Max Vessels (Customer only) */}
        {formData.licenseType === "customer" && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Max Vessels</label>
            <input
              type="number"
              value={formData.maxVessels}
              onChange={(e) =>
                setFormData({ ...formData, maxVessels: Number(e.target.value) })
              }
              className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
            />
          </div>
        )}

        {/* Max Items (Vendor only) */}
        {formData.licenseType === "vendor" && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Max Items</label>
            <input
              type="number"
              value={formData.maxItems}
              onChange={(e) =>
                setFormData({ ...formData, maxItems: Number(e.target.value) })
              }
              className="w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] p-2 rounded border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[hsl(var(--foreground))]">Features</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {featureList.map((f) => (
            <label
              key={f}
              className="flex items-center gap-2 p-2 bg-[hsl(var(--secondary))] rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.features.includes(f)}
                onChange={() => toggleFeature(f)}
                className="w-4 h-4 text-[hsl(var(--primary))] border-[hsl(var(--border))] rounded focus:ring-[hsl(var(--primary))] focus:ring-2"
              />
              {f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--muted))] rounded text-[hsl(var(--foreground))] font-medium transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending
            ? "Saving..."
            : license
            ? "Update License"
            : "Create License"}
        </button>
      </div>
    </form>
  );
}