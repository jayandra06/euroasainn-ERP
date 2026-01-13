import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { apiFetch } from '../../utils/api';
import { cn } from '../../lib/utils';
import { MdCancel } from 'react-icons/md';
export function LicenseForm({ license, organizations, organizationId: preFilledOrgId, onSuccess, onCancel }) {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        organizationId: '',
        licenseType: 'customer',
        expiryDate: '',
        maxUsers: 10,
        maxVessels: 0,
        maxItems: 0,
        features: [],
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'INR',
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (license) {
            const orgId = typeof license.organizationId === 'object'
                ? license.organizationId._id || license.organizationId
                : license.organizationId;
            setFormData({
                organizationId: orgId || '',
                licenseType: license.licenseType || 'customer',
                expiryDate: license.expiryDate ? new Date(license.expiryDate).toISOString().split('T')[0] : '',
                maxUsers: license.maxUsers || 10,
                maxVessels: license.maxVessels || 0,
                maxItems: license.maxItems || 0,
                features: license.features || [],
                monthlyPrice: license.pricing?.monthlyPrice || 0,
                yearlyPrice: license.pricing?.yearlyPrice || 0,
                currency: license.pricing?.currency || 'INR',
            });
        }
        else {
            // Set default expiry to 1 year from now
            const defaultExpiry = new Date();
            defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
            // Determine license type from organization if pre-filled
            const selectedOrg = organizations.find(org => org._id === preFilledOrgId);
            const orgType = selectedOrg?.type === 'vendor' ? 'vendor' : 'customer';
            setFormData({
                ...formData,
                organizationId: preFilledOrgId || '',
                licenseType: orgType,
                expiryDate: defaultExpiry.toISOString().split('T')[0],
            });
        }
    }, [license, preFilledOrgId, organizations]);
    const createMutation = useMutation({
        mutationFn: async (data) => {
            const url = license
                ? `/api/v1/admin/licenses/${license._id}`
                : `/api/v1/admin/licenses`;
            const method = license ? 'PUT' : 'POST';
            const response = await apiFetch(url, {
                method,
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${license ? 'update' : 'create'} license`);
            }
            return response.json();
        },
        onSuccess: () => {
            showToast(`License ${license ? 'updated' : 'created'} successfully!`, 'success');
            onSuccess();
        },
        onError: (error) => {
            showToast(`Failed to ${license ? 'update' : 'create'} license: ${error.message}`, 'error');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        if (!formData.organizationId) {
            setErrors({ organizationId: 'Organization is required' });
            return;
        }
        if (!formData.expiryDate) {
            setErrors({ expiryDate: 'Expiry date is required' });
            return;
        }
        if (formData.monthlyPrice <= 0 || formData.yearlyPrice <= 0) {
            setErrors({ pricing: 'Monthly and yearly prices must be greater than 0' });
            return;
        }
        const submitData = {
            organizationId: formData.organizationId,
            expiresAt: formData.expiryDate,
            usageLimits: {
                users: formData.maxUsers,
            },
            pricing: {
                monthlyPrice: formData.monthlyPrice,
                yearlyPrice: formData.yearlyPrice,
                currency: formData.currency,
            },
        };
        // Only include vessel/item limits based on license type
        if (formData.licenseType === 'customer') {
            submitData.usageLimits.vessels = formData.maxVessels;
        }
        else {
            submitData.usageLimits.items = formData.maxItems;
        }
        createMutation.mutate(submitData);
    };
    const availableFeatures = [
        'rfq_management',
        'quotation_management',
        'inventory_management',
        'vessel_management',
        'reporting',
        'api_access',
        'advanced_analytics',
    ];
    const handleFeatureToggle = (feature) => {
        setFormData({
            ...formData,
            features: formData.features.includes(feature)
                ? formData.features.filter((f) => f !== feature)
                : [...formData.features, feature],
        });
    };
    const selectedOrg = organizations.find(org => org._id === formData.organizationId);
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="organizationId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Organization <span className="text-red-500">*</span>
        </label>
        <select id="organizationId" value={formData.organizationId} onChange={(e) => {
            const org = organizations.find(o => o._id === e.target.value);
            setFormData({
                ...formData,
                organizationId: e.target.value,
                licenseType: org?.type === 'vendor' ? 'vendor' : 'customer'
            });
        }} required disabled={!!license || !!preFilledOrgId} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all', errors.organizationId ? 'border-red-500' : 'border-gray-300 dark:border-gray-700')}>
          <option value="">Select Organization</option>
          {organizations.map((org) => (<option key={org._id} value={org._id}>
              {org.name} ({org.type})
            </option>))}
        </select>
        {errors.organizationId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organizationId}</p>}
      </div>

      <div>
        <label htmlFor="licenseType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          License Type <span className="text-red-500">*</span>
        </label>
        <select id="licenseType" value={formData.licenseType} onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })} required disabled={!!license} className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      <div>
        <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Expiry Date <span className="text-red-500">*</span>
        </label>
        <input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} required className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all', errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700')}/>
        {errors.expiryDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiryDate}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="maxUsers" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Max Users <span className="text-red-500">*</span>
          </label>
          <input id="maxUsers" type="number" min="1" value={formData.maxUsers} onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })} required className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"/>
        </div>

        {formData.licenseType === 'customer' && (<div>
            <label htmlFor="maxVessels" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Max Vessels
            </label>
            <input id="maxVessels" type="number" min="0" value={formData.maxVessels} onChange={(e) => setFormData({ ...formData, maxVessels: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"/>
          </div>)}

        {formData.licenseType === 'vendor' && (<div>
            <label htmlFor="maxItems" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Max Items
            </label>
            <input id="maxItems" type="number" min="0" value={formData.maxItems} onChange={(e) => setFormData({ ...formData, maxItems: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"/>
          </div>)}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="monthlyPrice" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Monthly Price <span className="text-red-500">*</span>
            </label>
            <input id="monthlyPrice" type="number" min="0" step="0.01" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })} required className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all', errors.pricing ? 'border-red-500' : 'border-gray-300 dark:border-gray-700')}/>
          </div>
          <div>
            <label htmlFor="yearlyPrice" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Yearly Price <span className="text-red-500">*</span>
            </label>
            <input id="yearlyPrice" type="number" min="0" step="0.01" value={formData.yearlyPrice} onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })} required className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all', errors.pricing ? 'border-red-500' : 'border-gray-300 dark:border-gray-700')}/>
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <select id="currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} required className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
        {errors.pricing && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pricing}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button type="button" onClick={onCancel} disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50">
          <MdCancel className="w-4 h-4"/>
          <span>Cancel</span>
        </button>
        <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Saving...' : license ? 'Update License' : 'Create License'}
        </button>
      </div>
    </form>);
}
//# sourceMappingURL=LicenseForm.js.map