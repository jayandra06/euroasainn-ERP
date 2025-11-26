/**
 * Organization Form Component
 * Professional Admin Portal Design
 */

import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MdSave, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Organization {
  _id?: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
}

interface OrganizationFormProps {
  organization?: Organization | null;
  organizationType: 'customer' | 'vendor';
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrganizationForm({ organization, organizationType, onSuccess, onCancel }: OrganizationFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    isActive: organization?.isActive ?? true,
    adminEmail: '', // Admin email for the organization - invitation will be sent to this email
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!organization) {
      setFormData((prev) => ({
        ...prev,
        isActive: true,
      }));
    }
  }, [organization]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const requestData = {
          name: data.name,
          type: organizationType,
          portalType: organizationType,
          isActive: data.isActive,
          adminEmail: data.adminEmail,
        };

        // Log what we're sending
        console.log('📤 Admin Portal: Sending organization creation request');
        console.log('   Organization Name:', requestData.name);
        console.log('   Organization Type:', requestData.type);

        const response = await fetch(`${API_URL}/api/v1/admin/organizations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to create organization';
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Log the response
        console.log('📥 Admin Portal: Organization creation response:', {
          success: result.success,
          emailSent: result.emailSent,
          emailTo: result.emailTo,
          message: result.message,
        });
        
        return result;
      } catch (error: any) {
        // Handle network errors
        if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          console.error('❌ Network error: Backend server might not be running');
          console.error('   Check if backend is running on http://localhost:3000');
          throw new Error('Network error: Unable to connect to server. Please ensure the backend API is running on port 3000.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.emailSent === false && data.emailError) {
        // Email failed
        showToast(`Organization created, but email failed: ${data.emailError}`, 'warning');
        console.error('❌ Email sending failed:', data.emailError);
      } else if (data.emailSent === true) {
        // Email sent successfully
        showToast(`Organization created! Invitation email sent to ${data.emailTo || formData.adminEmail}`, 'success');
        console.log('✅ Email sent successfully to:', data.emailTo || formData.adminEmail);
      } else if (data.message) {
        // Use server message
        showToast(data.message, 'success');
      } else {
        // Fallback message
        showToast('Organization created successfully!', 'success');
      }
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(error.message, 'error');
      console.error('❌ Organization creation error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/organizations/${organization?._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            name: data.name,
            type: organizationType,
            portalType: organizationType,
            isActive: data.isActive,
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to update organization';
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        return response.json();
      } catch (error: any) {
        // Handle network errors
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to server. Please check your connection.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      showToast('Organization updated successfully!', 'success');
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(error.message, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Organization name is required' });
      return;
    }

    // Validate admin email (required for new organizations)
    if (!organization && !formData.adminEmail.trim()) {
      setErrors({ adminEmail: 'Admin email is required' });
      return;
    }

    // Validate email format
    if (formData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setErrors({ adminEmail: 'Please enter a valid email address' });
      return;
    }

    if (organization) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(
            'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
            errors.name ? 'border-red-500' : 'border-[hsl(var(--border))]'
          )}
          placeholder="Enter organization name"
        />
        {errors.name && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.name}</p>}
      </div>

      {/* Admin Email */}
      {!organization && (
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            Admin Email <span className="text-red-500">*</span>
          </label>
          <input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            className={cn(
              'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
              errors.adminEmail ? 'border-red-500' : 'border-[hsl(var(--border))]'
            )}
            placeholder="Enter email here"
          />
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            An invitation email with login credentials will be sent to this email address
          </p>
          {errors.adminEmail && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.adminEmail}</p>}
        </div>
      )}

      {/* Active Status */}
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 text-[hsl(var(--primary))] border-[hsl(var(--border))] rounded focus:ring-[hsl(var(--primary))]"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Active Organization
        </label>
      </div>

      {errors.submit && (
        <div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <MdSave className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : organization ? 'Update' : 'Create'}</span>
        </button>
      </div>
    </form>
  );
}

