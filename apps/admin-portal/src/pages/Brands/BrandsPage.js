import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDelete, MdCheck, MdClose as MdCloseIcon } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
export function BrandsPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '' });
    useEffect(() => {
        fetchBrands();
    }, [activeTab]);
    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            const status = activeTab === 'active' ? 'active' : 'pending';
            const response = await authenticatedFetch(`/api/v1/admin/brands?status=${status}`);
            if (!response.ok) {
                throw new Error('Failed to fetch brands');
            }
            const data = await response.json();
            setBrands(data.data || []);
        }
        catch (error) {
            showToast(error.message || 'Failed to fetch brands', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', description: '' });
    };
    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast('Brand name is required', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/brands', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create brand');
            }
            showToast('Brand created successfully', 'success');
            handleCloseModal();
            fetchBrands();
            // Invalidate queries so CreateEnquiryPage refetches (both admin and customer portals)
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); // For ModelsPage dropdown
            queryClient.invalidateQueries({ queryKey: ['customer-brands'] });
        }
        catch (error) {
            showToast(error.message || 'Failed to create brand', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleApprove = async (id) => {
        try {
            const response = await authenticatedFetch(`/api/v1/admin/brands/${id}/approve`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve brand');
            }
            showToast('Brand approved successfully', 'success');
            fetchBrands();
            // Invalidate queries so CreateEnquiryPage refetches (both admin and customer portals)
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); // For ModelsPage dropdown
            queryClient.invalidateQueries({ queryKey: ['customer-brands'] });
        }
        catch (error) {
            showToast(error.message || 'Failed to approve brand', 'error');
        }
    };
    const handleReject = async (id) => {
        try {
            const response = await authenticatedFetch(`/api/v1/admin/brands/${id}/reject`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject brand');
            }
            showToast('Brand rejected successfully', 'success');
            fetchBrands();
        }
        catch (error) {
            showToast(error.message || 'Failed to reject brand', 'error');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this brand?')) {
            return;
        }
        try {
            const response = await authenticatedFetch(`/api/v1/admin/brands/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete brand');
            }
            showToast('Brand deleted successfully', 'success');
            fetchBrands();
        }
        catch (error) {
            showToast(error.message || 'Failed to delete brand', 'error');
        }
    };
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Manage Brands</h1>
        </div>
        <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
          <MdAdd className="w-5 h-5"/>
          Add Brand
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[hsl(var(--border))]">
        <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active'
            ? 'border-blue-600 text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
          Active
        </button>
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending'
            ? 'border-blue-600 text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
          Pending Approval
        </button>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(var(--secondary))]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[hsl(var(--card))] divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (<tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    Loading...
                  </td>
                </tr>) : brands.length === 0 ? (<tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    {activeTab === 'active'
                ? "No brands found in the 'active' tab."
                : "No brands found in the 'pending' tab."}
                  </td>
                </tr>) : (brands.map((brand) => (<tr key={brand._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {brand.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                      {brand.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${brand.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {brand.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {activeTab === 'pending' && (<>
                            <button onClick={() => handleApprove(brand._id)} className="text-green-600 hover:text-green-900 dark:hover:text-green-400" title="Approve">
                              <MdCheck className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleReject(brand._id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" title="Reject">
                              <MdCloseIcon className="w-5 h-5"/>
                            </button>
                          </>)}
                        <button onClick={() => handleDelete(brand._id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" title="Delete">
                          <MdDelete className="w-5 h-5"/>
                        </button>
                      </div>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Brand Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Add New Brand</h2>
              <button onClick={handleCloseModal} className="text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details for the new brand.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Name
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter brand name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Description
                  </label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none" placeholder="Enter brand description"/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button onClick={handleCloseModal} className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Adding...' : 'Add Brand'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=BrandsPage.js.map