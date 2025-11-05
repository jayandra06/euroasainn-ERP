/**
 * Vendor Onboarding Form Page
 * Public page accessible via invitation token
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface FormData {
  companyName: string;
  contactPerson: string;
  email: string;
  mobileCountryCode: string;
  mobilePhone: string;
  deskCountryCode: string;
  deskPhone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  taxId: string;
  warehouseAddress: string;
  managingDirector: string;
  managingDirectorEmail: string;
  managingDirectorPhone: string;
  managingDirectorDeskPhone: string;
  port: string;
  salesManager: string;
  salesManagerEmail: string;
  salesManagerPhone: string;
  salesManagerDeskPhone: string;
  logisticService: string;
  accountName: string;
  bankName: string;
  iban: string;
  swift: string;
  invoiceEmail: string;
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingProvince: string;
  billingPostal: string;
  billingCountry: string;
  brands: string[];
  categories: string[];
  models: string[];
}

export function VendorOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    mobileCountryCode: '+31',
    mobilePhone: '',
    deskCountryCode: '+31',
    deskPhone: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    taxId: '',
    warehouseAddress: '',
    managingDirector: '',
    managingDirectorEmail: '',
    managingDirectorPhone: '',
    managingDirectorDeskPhone: '',
    port: '',
    salesManager: '',
    salesManagerEmail: '',
    salesManagerPhone: '',
    salesManagerDeskPhone: '',
    logisticService: '',
    accountName: '',
    bankName: '',
    iban: '',
    swift: '',
    invoiceEmail: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingProvince: '',
    billingPostal: '',
    billingCountry: '',
    brands: [],
    categories: [],
    models: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      return;
    }

    // Fetch invitation data
    fetch(`${API_URL}/api/v1/onboarding/invitation?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvitationData(data.data);
          setFormData((prev) => ({
            ...prev,
            email: data.data.email,
          }));
        } else {
          toast.error(data.error || 'Invalid invitation token');
        }
      })
      .catch((error) => {
        toast.error('Failed to load invitation');
        console.error(error);
      });

    // TODO: Fetch available brands, categories, models from API
    // For now, using empty arrays
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectBrand = (value: string) => {
    if (!formData.brands.includes(value)) {
      setFormData((prev) => ({ ...prev, brands: [...prev.brands, value] }));
      setErrors((prev) => ({ ...prev, brands: '' }));
    }
  };

  const handleSelectCategory = (value: string) => {
    if (!formData.categories.includes(value)) {
      setFormData((prev) => ({ ...prev, categories: [...prev.categories, value] }));
      setErrors((prev) => ({ ...prev, categories: '' }));
    }
  };

  const handleSelectModel = (value: string) => {
    if (!formData.models.includes(value)) {
      setFormData((prev) => ({ ...prev, models: [...prev.models, value] }));
      setErrors((prev) => ({ ...prev, models: '' }));
    }
  };

  const removeBrand = (index: number) => {
    setFormData((prev) => ({ ...prev, brands: prev.brands.filter((_, i) => i !== index) }));
  };

  const removeCategory = (index: number) => {
    setFormData((prev) => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  };

  const removeModel = (index: number) => {
    setFormData((prev) => ({ ...prev, models: prev.models.filter((_, i) => i !== index) }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.mobilePhone.trim()) newErrors.mobilePhone = 'Mobile phone is required';
    if (!formData.deskPhone.trim()) newErrors.deskPhone = 'Desk phone is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.taxId.trim()) newErrors.taxId = 'Tax ID is required';
    if (!formData.warehouseAddress.trim()) newErrors.warehouseAddress = 'Warehouse address is required';
    if (!formData.managingDirector.trim()) newErrors.managingDirector = 'Managing director is required';
    if (!formData.managingDirectorEmail.trim()) newErrors.managingDirectorEmail = 'Managing director email is required';
    if (!formData.managingDirectorPhone.trim()) newErrors.managingDirectorPhone = 'Managing director phone is required';
    if (!formData.managingDirectorDeskPhone.trim()) newErrors.managingDirectorDeskPhone = 'Managing director desk phone is required';
    if (!formData.port.trim()) newErrors.port = 'Port is required';
    if (!formData.salesManager.trim()) newErrors.salesManager = 'Sales manager is required';
    if (!formData.salesManagerEmail.trim()) newErrors.salesManagerEmail = 'Sales manager email is required';
    if (!formData.salesManagerPhone.trim()) newErrors.salesManagerPhone = 'Sales manager phone is required';
    if (!formData.salesManagerDeskPhone.trim()) newErrors.salesManagerDeskPhone = 'Sales manager desk phone is required';
    if (!formData.logisticService.trim()) newErrors.logisticService = 'Logistic service is required';
    if (formData.brands.length === 0) newErrors.brands = 'At least one brand is required';
    if (formData.categories.length === 0) newErrors.categories = 'At least one category is required';
    if (formData.models.length === 0) newErrors.models = 'At least one model is required';
    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.iban.trim()) newErrors.iban = 'IBAN is required';
    if (!formData.invoiceEmail.trim()) newErrors.invoiceEmail = 'Invoice email is required';
    if (!formData.billingAddress1.trim()) newErrors.billingAddress1 = 'Billing address is required';
    if (!formData.billingCity.trim()) newErrors.billingCity = 'Billing city is required';
    if (!formData.billingProvince.trim()) newErrors.billingProvince = 'Billing province is required';
    if (!formData.billingPostal.trim()) newErrors.billingPostal = 'Billing postal code is required';
    if (!formData.billingCountry.trim()) newErrors.billingCountry = 'Billing country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!token) {
      toast.error('Invalid invitation token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/onboarding/vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Onboarding completed successfully!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to submit onboarding');
      }
    } catch (error: any) {
      toast.error('Failed to submit onboarding');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Invalid invitation link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Vendor Onboarding – Euroasiann ERP
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your vendor organization onboarding to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vendor Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Vendor Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.companyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.contactPerson ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.contactPerson && <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>}
                </div>
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Phone Numbers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="mobileCountryCode"
                      value={formData.mobileCountryCode}
                      onChange={handleChange}
                      className="w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    >
                      <option value="+31">🇳🇱 +31 (NL)</option>
                      <option value="+91">🇮🇳 +91 (IN)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+65">🇸🇬 +65 (SG)</option>
                    </select>
                    <input
                      type="tel"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      className={cn(
                        'flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        errors.mobilePhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      )}
                      required
                    />
                  </div>
                  {errors.mobilePhone && <p className="mt-1 text-sm text-red-600">{errors.mobilePhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Desk Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="deskCountryCode"
                      value={formData.deskCountryCode}
                      onChange={handleChange}
                      className="w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    >
                      <option value="+31">🇳🇱 +31 (NL)</option>
                      <option value="+91">🇮🇳 +91 (IN)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+65">🇸🇬 +65 (SG)</option>
                    </select>
                    <input
                      type="tel"
                      name="deskPhone"
                      value={formData.deskPhone}
                      onChange={handleChange}
                      className={cn(
                        'flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        errors.deskPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      )}
                      required
                    />
                  </div>
                  {errors.deskPhone && <p className="mt-1 text-sm text-red-600">{errors.deskPhone}</p>}
                </div>
              </div>
            </div>

            {/* Brands, Categories, Models */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Product Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brands */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.brands.map((brand, i) => (
                      <div
                        key={i}
                        className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1"
                      >
                        {brand}
                        <button
                          type="button"
                          onClick={() => removeBrand(i)}
                          className="ml-1 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Brands <span className="text-red-500">*</span>
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectBrand(e.target.value);
                      e.target.value = '';
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.brands ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    <option value="">Select Brand</option>
                    {availableBrands.map((brand, i) => (
                      <option key={i} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  {errors.brands && <p className="mt-1 text-sm text-red-600">{errors.brands}</p>}
                </div>

                {/* Categories */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.categories.map((category, i) => (
                      <div
                        key={i}
                        className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(i)}
                          className="ml-1 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Categories <span className="text-red-500">*</span>
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectCategory(e.target.value);
                      e.target.value = '';
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.categories ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    <option value="">Select Category</option>
                    {availableCategories.map((category, i) => (
                      <option key={i} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.categories && <p className="mt-1 text-sm text-red-600">{errors.categories}</p>}
                </div>

                {/* Models */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.models.map((model, i) => (
                      <div
                        key={i}
                        className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1"
                      >
                        {model}
                        <button
                          type="button"
                          onClick={() => removeModel(i)}
                          className="ml-1 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Models <span className="text-red-500">*</span>
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectModel(e.target.value);
                      e.target.value = '';
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.models ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    <option value="">Select Model</option>
                    {availableModels.map((model, i) => (
                      <option key={i} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {errors.models && <p className="mt-1 text-sm text-red-600">{errors.models}</p>}
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tax ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.taxId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="warehouseAddress"
                    value={formData.warehouseAddress}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.warehouseAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.warehouseAddress && <p className="mt-1 text-sm text-red-600">{errors.warehouseAddress}</p>}
                </div>
              </div>
            </div>

            {/* Managing Director Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Managing Director Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Managing Director <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="managingDirector"
                    value={formData.managingDirector}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.managingDirector ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.managingDirector && <p className="mt-1 text-sm text-red-600">{errors.managingDirector}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Managing Director Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="managingDirectorEmail"
                    value={formData.managingDirectorEmail}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.managingDirectorEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.managingDirectorEmail && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Managing Director Personal Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="managingDirectorPhone"
                    value={formData.managingDirectorPhone}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.managingDirectorPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.managingDirectorPhone && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Managing Director Desk Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="managingDirectorDeskPhone"
                    value={formData.managingDirectorDeskPhone}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.managingDirectorDeskPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.managingDirectorDeskPhone && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorDeskPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.port ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.port && <p className="mt-1 text-sm text-red-600">{errors.port}</p>}
                </div>
              </div>
            </div>

            {/* Sales Manager Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Sales Manager Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Manager Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="salesManager"
                    value={formData.salesManager}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.salesManager ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.salesManager && <p className="mt-1 text-sm text-red-600">{errors.salesManager}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Manager Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="salesManagerEmail"
                    value={formData.salesManagerEmail}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.salesManagerEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.salesManagerEmail && <p className="mt-1 text-sm text-red-600">{errors.salesManagerEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Manager Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="salesManagerPhone"
                    value={formData.salesManagerPhone}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.salesManagerPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.salesManagerPhone && <p className="mt-1 text-sm text-red-600">{errors.salesManagerPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sales Manager Desk Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="salesManagerDeskPhone"
                    value={formData.salesManagerDeskPhone}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.salesManagerDeskPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.salesManagerDeskPhone && <p className="mt-1 text-sm text-red-600">{errors.salesManagerDeskPhone}</p>}
                </div>
              </div>
            </div>

            {/* Logistic Service */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Logistic Service Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Logistic Service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="logisticService"
                  value={formData.logisticService}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    errors.logisticService ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  required
                />
                {errors.logisticService && <p className="mt-1 text-sm text-red-600">{errors.logisticService}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.address1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.address1 && <p className="mt-1 text-sm text-red-600">{errors.address1}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province / State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.province ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  >
                    <option value="">-- Select Country --</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="India">India</option>
                    <option value="United States">USA</option>
                    <option value="United Kingdom">UK</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Banking Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.accountName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IBAN / Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.iban ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.iban && <p className="mt-1 text-sm text-red-600">{errors.iban}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    name="swift"
                    value={formData.swift}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Invoicing Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Invoicing Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email for Invoicing <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="invoiceEmail"
                    value={formData.invoiceEmail}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.invoiceEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.invoiceEmail && <p className="mt-1 text-sm text-red-600">{errors.invoiceEmail}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Billing Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billingAddress1"
                    value={formData.billingAddress1}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.billingAddress1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.billingAddress1 && <p className="mt-1 text-sm text-red-600">{errors.billingAddress1}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Address Line 2</label>
                  <input
                    type="text"
                    name="billingAddress2"
                    value={formData.billingAddress2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Billing City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billingCity"
                    value={formData.billingCity}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.billingCity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.billingCity && <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Billing Province / State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billingProvince"
                    value={formData.billingProvince}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.billingProvince ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.billingProvince && <p className="mt-1 text-sm text-red-600">{errors.billingProvince}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Billing Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billingPostal"
                    value={formData.billingPostal}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.billingPostal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  />
                  {errors.billingPostal && <p className="mt-1 text-sm text-red-600">{errors.billingPostal}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Billing Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="billingCountry"
                    value={formData.billingCountry}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                      errors.billingCountry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  >
                    <option value="">-- Select Country --</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.billingCountry && <p className="mt-1 text-sm text-red-600">{errors.billingCountry}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Onboarding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

