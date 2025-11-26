import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface License {
  _id: string;
  licenseKey: string;
  licenseType: 'customer' | 'vendor';
  status: string;
  organizationId: string;
  expiryDate: string;
  maxUsers: number;
  maxVessels?: number;
  maxItems?: number;
  features?: string[];
}

interface Organization {
  _id: string;
  name: string;
  type: string;
  portalType: string;
}

interface LicenseFormProps {
  license?: License;
  organizations: Organization[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function LicenseForm({ license, organizations, organizationId: preFilledOrgId, onSuccess, onCancel }: LicenseFormProps) {
  const [formData, setFormData] = useState({
    organizationId: '',
    licenseType: 'customer' as 'customer' | 'vendor',
    expiryDate: '',
    maxUsers: 10,
    maxVessels: 0,
    maxItems: 0,
    features: [] as string[],
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'INR',
  });

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
        monthlyPrice: (license as any).pricing?.monthlyPrice || 0,
        yearlyPrice: (license as any).pricing?.yearlyPrice || 0,
        currency: (license as any).pricing?.currency || 'INR',
      });
    } else {
      // Set default expiry to 1 year from now
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      setFormData({
        ...formData,
        organizationId: preFilledOrgId || '',
        expiryDate: defaultExpiry.toISOString().split('T')[0],
      });
    }
  }, [license, preFilledOrgId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = license
        ? `${API_URL}/api/v1/tech/licenses/${license._id}`
        : `${API_URL}/api/v1/tech/licenses`;
      const method = license ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${license ? 'update' : 'create'} license`);
      }
      return response.json();
    },
    onSuccess: () => {
      alert(`License ${license ? 'updated' : 'created'} successfully!`);
      onSuccess();
    },
    onError: (error: Error) => {
      alert(`Failed to ${license ? 'update' : 'create'} license: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
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
    } else {
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

  const handleFeatureToggle = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(feature)
        ? formData.features.filter((f) => f !== feature)
        : [...formData.features, feature],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="license-form">
      <div className="form-group">
        <label htmlFor="organizationId">Organization *</label>
        <select
          id="organizationId"
          value={formData.organizationId}
          onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
          required
          disabled={!!license}
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org._id} value={org._id}>
              {org.name} ({org.type})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="licenseType">License Type *</label>
        <select
          id="licenseType"
          value={formData.licenseType}
          onChange={(e) => setFormData({ ...formData, licenseType: e.target.value as 'customer' | 'vendor' })}
          required
          disabled={!!license}
        >
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="expiryDate">Expiry Date *</label>
        <input
          id="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="maxUsers">Max Users *</label>
          <input
            id="maxUsers"
            type="number"
            min="1"
            value={formData.maxUsers}
            onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        {formData.licenseType === 'customer' && (
          <div className="form-group">
            <label htmlFor="maxVessels">Max Vessels</label>
            <input
              id="maxVessels"
              type="number"
              min="0"
              value={formData.maxVessels}
              onChange={(e) => setFormData({ ...formData, maxVessels: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}

        {formData.licenseType === 'vendor' && (
          <div className="form-group">
            <label htmlFor="maxItems">Max Items</label>
            <input
              id="maxItems"
              type="number"
              min="0"
              value={formData.maxItems}
              onChange={(e) => setFormData({ ...formData, maxItems: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Features</label>
        <div className="features-grid">
          {availableFeatures.map((feature) => (
            <label key={feature} className="feature-checkbox">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
              />
              <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Pricing Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="monthlyPrice">Monthly Price *</label>
            <input
              id="monthlyPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.monthlyPrice}
              onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="yearlyPrice">Yearly Price *</label>
            <input
              id="yearlyPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.yearlyPrice}
              onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="currency">Currency *</label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              required
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-button">
          Cancel
        </button>
        <button
          type="submit"
          className="submit-button"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving...' : license ? 'Update License' : 'Create License'}
        </button>
      </div>
    </form>
  );
}

