/**
 * Organization Form Component
 * Professional Tech Portal Design
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';
import { apiFetch } from '../../utils/api';

interface Organization {
  _id?: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
}

interface OrganizationFormProps {
  organization?: Organization | null;
  organizationType?: 'customer' | 'vendor';
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrganizationForm({ organization, organizationType, onSuccess, onCancel }: OrganizationFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    type: organization?.type || organizationType || 'customer',
    portalType: organization?.portalType || organizationType || 'customer',
    isActive: organization?.isActive ?? true,
    adminEmail: '', // Admin email for the organization
    firstName: '', // Admin first name
    lastName: '', // Admin last name
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Determine portal type based on organization type
      const portalType = data.type === 'customer' ? 'customer' : 'vendor';
      
      const submitData = {
        name: data.name,
        type: data.type,
        portalType: portalType,
        adminEmail: data.adminEmail, // This will trigger email sending in createOrganization
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      };

      // Log what we're sending for debugging
      console.log('📤 Sending organization creation request:');
      console.log('   Organization Name:', submitData.name);
      console.log('   Organization Type:', submitData.type);
      console.log('   ⭐ Admin Email (will receive invitation):', submitData.adminEmail);
      console.log('   First Name:', submitData.firstName);
      console.log('   Last Name:', submitData.lastName);
      
      // Verify the email is being sent
      if (!submitData.adminEmail) {
        console.error('❌ WARNING: Admin email is missing! Email will not be sent.');
      } else {
        console.log(`✅ Admin email provided: ${submitData.adminEmail} - invitation will be sent to this address`);
      }

      const response = await apiFetch('/api/v1/tech/organizations', {
        method: 'POST',
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }
      const result = await response.json();
      
      // Log the response
      console.log('📥 Organization creation response:', {
        success: result.success,
        emailSent: result.emailSent,
        emailTo: result.emailTo,
        message: result.message,
      });
      
      return result;
    },
    onSuccess: (data) => {
      if (data.emailSent === false && data.emailError) {
        // Email failed
        showToast(`Organization created, but email failed to send to ${data.emailTo}: ${data.emailError}`, 'warning');
        console.error('❌ Email sending failed:', data.emailError);
      } else if (data.emailSent === true) {
        // Email sent successfully
        showToast(`Organization created successfully! Invitation email has been sent to ${data.emailTo || formData.adminEmail}.`, 'success');
        console.log('✅ Email sent successfully to:', data.emailTo || formData.adminEmail);
      } else if (data.message) {
        // Use server message
        showToast(data.message, 'success');
      } else {
        // Fallback message
        showToast('Organization created successfully! Invitation email has been sent to the admin.', 'success');
      }
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(`Failed to create organization: ${error.message}`, 'error');
      console.error('❌ Organization creation error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Organization name is required' });
      return;
    }

    // Validate admin information is required for new organizations
    if (!organization) {
      if (!formData.firstName.trim()) {
        setErrors({ firstName: 'Admin first name is required' });
        return;
      }
      if (!formData.lastName.trim()) {
        setErrors({ lastName: 'Admin last name is required' });
        return;
      }
      if (!formData.adminEmail.trim()) {
        setErrors({ adminEmail: 'Admin email is required' });
        return;
      }
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        setErrors({ adminEmail: 'Please enter a valid email address' });
        return;
      }
    }

    // Create organization with admin invitation
    createMutation.mutate(formData);
  };

  const isLoading = createMutation.isPending;

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
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      {/* Admin Information */}
      {!organization && (
        <>
          {/* Admin First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Admin First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className={cn(
                'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
                errors.firstName ? 'border-red-500' : 'border-[hsl(var(--border))]'
              )}
              placeholder="John"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
          </div>

          {/* Admin Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Admin Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className={cn(
                'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
                errors.lastName ? 'border-red-500' : 'border-[hsl(var(--border))]'
              )}
              placeholder="Doe"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
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
              required
              className={cn(
                'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
                errors.adminEmail ? 'border-red-500' : 'border-[hsl(var(--border))]'
              )}
              placeholder="admin@organization.com"
            />
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              An email will be sent to this address with onboarding form link and temporary login credentials
            </p>
            {errors.adminEmail && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.adminEmail}</p>}
          </div>
        </>
      )}

      {/* Portal Type */}
      <div>
        <label htmlFor="portalType" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Portal Type
        </label>
        <select
          id="portalType"
          value={formData.portalType}
          onChange={(e) => {
            const newPortalType = e.target.value;
            setFormData({ ...formData, portalType: newPortalType, type: newPortalType });
          }}
          className="w-full px-4 py-2.5 border-2 border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
        >
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

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
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {createMutation.isPending ? 'Creating Organization...' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
}

