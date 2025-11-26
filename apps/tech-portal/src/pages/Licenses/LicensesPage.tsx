import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { DataTable } from "../../components/shared/DataTable";
import { Modal } from "../../components/shared/Modal";
import { LicenseForm } from "./LicenseForm";
import { Button } from "../../components/ui/button";
import { MdAdd, MdFilterList } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface License {
  _id: string;
  licenseKey: string;
  licenseType: "customer" | "vendor";
  status: string;
  organizationId: any;
  expiryDate: string;
}

export function LicensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Fetch organizations
  const { data: orgsData } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/organizations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch licenses
  const { data: licensesData, isLoading } = useQuery({
    queryKey: ["licenses", filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("licenseType", filterType);

      const res = await fetch(`${API_URL}/api/v1/tech/licenses?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      if (!res.ok) throw new Error("Failed to fetch licenses");
      const json = await res.json();
      return json.data as License[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/v1/tech/licenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!res.ok) throw new Error("Failed to delete license");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      alert("License deleted successfully!");
    },
  });

  const handleCreate = () => {
    setEditingLicense(null);
    setIsModalOpen(true);
  };

  const handleEdit = (l: License) => {
    setEditingLicense(l);
    setIsModalOpen(true);
  };

  const handleDelete = (l: License) => {
    if (confirm(`Delete license ${l.licenseKey}?`))
      deleteMutation.mutate(l._id);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLicense(null);
  };

  const getOrgName = (id: any) => {
    if (!orgsData) return "Unknown";
    const org = (orgsData as any[]).find(
      (o) => o._id === id || o._id === id?._id
    );
    return org?.name || "Unknown";
  };

  // TABLE COLUMNS (optimized)
  const columns = [
    {
      key: "licenseKey",
      header: "LICENSE KEY",
      render: (l: License) => (
        <div className="font-semibold text-[hsl(var(--foreground))]">{l.licenseKey}</div>
      ),
    },
    {
      key: "organizationId",
      header: "ORGANIZATION",
      render: (l: License) => (
        <span className="text-gray-600 dark:text-gray-300">
          {getOrgName(l.organizationId)}
        </span>
      ),
    },

    // TYPE — NO DROPDOWN (only badge like ERP standard)
    {
      key: "licenseType",
      header: "TYPE",
      render: (l: License) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 
            ${
              l.licenseType === "customer"
                ? "bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-blue-300"
                : "bg-purple-100 text-[hsl(var(--foreground))] font-semibold dark:bg-purple-900/50 ring-purple-300"
            }
          `}
        >
          {l.licenseType}
        </span>
      ),
    },

    // STATUS moved BEFORE ACTIONS
    {
      key: "status",
      header: "STATUS",
      render: (l: License) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ring-1 
            ${
              l.status === "active"
                ? "bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-emerald-300"
                : "bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-red-300"
            }
          `}
        >
          {l.status}
        </span>
      ),
    },

    {
      key: "expiryDate",
      header: "EXPIRES",
      render: (l: License) => {
        const d = new Date(l.expiryDate);
        return <span className="text-[hsl(var(--muted-foreground))]">{d.toLocaleDateString()}</span>;
      },
    },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-6">

      {/* HEADER same as Organizations */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 
                         bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Licenses
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage organization licenses and usage limits
          </p>
        </div>

        <Button onClick={handleCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40">
          <MdAdd className="w-5 h-5" /> Add License
        </Button>
      </div>

      {/* FILTER CARD — exact ERP theme */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
            <MdFilterList className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] 
                       bg-[hsl(var(--card))] text-[hsl(var(--foreground))] 
                       shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] 
                       bg-[hsl(var(--card))] text-[hsl(var(--foreground))] 
                       shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
          >
            <option value="all">All Types</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading licenses...</p>
          </div>
        ) : (
          <div className="p-6">
            <DataTable
              columns={columns}
              data={licensesData || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No licenses found."
            />
          </div>
        )}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingLicense ? "Edit License" : "Create License"}
        size="large"
      >
        <LicenseForm
          license={editingLicense as any}
          organizations={(orgsData as any) || []}
          onSuccess={() => {
            handleClose();
            queryClient.invalidateQueries({ queryKey: ["licenses"] });
          }}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}
