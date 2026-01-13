import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDelete, MdCheck, MdClose as MdCloseIcon } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
export function ModelsPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '', brandId: '' });
    // Fetch brands using React Query
    const { data: brands = [] } = useQuery({
        queryKey: ['admin-brands', 'active'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/brands?status=active');
            if (!response.ok) {
                throw new Error('Failed to fetch brands');
            }
            const data = await response.json();
            return data.data || [];
        },
        staleTime: 300000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
    });
    useEffect(() => {
        fetchModels();
    }, [activeTab]);
    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const status = activeTab === 'active' ? 'active' : 'pending';
            const response = await authenticatedFetch(`/api/v1/admin/models?status=${status}`);
            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }
            const data = await response.json();
            setModels(data.data || []);
        }
        catch (error) {
            showToast(error.message || 'Failed to fetch models', 'error');
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
        setFormData({ name: '', description: '', brandId: '' });
    };
    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast('Model name is required', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/models', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create model');
            }
            showToast('Model created successfully', 'success');
            handleCloseModal();
            fetchModels();
            // Invalidate queries so CreateEnquiryPage refetches (both admin and customer portals)
            queryClient.invalidateQueries({ queryKey: ['models'] });
            queryClient.invalidateQueries({ queryKey: ['customer-models'] });
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); // Refresh brands in case new ones were created
        }
        catch (error) {
            showToast(error.message || 'Failed to create model', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleApprove = async (id) => {
        try {
            const response = await authenticatedFetch(`/api/v1/admin/models/${id}/approve`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve model');
            }
            showToast('Model approved successfully', 'success');
            fetchModels();
            // Invalidate queries so CreateEnquiryPage refetches (both admin and customer portals)
            queryClient.invalidateQueries({ queryKey: ['models'] });
            queryClient.invalidateQueries({ queryKey: ['customer-models'] });
        }
        catch (error) {
            showToast(error.message || 'Failed to approve model', 'error');
        }
    };
    const handleReject = async (id) => {
        try {
            const response = await authenticatedFetch(`/api/v1/admin/models/${id}/reject`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject model');
            }
            showToast('Model rejected successfully', 'success');
            fetchModels();
        }
        catch (error) {
            showToast(error.message || 'Failed to reject model', 'error');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this model?')) {
            return;
        }
        try {
            const response = await authenticatedFetch(`/api/v1/admin/models/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete model');
            }
            showToast('Model deleted successfully', 'success');
            fetchModels();
        }
        catch (error) {
            showToast(error.message || 'Failed to delete model', 'error');
        }
    };
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">All Models</h1>
        </div>
        <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
          <MdAdd className="w-5 h-5"/>
          Add Model
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
                </tr>) : models.length === 0 ? (<tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    {activeTab === 'active'
                ? "No models found in the 'active' tab."
                : "No models found in the 'pending' tab."}
                  </td>
                </tr>) : (models.map((model) => (<tr key={model._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {model.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                      {model.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${model.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {activeTab === 'pending' && (<>
                            <button onClick={() => handleApprove(model._id)} className="text-green-600 hover:text-green-900 dark:hover:text-green-400" title="Approve">
                              <MdCheck className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleReject(model._id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" title="Reject">
                              <MdCloseIcon className="w-5 h-5"/>
                            </button>
                          </>)}
                        <button onClick={() => handleDelete(model._id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" title="Delete">
                          <MdDelete className="w-5 h-5"/>
                        </button>
                      </div>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Model Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Add New Model</h2>
              <button onClick={handleCloseModal} className="text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details for the new model.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Brand (Optional)
                  </label>
                  <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                    <option value="">Select a brand (optional)</option>
                    {brands.map((brand) => (<option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Name
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter model name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Description
                  </label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none" placeholder="Enter model description"/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button onClick={handleCloseModal} className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Adding...' : 'Add Model'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=ModelsPage.js.map