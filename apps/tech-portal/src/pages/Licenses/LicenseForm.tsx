import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function LicenseForm({ license, organizations, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    organizationId: "",
    licenseType: "customer",
    expiryDate: "",
    maxUsers: 10,
    maxVessels: 0,
    maxItems: 0,
  });

  // =====================================
  // ON LOAD (EDIT MODE / CREATE MODE)
  // =====================================
  useEffect(() => {
    if (license) {
      setFormData({
        organizationId: typeof license.organizationId === "object" ? license.organizationId._id : license.organizationId,
        licenseType: license.licenseType || license.organizationType,
        expiryDate: license.expiryDate?.split("T")[0] || "",
        maxUsers: license.maxUsers || 10,
        maxVessels: license.maxVessels ?? 0,
        maxItems: license.maxItems ?? 0,
      });
    } else {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      setFormData(prev => ({
        ...prev,
        expiryDate: future.toISOString().split("T")[0],
      }));
    }
  }, [license]);

  const mutation = useMutation({
    mutationFn: async () => {
      const method = license ? "PUT" : "POST";
      const url = license ? `${API_URL}/api/v1/tech/licenses/${license._id}` : `${API_URL}/api/v1/tech/licenses`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Request failed");
      return res.json();
    },
    onSuccess,
  });

  const selectedOrgName =
    organizations.find((o: any) => o._id === formData.organizationId)?.name || "Unknown";

  // =====================================
  // UI
  // =====================================
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(onSuccess);
      }}
    >
      <div>
        <label className="text-sm font-semibold">Organization *</label>
        {license ? (
          <div className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600">{selectedOrgName}</div>
        ) : (
          <select
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select...</option>
            {organizations.map((o: any) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold">License Type *</label>
        {license ? (
          <div className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600 capitalize">
            {formData.licenseType}
          </div>
        ) : (
          <select
            value={formData.licenseType}
            onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold">Expiry Date *</label>
        <input
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Max Users *</label>
        <input
          type="number"
          value={formData.maxUsers}
          onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {formData.licenseType === "customer" ? (
        <div>
          <label className="text-sm font-semibold">Max Vessels</label>
          <input
            type="number"
            value={formData.maxVessels}
            onChange={(e) => setFormData({ ...formData, maxVessels: Number(e.target.value) })}
            className="w-full p-3 border rounded-lg"
          />
        </div>
      ) : (
        <div>
          <label className="text-sm font-semibold">Max Items</label>
          <input
            type="number"
            value={formData.maxItems}
            onChange={(e) => setFormData({ ...formData, maxItems: Number(e.target.value) })}
            className="w-full p-3 border rounded-lg"
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : license ? "Update License" : "Create License"}
        </button>
      </div>
    </form>
  );
}
