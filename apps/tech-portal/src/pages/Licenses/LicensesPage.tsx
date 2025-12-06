import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "../../components/shared/DataTable";
import { Modal } from "../../components/shared/Modal";
import { LicenseForm } from "./LicenseForm";
import { MdSearch } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface License {
  _id: string;
  licenseKey: string;
  licenseType: "customer" | "vendor";
  status: string;
  organizationName: string;
  expiryDate: string;
  maxUsers: number;
  maxVessels?: number;
  maxItems?: number;
  organizationId: string;
}

export function LicensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orgsData } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/organizations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      return (await res.json()).data || [];
    },
  });

  const { data: licensesData, isLoading } = useQuery({
    queryKey: ["licenses", filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("licenseType", filterType);

      const res = await fetch(`${API_URL}/api/v1/tech/licenses?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      return (await res.json()).data as License[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () =>
      fetch(`${API_URL}/api/v1/tech/licenses/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      }).then((r) => r.json()),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setDeleteId(null);
    },
  });

  const handleEdit = async (row: License) => {
    setIsEditLoading(true);
    setIsModalOpen(true);

    const res = await fetch(`${API_URL}/api/v1/tech/licenses/${row._id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });

    const data = await res.json();
    setEditingLicense(data.data);
    setIsEditLoading(false);
  };

  // 🔍 Apply Filters + Search
  const filteredLicenses = licensesData
    ?.filter((l) =>
      l.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.filter((l) => (filterType === "all" ? true : l.licenseType === filterType))
    ?.filter((l) => (filterStatus === "all" ? true : l.status === filterStatus));

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLicense(null);
  };

  const columns = [
    { key: "licenseKey", header: "License Key" },
    { key: "organizationName", header: "Organization" },
    { key: "licenseType", header: "Type" },
    {
      key: "status",
      header: "Status",
      render: (row: License) => (
        <span
          className={`px-3 py-1 text-xs rounded-full ${
            row.status === "active"
              ? "bg-green-200 text-green-900"
              : "bg-red-200 text-red-900"
          }`}
        >
          {row.status}
        </span>
      ),
    },

    // TYPE — NO DROPDOWN (only badge like ERP standard)
    {
      key: "expiryDate",
      header: "Expires",
      render: (row: License) => new Date(row.expiryDate).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Licenses</h1>
          <p className="text-gray-500">Manage organization licenses</p>
        </div>
        <button
          disabled={isLoading}
          onClick={() => {
            setEditingLicense(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          + Create License
        </button>
      </div>

      {/* Filters Section */}
      {!isLoading && (
        <div className="p-4 bg-white rounded-xl border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search licenses..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-xl border bg-gray-50"
            >
              <option value="all">All Types</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
          <p className="mt-3 text-gray-500">Loading licenses...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={filteredLicenses || []}
          onEdit={handleEdit}
          onDelete={(row) => setDeleteId(row._id)}
          emptyMessage="No licenses found."
        />
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <Modal isOpen={true} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="space-y-6">
            <p className="text-gray-700 text-center">Are you sure you want to delete this license?</p>

            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={
          isEditLoading
            ? "Loading License..."
            : editingLicense
            ? "Edit License"
            : "Create License"
        }
        size="large"
      >
        {isEditLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
        ) : (
          <LicenseForm
            license={editingLicense || undefined}
            organizations={orgsData || []}
            onCancel={handleClose}
            onSuccess={() => {
              handleClose();
              queryClient.invalidateQueries({ queryKey: ["licenses"] });
            }}
          />
        )}
      </Modal>
    </div>
  );
}
