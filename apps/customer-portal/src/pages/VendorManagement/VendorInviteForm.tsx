/**
 * Vendor Invite Form Component
 * Customer Portal Design
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MdSave, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface VendorInviteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function VendorInviteForm({ onSuccess, onCancel }: VendorInviteFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    adminEmail: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const requestData = {
          name: data.name,
          type: 'vendor',
          portalType: 'vendor',
          isActive: true,
          adminEmail: data.adminEmail,
          firstName: data.firstName,
          lastName: data.lastName,
        };

        console.log('📤 Customer Portal: Sending vendor invitation request');
        console.log('   Vendor Name:', requestData.name);
        console.log('   Admin Email:', requestData.adminEmail);

        const response = await fetch(`${API_URL}/api/v1/customer/vendors/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to invite vendor';
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        console.log('📥 Customer Portal: Vendor invitation response:', {
          success: result.success,
          emailSent: result.emailSent,
          emailTo: result.emailTo,
          message: result.message,
        });
        
        return result;
      } catch (error: any) {
        if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          console.error('❌ Network error: Backend server might not be running');
          throw new Error('Network error: Unable to connect to server. Please ensure the backend API is running on port 3000.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.emailSent === false && data.emailError) {
        showToast(`Vendor invited, but email failed: ${data.emailError}`, 'warning');
        console.error('❌ Email sending failed:', data.emailError);
      } else if (data.emailSent === true) {
        showToast(`Vendor invited! Invitation email sent to ${data.emailTo || formData.adminEmail}`, 'success');
        console.log('✅ Email sent successfully to:', data.emailTo || formData.adminEmail);
      } else if (data.message) {
        showToast(data.message, 'success');
      } else {
        showToast('Vendor invited successfully!', 'success');
      }
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(error.message, 'error');
      console.error('❌ Vendor invitation error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Vendor name is required' });
      return;
    }

    if (!formData.adminEmail.trim()) {
      setErrors({ adminEmail: 'Admin email is required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setErrors({ adminEmail: 'Please enter a valid email address' });
      return;
    }

    createMutation.mutate(formData);
  };

  const isLoading = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vendor Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Vendor Name <span className="text-red-500">*</span>
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
          placeholder="Enter vendor organization name"
        />
        {errors.name && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{errors.name}</p>}
      </div>

      {/* Admin First Name */}
      <div>
        <label htmlFor="firstName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Admin First Name
        </label>
        <input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className={cn(
            'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
            'border-[hsl(var(--border))]'
          )}
          placeholder="Enter admin first name"
        />
      </div>

      {/* Admin Last Name */}
      <div>
        <label htmlFor="lastName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Admin Last Name
        </label>
        <input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className={cn(
            'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
            'border-[hsl(var(--border))]'
          )}
          placeholder="Enter admin last name"
        />
      </div>

      {/* Admin Email */}
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
          <span>{isLoading ? 'Sending...' : 'Send Invitation'}</span>
        </button>
      </div>
    </form>
  );
}

