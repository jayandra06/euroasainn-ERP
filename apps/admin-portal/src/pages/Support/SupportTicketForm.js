/**
 * Support Ticket Form Component
 * Professional Admin Portal Design
 */
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MdSave, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function SupportTicketForm({ ticket, onSuccess, onCancel }) {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        subject: ticket?.subject || '',
        description: ticket?.description || '',
        status: ticket?.status || 'open',
        priority: ticket?.priority || 'medium',
        organizationId: ticket?.organizationId || '',
        assignedTo: ticket?.assignedTo || '',
    });
    const [errors, setErrors] = useState({});
    // Fetch organizations for dropdown
    const { data: organizations } = useQuery({
        queryKey: ['organizations-list'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/admin/organizations`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
    });
    useEffect(() => {
        if (ticket) {
            setFormData({
                subject: ticket.subject || '',
                description: ticket.description || '',
                status: ticket.status || 'open',
                priority: ticket.priority || 'medium',
                organizationId: ticket.organizationId || '',
                assignedTo: ticket.assignedTo || '',
            });
        }
    }, [ticket]);
    const createMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await fetch(`${API_URL}/api/v1/admin/support-tickets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        subject: data.subject,
                        description: data.description,
                        status: data.status,
                        priority: data.priority,
                        organizationId: data.organizationId || undefined,
                        assignedTo: data.assignedTo || undefined,
                    }),
                });
                if (!response.ok) {
                    let errorMessage = 'Failed to create ticket';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    }
                    catch (e) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                return response.json();
            }
            catch (error) {
                // Handle network errors
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    throw new Error('Network error: Unable to connect to server. Please check your connection.');
                }
                throw error;
            }
        },
        onSuccess: () => {
            showToast('Support ticket created successfully!', 'success');
            onSuccess();
        },
        onError: (error) => {
            setErrors({ submit: error.message });
            showToast(error.message, 'error');
        },
    });
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await fetch(`${API_URL}/api/v1/admin/support-tickets/${ticket?._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        subject: data.subject,
                        description: data.description,
                        status: data.status,
                        priority: data.priority,
                        organizationId: data.organizationId || undefined,
                        assignedTo: data.assignedTo || undefined,
                    }),
                });
                if (!response.ok) {
                    let errorMessage = 'Failed to update ticket';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    }
                    catch (e) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                return response.json();
            }
            catch (error) {
                // Handle network errors
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    throw new Error('Network error: Unable to connect to server. Please check your connection.');
                }
                throw error;
            }
        },
        onSuccess: () => {
            showToast('Support ticket updated successfully!', 'success');
            onSuccess();
        },
        onError: (error) => {
            setErrors({ submit: error.message });
            showToast(error.message, 'error');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        // Validation
        if (!formData.subject.trim()) {
            setErrors({ subject: 'Subject is required' });
            return;
        }
        if (!formData.description.trim()) {
            setErrors({ description: 'Description is required' });
            return;
        }
        if (formData.description.trim().length < 10) {
            setErrors({ description: 'Description must be at least 10 characters' });
            return;
        }
        if (!formData.status) {
            setErrors({ status: 'Status is required' });
            return;
        }
        if (!formData.priority) {
            setErrors({ priority: 'Priority is required' });
            return;
        }
        if (ticket) {
            updateMutation.mutate(formData);
        }
        else {
            createMutation.mutate(formData);
        }
    };
    const isLoading = createMutation.isPending || updateMutation.isPending;
    return (<form onSubmit={handleSubmit} className="space-y-6">
      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input id="subject" type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.subject ? 'border-red-500' : 'border-[hsl(var(--border))]')} placeholder="Enter ticket subject"/>
        {errors.subject && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.subject}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={5} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all resize-none', errors.description ? 'border-red-500' : 'border-[hsl(var(--border))]')} placeholder="Describe the issue or request in detail..."/>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          Minimum 10 characters required
        </p>
        {errors.description && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.description}</p>}
      </div>

      {/* Organization and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="organizationId" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            Organization (Optional)
          </label>
          <select id="organizationId" value={formData.organizationId} onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })} className="w-full px-4 py-2.5 border-2 border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all">
            <option value="">-- No Organization --</option>
            {organizations?.map((org) => (<option key={org._id} value={org._id}>
                {org.name}
              </option>))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <select id="priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.priority ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {errors.priority && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.priority}</p>}
        </div>
      </div>

      {/* Status and Assigned To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.status ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.status}</p>}
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            Assigned To (Optional)
          </label>
          <input id="assignedTo" type="text" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full px-4 py-2.5 border-2 border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all" placeholder="support@example.com"/>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Email address of the person assigned to this ticket
          </p>
        </div>
      </div>

      {errors.submit && (<div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
          {errors.submit}
        </div>)}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50">
          <MdCancel className="w-4 h-4"/>
          <span>Cancel</span>
        </button>
        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl">
          <MdSave className="w-4 h-4"/>
          <span>{isLoading ? 'Saving...' : ticket ? 'Update' : 'Create'}</span>
        </button>
      </div>
    </form>);
}
//# sourceMappingURL=SupportTicketForm.js.map