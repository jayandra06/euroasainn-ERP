/**
 * Vendor Onboarding Form Page
 * Public page accessible via invitation token
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
import { cn } from '../../lib/utils';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function VendorOnboardingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const token = searchParams.get('token');
    const [formData, setFormData] = useState({
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
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    // State for brands, categories, and models
    const [availableBrands, setAvailableBrands] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);
    useEffect(() => {
        if (!token) {
            toast.error('Invalid invitation link');
            return;
        }
        // Fetch invitation data
        fetch(`${API_URL}/api/v1/onboarding/invitation?token=${token}`)
            .then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || `Failed to fetch invitation: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
            .then((data) => {
            if (data.success) {
                setInvitationData(data.data);
                setFormData((prev) => ({
                    ...prev,
                    email: data.data.email,
                }));
            }
            else {
                toast.error(data.error || 'Invalid invitation token');
            }
        })
            .catch((error) => {
            console.error('Failed to load invitation:', error);
            toast.error(error.message || 'Failed to load invitation. Please check your connection and try again.');
        });
        // Fetch available brands, categories, and models from API (only active/approved)
        const fetchOptions = async () => {
            try {
                // Fetch brands
                const brandsResponse = await fetch(`${API_URL}/api/v1/onboarding/brands`);
                if (brandsResponse.ok) {
                    const brandsData = await brandsResponse.json();
                    if (brandsData.success) {
                        setAvailableBrands(brandsData.data || []);
                    }
                }
                // Fetch categories
                const categoriesResponse = await fetch(`${API_URL}/api/v1/onboarding/categories`);
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    if (categoriesData.success) {
                        setAvailableCategories(categoriesData.data || []);
                    }
                }
                // Fetch models
                const modelsResponse = await fetch(`${API_URL}/api/v1/onboarding/models`);
                if (modelsResponse.ok) {
                    const modelsData = await modelsResponse.json();
                    if (modelsData.success) {
                        setAvailableModels(modelsData.data || []);
                    }
                }
            }
            catch (error) {
                console.error('Failed to fetch brands/categories/models:', error);
                // Don't show error toast - form can still be submitted without these
            }
        };
        fetchOptions();
    }, [token]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const handleSelectBrand = (value) => {
        if (!formData.brands.includes(value)) {
            setFormData((prev) => ({ ...prev, brands: [...prev.brands, value] }));
            setErrors((prev) => ({ ...prev, brands: '' }));
        }
    };
    const handleSelectCategory = (value) => {
        if (!formData.categories.includes(value)) {
            setFormData((prev) => ({ ...prev, categories: [...prev.categories, value] }));
            setErrors((prev) => ({ ...prev, categories: '' }));
        }
    };
    const handleSelectModel = (value) => {
        if (!formData.models.includes(value)) {
            setFormData((prev) => ({ ...prev, models: [...prev.models, value] }));
            setErrors((prev) => ({ ...prev, models: '' }));
        }
    };
    const removeBrand = (index) => {
        setFormData((prev) => ({ ...prev, brands: prev.brands.filter((_, i) => i !== index) }));
    };
    const removeCategory = (index) => {
        setFormData((prev) => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
    };
    const removeModel = (index) => {
        setFormData((prev) => ({ ...prev, models: prev.models.filter((_, i) => i !== index) }));
    };
    const validate = () => {
        const newErrors = {};
        if (!formData.companyName.trim())
            newErrors.companyName = 'Company name is required';
        if (!formData.contactPerson.trim())
            newErrors.contactPerson = 'Contact person is required';
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        if (!formData.mobilePhone.trim())
            newErrors.mobilePhone = 'Mobile phone is required';
        if (!formData.deskPhone.trim())
            newErrors.deskPhone = 'Desk phone is required';
        if (!formData.address1.trim())
            newErrors.address1 = 'Address is required';
        if (!formData.city.trim())
            newErrors.city = 'City is required';
        if (!formData.province.trim())
            newErrors.province = 'Province is required';
        if (!formData.postalCode.trim())
            newErrors.postalCode = 'Postal code is required';
        if (!formData.country.trim())
            newErrors.country = 'Country is required';
        if (!formData.taxId.trim())
            newErrors.taxId = 'Tax ID is required';
        if (!formData.warehouseAddress.trim())
            newErrors.warehouseAddress = 'Warehouse address is required';
        if (!formData.managingDirector.trim())
            newErrors.managingDirector = 'Managing director is required';
        if (!formData.managingDirectorEmail.trim())
            newErrors.managingDirectorEmail = 'Managing director email is required';
        if (!formData.managingDirectorPhone.trim())
            newErrors.managingDirectorPhone = 'Managing director phone is required';
        if (!formData.managingDirectorDeskPhone.trim())
            newErrors.managingDirectorDeskPhone = 'Managing director desk phone is required';
        if (!formData.port.trim())
            newErrors.port = 'Port is required';
        if (!formData.salesManager.trim())
            newErrors.salesManager = 'Sales manager is required';
        if (!formData.salesManagerEmail.trim())
            newErrors.salesManagerEmail = 'Sales manager email is required';
        if (!formData.salesManagerPhone.trim())
            newErrors.salesManagerPhone = 'Sales manager phone is required';
        if (!formData.salesManagerDeskPhone.trim())
            newErrors.salesManagerDeskPhone = 'Sales manager desk phone is required';
        if (!formData.logisticService.trim())
            newErrors.logisticService = 'Logistic service is required';
        // Brands, Categories, and Models are optional for testing
        // if (formData.brands.length === 0) newErrors.brands = 'At least one brand is required';
        // if (formData.categories.length === 0) newErrors.categories = 'At least one category is required';
        // if (formData.models.length === 0) newErrors.models = 'At least one model is required';
        if (!formData.accountName.trim())
            newErrors.accountName = 'Account name is required';
        if (!formData.bankName.trim())
            newErrors.bankName = 'Bank name is required';
        if (!formData.iban.trim())
            newErrors.iban = 'IBAN is required';
        if (!formData.invoiceEmail.trim())
            newErrors.invoiceEmail = 'Invoice email is required';
        if (!formData.billingAddress1.trim())
            newErrors.billingAddress1 = 'Billing address is required';
        if (!formData.billingCity.trim())
            newErrors.billingCity = 'Billing city is required';
        if (!formData.billingProvince.trim())
            newErrors.billingProvince = 'Billing province is required';
        if (!formData.billingPostal.trim())
            newErrors.billingPostal = 'Billing postal code is required';
        if (!formData.billingCountry.trim())
            newErrors.billingCountry = 'Billing country is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
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
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                throw new Error(errorData.error || `Failed to submit onboarding: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success) {
                setIsSubmitted(true);
                toast.success('Form submitted successfully!');
            }
            else {
                toast.error(data.error || 'Failed to submit onboarding');
            }
        }
        catch (error) {
            console.error('Submit onboarding error:', error);
            toast.error(error.message || 'Failed to submit onboarding. Please check your connection and try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!token) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Invalid invitation link</p>
        </div>
      </div>);
    }
    if (isSubmitted) {
        return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
        <div className="w-full max-w-md bg-[hsl(var(--card))]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[hsl(var(--border))]/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Form Submitted Successfully!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your onboarding form has been submitted. Our team will review your information and get back to you soon.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You will receive an email with your login credentials once your organization is approved.
            </p>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[hsl(var(--card))] rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
              Vendor Onboarding – Euroasiann ERP
            </h1>
            {invitationData?.invitedByCustomerName ? (<div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  You have been invited by <strong>{invitationData.invitedByCustomerName}</strong> to join the Euroasiann ERP Platform as a vendor.
                </p>
              </div>) : null}
            <p className="text-gray-600 dark:text-gray-400">
              Complete your vendor organization onboarding to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vendor Details */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Vendor Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.companyName ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]" required/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Primary Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.contactPerson ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.contactPerson && <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>}
                </div>
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Phone Numbers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select name="mobileCountryCode" value={formData.mobileCountryCode} onChange={handleChange} className="w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))] border-[hsl(var(--border))]">
                      <option value="+31">🇳🇱 +31 (NL)</option>
                      <option value="+91">🇮🇳 +91 (IN)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+65">🇸🇬 +65 (SG)</option>
                    </select>
                    <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className={cn('flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.mobilePhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  </div>
                  {errors.mobilePhone && <p className="mt-1 text-sm text-red-600">{errors.mobilePhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Desk Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select name="deskCountryCode" value={formData.deskCountryCode} onChange={handleChange} className="w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))] border-[hsl(var(--border))]">
                      <option value="+31">🇳🇱 +31 (NL)</option>
                      <option value="+91">🇮🇳 +91 (IN)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+65">🇸🇬 +65 (SG)</option>
                    </select>
                    <input type="tel" name="deskPhone" value={formData.deskPhone} onChange={handleChange} className={cn('flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.deskPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  </div>
                  {errors.deskPhone && <p className="mt-1 text-sm text-red-600">{errors.deskPhone}</p>}
                </div>
              </div>
            </div>

            {/* Brands, Categories, Models */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Product Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brands */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.brands.map((brand, i) => (<div key={i} className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1">
                        {brand}
                        <button type="button" onClick={() => removeBrand(i)} className="ml-1 hover:text-red-300">
                          ×
                        </button>
                      </div>))}
                  </div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Select Brands
                  </label>
                  <select onChange={(e) => {
            if (e.target.value)
                handleSelectBrand(e.target.value);
            e.target.value = '';
        }} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.brands ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
                    <option value="">Select Brand</option>
                    {availableBrands.map((brand) => (<option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>))}
                  </select>
                  {errors.brands && <p className="mt-1 text-sm text-red-600">{errors.brands}</p>}
                </div>

                {/* Categories */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.categories.map((category, i) => (<div key={i} className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1">
                        {category}
                        <button type="button" onClick={() => removeCategory(i)} className="ml-1 hover:text-red-300">
                          ×
                        </button>
                      </div>))}
                  </div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Select Categories
                  </label>
                  <select onChange={(e) => {
            if (e.target.value)
                handleSelectCategory(e.target.value);
            e.target.value = '';
        }} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.categories ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
                    <option value="">Select Category</option>
                    {availableCategories.map((category) => (<option key={category._id} value={category.name}>
                        {category.name}
                      </option>))}
                  </select>
                  {errors.categories && <p className="mt-1 text-sm text-red-600">{errors.categories}</p>}
                </div>

                {/* Models */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.models.map((model, i) => (<div key={i} className="text-xs text-white bg-zinc-600 rounded-full px-3 py-1 flex items-center gap-1">
                        {model}
                        <button type="button" onClick={() => removeModel(i)} className="ml-1 hover:text-red-300">
                          ×
                        </button>
                      </div>))}
                  </div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Select Models
                  </label>
                  <select onChange={(e) => {
            if (e.target.value)
                handleSelectModel(e.target.value);
            e.target.value = '';
        }} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.models ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
                    <option value="">Select Model</option>
                    {availableModels.map((model) => (<option key={model._id} value={model.name}>
                        {model.name}
                      </option>))}
                  </select>
                  {errors.models && <p className="mt-1 text-sm text-red-600">{errors.models}</p>}
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Tax ID <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.taxId ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Warehouse Address <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="warehouseAddress" value={formData.warehouseAddress} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.warehouseAddress ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.warehouseAddress && <p className="mt-1 text-sm text-red-600">{errors.warehouseAddress}</p>}
                </div>
              </div>
            </div>

            {/* Managing Director Details */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Managing Director Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Managing Director <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="managingDirector" value={formData.managingDirector} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.managingDirector ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.managingDirector && <p className="mt-1 text-sm text-red-600">{errors.managingDirector}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Managing Director Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="managingDirectorEmail" value={formData.managingDirectorEmail} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.managingDirectorEmail ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.managingDirectorEmail && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Managing Director Personal Phone <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="managingDirectorPhone" value={formData.managingDirectorPhone} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.managingDirectorPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.managingDirectorPhone && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Managing Director Desk Phone <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="managingDirectorDeskPhone" value={formData.managingDirectorDeskPhone} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.managingDirectorDeskPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.managingDirectorDeskPhone && <p className="mt-1 text-sm text-red-600">{errors.managingDirectorDeskPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="port" value={formData.port} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.port ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.port && <p className="mt-1 text-sm text-red-600">{errors.port}</p>}
                </div>
              </div>
            </div>

            {/* Sales Manager Details */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Sales Manager Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Sales Manager Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="salesManager" value={formData.salesManager} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.salesManager ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.salesManager && <p className="mt-1 text-sm text-red-600">{errors.salesManager}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Sales Manager Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="salesManagerEmail" value={formData.salesManagerEmail} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.salesManagerEmail ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.salesManagerEmail && <p className="mt-1 text-sm text-red-600">{errors.salesManagerEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Sales Manager Phone <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="salesManagerPhone" value={formData.salesManagerPhone} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.salesManagerPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.salesManagerPhone && <p className="mt-1 text-sm text-red-600">{errors.salesManagerPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Sales Manager Desk Phone <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="salesManagerDeskPhone" value={formData.salesManagerDeskPhone} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.salesManagerDeskPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.salesManagerDeskPhone && <p className="mt-1 text-sm text-red-600">{errors.salesManagerDeskPhone}</p>}
                </div>
              </div>
            </div>

            {/* Logistic Service */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Logistic Service Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Enter Logistic Service <span className="text-red-500">*</span>
                </label>
                <input type="text" name="logisticService" value={formData.logisticService} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.logisticService ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                {errors.logisticService && <p className="mt-1 text-sm text-red-600">{errors.logisticService}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="address1" value={formData.address1} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.address1 ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.address1 && <p className="mt-1 text-sm text-red-600">{errors.address1}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Address Line 2</label>
                  <input type="text" name="address2" value={formData.address2} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))] border-[hsl(var(--border))]"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.city ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Province / State <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="province" value={formData.province} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.province ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.postalCode ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select name="country" value={formData.country} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.country ? 'border-red-500' : 'border-[hsl(var(--border))]')} required>
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
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Banking Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.accountName ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.bankName ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    IBAN / Account Number <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="iban" value={formData.iban} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.iban ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.iban && <p className="mt-1 text-sm text-red-600">{errors.iban}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">SWIFT / BIC Code</label>
                  <input type="text" name="swift" value={formData.swift} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))] border-[hsl(var(--border))]"/>
                </div>
              </div>
            </div>

            {/* Invoicing Details */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Invoicing Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Email for Invoicing <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="invoiceEmail" value={formData.invoiceEmail} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.invoiceEmail ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.invoiceEmail && <p className="mt-1 text-sm text-red-600">{errors.invoiceEmail}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Billing Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="billingAddress1" value={formData.billingAddress1} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.billingAddress1 ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.billingAddress1 && <p className="mt-1 text-sm text-red-600">{errors.billingAddress1}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Billing Address Line 2</label>
                  <input type="text" name="billingAddress2" value={formData.billingAddress2} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))] border-[hsl(var(--border))]"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Billing City <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="billingCity" value={formData.billingCity} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.billingCity ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.billingCity && <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Billing Province / State <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="billingProvince" value={formData.billingProvince} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.billingProvince ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.billingProvince && <p className="mt-1 text-sm text-red-600">{errors.billingProvince}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Billing Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="billingPostal" value={formData.billingPostal} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.billingPostal ? 'border-red-500' : 'border-[hsl(var(--border))]')} required/>
                  {errors.billingPostal && <p className="mt-1 text-sm text-red-600">{errors.billingPostal}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Billing Country <span className="text-red-500">*</span>
                  </label>
                  <select name="billingCountry" value={formData.billingCountry} onChange={handleChange} className={cn('w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-[hsl(var(--foreground))]', errors.billingCountry ? 'border-red-500' : 'border-[hsl(var(--border))]')} required>
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
              <button type="button" onClick={() => navigate('/')} className="px-6 py-2 border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Submitting...' : 'Submit Onboarding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=VendorOnboardingPage.js.map