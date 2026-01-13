/**
 * Customer Onboarding Form Page
 * Public page accessible via invitation token
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MdRocketLaunch, MdError, MdCheckCircle } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const countryOptions = [
    { value: '', label: '-- Select Country --' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'USA' },
    { value: 'United Kingdom', label: 'UK' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Other', label: 'Other' },
];
const countryCodeOptions = [
    { value: '+31', label: '🇳🇱 +31 (NL)' },
    { value: '+91', label: '🇮🇳 +91 (IN)' },
    { value: '+1', label: '🇺🇸 +1 (US)' },
    { value: '+44', label: '🇬🇧 +44 (UK)' },
    { value: '+65', label: '🇸🇬 +65 (SG)' },
];
export function OnboardingFormPage() {
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const token = searchParams.get('token');
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
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
        vessels: '',
        taxId: '',
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
    });
    useEffect(() => {
        if (!token) {
            setErrors({ token: 'Invalid invitation link. Please check your email for the correct link.' });
        }
    }, [token]);
    const submitMutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch(`${API_URL}/api/v1/onboarding/customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    ...data,
                    vessels: parseInt(data.vessels, 10),
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit onboarding form');
            }
            return response.json();
        },
        onSuccess: () => {
            setIsSubmitted(true);
            setErrors({});
            toast.success('Form submitted successfully! Proceeding to pricing...');
        },
        onError: (error) => {
            setErrors({ submit: error.message });
            toast.error(error.message || 'Failed to submit form');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        // Validation
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
            newErrors.province = 'Province/State is required';
        if (!formData.postalCode.trim())
            newErrors.postalCode = 'Postal code is required';
        if (!formData.country)
            newErrors.country = 'Country is required';
        if (!formData.vessels || parseInt(formData.vessels, 10) < 1)
            newErrors.vessels = 'Number of vessels must be at least 1';
        if (!formData.taxId.trim())
            newErrors.taxId = 'Tax ID is required';
        if (!formData.accountName.trim())
            newErrors.accountName = 'Account holder name is required';
        if (!formData.bankName.trim())
            newErrors.bankName = 'Bank name is required';
        if (!formData.iban.trim())
            newErrors.iban = 'IBAN/Account number is required';
        if (!formData.invoiceEmail.trim())
            newErrors.invoiceEmail = 'Invoice email is required';
        if (!formData.billingAddress1.trim())
            newErrors.billingAddress1 = 'Billing address is required';
        if (!formData.billingCity.trim())
            newErrors.billingCity = 'Billing city is required';
        if (!formData.billingProvince.trim())
            newErrors.billingProvince = 'Billing province/state is required';
        if (!formData.billingPostal.trim())
            newErrors.billingPostal = 'Billing postal code is required';
        if (!formData.billingCountry)
            newErrors.billingCountry = 'Billing country is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        submitMutation.mutate(formData);
    };
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };
    if (!token) {
        return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-8">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4"/>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Invalid Invitation Link</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {errors.token || 'Please check your email for the correct invitation link.'}
            </p>
          </div>
        </div>
      </div>);
    }
    if (isSubmitted) {
        return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-8">
          <div className="text-center">
            <MdCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
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
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 mb-4 shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/10">
            <MdRocketLaunch className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Customer Onboarding
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Euroasiann ERP</p>
        </div>

        {/* Form */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-8">
          {errors.submit && (<div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 flex items-center gap-3">
              <MdError className="w-5 h-5 flex-shrink-0"/>
              <span className="text-sm font-semibold">{errors.submit}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Details */}
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Company Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Shipping Company Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.companyName ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.companyName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Primary Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.contactPerson ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.contactPerson && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactPerson}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.email ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select value={formData.mobileCountryCode} onChange={(e) => handleChange('mobileCountryCode', e.target.value)} className="px-3 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                      {countryCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>))}
                    </select>
                    <input type="tel" value={formData.mobilePhone} onChange={(e) => handleChange('mobilePhone', e.target.value)} placeholder="Mobile number" className={cn('flex-1 px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.mobilePhone ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  </div>
                  {errors.mobilePhone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mobilePhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Desk Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select value={formData.deskCountryCode} onChange={(e) => handleChange('deskCountryCode', e.target.value)} className="px-3 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                      {countryCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>))}
                    </select>
                    <input type="tel" value={formData.deskPhone} onChange={(e) => handleChange('deskPhone', e.target.value)} placeholder="Desk phone number" className={cn('flex-1 px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.deskPhone ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  </div>
                  {errors.deskPhone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deskPhone}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.address1} onChange={(e) => handleChange('address1', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.address1 ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.address1 && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address1}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Address Line 2</label>
                  <input type="text" value={formData.address2} onChange={(e) => handleChange('address2', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"/>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.city ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.city && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Province / State <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.province} onChange={(e) => handleChange('province', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.province ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.province && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.province}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.postalCode ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.postalCode && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postalCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.country} onChange={(e) => handleChange('country', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.country ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
                    {countryOptions.map((opt) => (<option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>))}
                  </select>
                  {errors.country && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Number of Vessels to Onboard <span className="text-red-500">*</span>
                  </label>
                  <input type="number" min="1" value={formData.vessels} onChange={(e) => handleChange('vessels', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.vessels ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.vessels && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vessels}</p>}
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Tax Information
              </h2>
              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                  Tax ID / VAT / GST / EIN <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.taxId} onChange={(e) => handleChange('taxId', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.taxId ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                {errors.taxId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxId}</p>}
              </div>
            </div>

            {/* Banking Details */}
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Banking Details (For Auto-Debit)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.accountName} onChange={(e) => handleChange('accountName', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.accountName ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.accountName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accountName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.bankName} onChange={(e) => handleChange('bankName', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.bankName ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.bankName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    IBAN / Account Number <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.iban} onChange={(e) => handleChange('iban', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.iban ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.iban && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.iban}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">SWIFT / BIC Code</label>
                  <input type="text" value={formData.swift} onChange={(e) => handleChange('swift', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"/>
                </div>
              </div>
            </div>

            {/* Invoicing Details */}
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Invoicing Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Email for Invoicing <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={formData.invoiceEmail} onChange={(e) => handleChange('invoiceEmail', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.invoiceEmail ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.invoiceEmail && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invoiceEmail}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Billing Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.billingAddress1} onChange={(e) => handleChange('billingAddress1', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.billingAddress1 ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.billingAddress1 && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.billingAddress1}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Billing Address Line 2</label>
                  <input type="text" value={formData.billingAddress2} onChange={(e) => handleChange('billingAddress2', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"/>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Billing City <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.billingCity} onChange={(e) => handleChange('billingCity', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.billingCity ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.billingCity && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.billingCity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Billing Province / State <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.billingProvince} onChange={(e) => handleChange('billingProvince', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.billingProvince ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.billingProvince && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.billingProvince}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Billing Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.billingPostal} onChange={(e) => handleChange('billingPostal', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.billingPostal ? 'border-red-500' : 'border-[hsl(var(--border))]')}/>
                  {errors.billingPostal && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.billingPostal}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                    Billing Country <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.billingCountry} onChange={(e) => handleChange('billingCountry', e.target.value)} className={cn('w-full px-4 py-2.5 rounded-xl border-2 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all', errors.billingCountry ? 'border-red-500' : 'border-[hsl(var(--border))]')}>
                    {countryOptions.map((opt) => (<option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>))}
                  </select>
                  {errors.billingCountry && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.billingCountry}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-[hsl(var(--border))]">
              <button type="submit" disabled={submitMutation.isPending} className={cn('w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600', 'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200', 'transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none', submitMutation.isPending && 'cursor-wait')}>
                {submitMutation.isPending ? (<span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Submitting...
                  </span>) : ('Proceed to Pricing')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=OnboardingFormPage.js.map