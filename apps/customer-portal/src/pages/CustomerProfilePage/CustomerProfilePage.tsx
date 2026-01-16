'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdBusiness, MdEmail, MdPhone, MdLocationOn, MdAccountBalance,
  MdSecurity, MdDescription, MdEdit, MdSave, MdClose,
  MdCheckCircle, MdAccessTime, MdError, MdTag, MdDirectionsBoat,
  MdUpload, MdDelete, MdLanguage,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get full logo URL
const getLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath) return null;
  // If already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  // If relative path, prepend API URL
  if (logoPath.startsWith('/')) {
    return `${API_URL}${logoPath}`;
  }
  // If no leading slash, add it
  return `${API_URL}/${logoPath}`;
};

const statusConfig = {
  pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/50', icon: <MdAccessTime size={14} /> },
  completed: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/50', icon: <MdCheckCircle size={14} /> },
  approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/50', icon: <MdCheckCircle size={14} /> },
  rejected: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-800/50', icon: <MdError size={14} /> },
};

const COUNTRY_CODES = [
  { code: '+31', label: 'NL 🇳🇱' },
  { code: '+91', label: 'IN 🇮🇳' },
  { code: '+1', label: 'US 🇺🇸' },
  { code: '+44', label: 'UK 🇬🇧' },
  { code: '+65', label: 'SG 🇸🇬' },
];

// --- Sub-Component: FormField ---
const FormField = ({ label, name, value, type = 'text', isEditing, handleChange, placeholder = "", rows = 1 }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {isEditing ? (
      rows > 1 ? (
        <textarea
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
      )
    ) : (
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
        {rows > 1 ? (
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {value ?? '—'}
          </p>
        ) : (
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {value ?? '—'}
          </p>
        )}
      </div>
    )}
  </div>
);

// --- Sub-Component: PhoneField ---
const PhoneField = ({ label, codeName, phoneName, codeValue, phoneValue, isEditing, handleChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="flex gap-2">
      {isEditing ? (
        <>
          <select
            name={codeName}
            value={codeValue}
            onChange={handleChange}
            className="w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <input
            name={phoneName}
            value={phoneValue ?? ''}
            onChange={handleChange}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </>
      ) : (
        <div className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
          <p className="text-sm text-gray-900 dark:text-gray-100">{codeValue} {phoneValue || '—'}</p>
        </div>
      )}
    </div>
  </div>
);

export function CustomerProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // customerData for live editing
  const [customerData, setCustomerData] = useState<any | null>(null);
  // backupData to store the "last saved" state for Discarding
  const [backupData, setBackupData] = useState<any | null>(null);

  // Check if user is admin/owner (can edit company-level info)
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('owner');

  const fetchProfile = useCallback(async (setLoadingState = true) => {
    try {
      const res = await authenticatedFetch('/api/v1/customer/onboarding/me');
      const json = await res.json();
      if (json.success) {
        setCustomerData(json.data);
        setBackupData(json.data); // Store the snapshot
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      if (setLoadingState) {
        setLoading(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated, fetchProfile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleDiscard = () => {
    // Revert the live data to the backup snapshot
    setCustomerData(backupData);
    setIsEditing(false);
    showToast('Changes discarded', 'info');
  };

  const handleSave = async () => {
    try {
      // Filter out company-level fields if user is not admin
      const dataToSave = isAdmin 
        ? customerData 
        : { ...customerData, logo: backupData?.logo, companyDescription: backupData?.companyDescription, website: backupData?.website };

      const res = await authenticatedFetch('/api/v1/customer/onboarding/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        // Update customerData with the saved data from server to ensure consistency
        if (json.data) {
          setCustomerData(json.data);
          setBackupData(json.data);
        } else {
          setBackupData(customerData);
        }
        showToast(json.message || 'Profile updated successfully', 'success');
        setIsEditing(false);
      } else {
        // Handle error response
        showToast(json.error || json.message || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/customer/onboarding/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // Refetch profile to get updated data (don't set loading state)
        await fetchProfile(false);
        showToast('Logo uploaded successfully', 'success');
      } else {
        showToast(json.error || 'Failed to upload logo', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const res = await authenticatedFetch('/api/v1/customer/onboarding/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: null }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setCustomerData((prev: any) => ({ ...prev, logo: null }));
        setBackupData((prev: any) => ({ ...prev, logo: null }));
        showToast('Logo removed successfully', 'success');
      } else {
        showToast(json.error || 'Failed to remove logo', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove logo', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading profile...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'company', label: 'Company Details', icon: MdBusiness, desc: 'Company identity & contact person' },
    { id: 'address', label: 'Address', icon: MdLocationOn, desc: 'Primary address information' },
    { id: 'business', label: 'Business Details', icon: MdDirectionsBoat, desc: 'Tax and vessel information' },
    { id: 'banking', label: 'Banking Details', icon: MdAccountBalance, desc: 'Settlement account information' },
    { id: 'invoicing', label: 'Invoicing', icon: MdDescription, desc: 'Billing address & routing email' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section with Profile Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md mb-6 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Logo Display */}
              <div className="relative group flex-shrink-0">
                {customerData?.logo ? (
                  <div className="relative">
                    <img
                      key={customerData.logo}
                      src={getLogoUrl(customerData.logo) || ''}
                      alt={customerData?.companyName || 'Company Logo'}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        console.error('Logo image failed to load:', getLogoUrl(customerData.logo));
                        (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%233b82f6' width='64' height='64'/%3E%3Ctext fill='white' font-family='Arial' font-size='28' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${customerData?.companyName?.charAt(0) || '?'}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    {isEditing && isAdmin && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer p-2 bg-white rounded-md hover:bg-gray-100">
                          <MdUpload size={18} className="text-gray-700" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                        </label>
                        <button
                          onClick={handleLogoRemove}
                          className="ml-2 p-2 bg-white rounded-md hover:bg-gray-100"
                        >
                          <MdDelete size={18} className="text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-semibold relative group">
                    {customerData?.companyName?.charAt(0) || '?'}
                    {isEditing && isAdmin && (
                      <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MdUpload size={20} className="text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    )}
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5 truncate">
                  {customerData?.companyName || 'Customer'}
                </h1>
                {customerData?.companyDescription && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2.5 line-clamp-2 leading-relaxed">
                    {customerData.companyDescription}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {customerData?.website && (
                    <a
                      href={customerData.website.startsWith('http') ? customerData.website : `https://${customerData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:underline"
                    >
                      <MdLanguage size={14} className="flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{customerData.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span># ID: {user?.organizationId?.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {(() => {
                const status = (customerData?.status || 'pending') as keyof typeof statusConfig;
                const config = statusConfig[status];
                return (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium",
                    config.border,
                    config.bg,
                    config.text
                  )}>
                    {config.icon}
                    <span className="uppercase">{status}</span>
                  </div>
                );
              })()}
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <MdEdit size={18} /> Edit
                </button>
              ) : isAdmin ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    <MdSave size={18} /> Save
                  </button>
                  <button 
                    onClick={handleDiscard} 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <MdClose size={18} /> Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    <MdSave size={18} /> Save
                  </button>
                  <button 
                    onClick={handleDiscard} 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <MdClose size={18} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                  )}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                {/* Section Header */}
                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    {React.createElement(tabs.find(t => t.id === activeTab)?.icon || MdBusiness, { 
                      size: 22, 
                      className: "text-blue-600 dark:text-blue-400" 
                    })}
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">
                    {tabs.find(t => t.id === activeTab)?.desc}
                  </p>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {activeTab === 'company' && (
                    <>
                      <div className="md:col-span-2">
                        <FormField 
                          label="Company Description" 
                          name="companyDescription" 
                          value={customerData?.companyDescription} 
                          isEditing={isEditing && isAdmin} 
                          handleChange={handleChange} 
                          rows={4}
                          placeholder="Tell us about your company, its history, values, and what makes you unique..."
                        />
                        {!isAdmin && isEditing && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Only administrators can edit company description
                          </p>
                        )}
                      </div>
                      <FormField 
                        label="Company Website" 
                        name="website" 
                        value={customerData?.website} 
                        isEditing={isEditing && isAdmin} 
                        handleChange={handleChange} 
                        type="url" 
                        placeholder="https://www.example.com" 
                      />
                      {!isAdmin && isEditing && customerData?.website && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Only administrators can edit company website
                        </p>
                      )}
                      <FormField label="Company Name" name="companyName" value={customerData?.companyName} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Business Email" name="email" value={customerData?.email} isEditing={isEditing} handleChange={handleChange} type="email" />
                      <FormField label="Primary Contact Person" name="contactPerson" value={customerData?.contactPerson} isEditing={isEditing} handleChange={handleChange} />
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <PhoneField label="Mobile Phone Number" codeName="mobileCountryCode" phoneName="mobilePhone" codeValue={customerData?.mobileCountryCode} phoneValue={customerData?.mobilePhone} isEditing={isEditing} handleChange={handleChange} />
                        <PhoneField label="Desk Phone Number" codeName="deskCountryCode" phoneName="deskPhone" codeValue={customerData?.deskCountryCode} phoneValue={customerData?.deskPhone} isEditing={isEditing} handleChange={handleChange} />
                      </div>
                    </>
                  )}

                  {activeTab === 'address' && (
                    <>
                      <div className="md:col-span-2">
                        <FormField label="Address Line 1" name="address1" value={customerData?.address1} isEditing={isEditing} handleChange={handleChange} />
                      </div>
                      <div className="md:col-span-2">
                        <FormField label="Address Line 2" name="address2" value={customerData?.address2} isEditing={isEditing} handleChange={handleChange} />
                      </div>
                      <FormField label="City" name="city" value={customerData?.city} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Province / State" name="province" value={customerData?.province} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Postal Code" name="postalCode" value={customerData?.postalCode} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Country" name="country" value={customerData?.country} isEditing={isEditing} handleChange={handleChange} />
                    </>
                  )}

                  {activeTab === 'business' && (
                    <>
                      <FormField label="Tax ID / VAT" name="taxId" value={customerData?.taxId} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Number of Vessels" name="vessels" value={customerData?.vessels} isEditing={isEditing} handleChange={handleChange} type="number" />
                    </>
                  )}

                  {activeTab === 'banking' && (
                    <>
                      <FormField label="Account Holder Name" name="accountName" value={customerData?.accountName} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Bank Name" name="bankName" value={customerData?.bankName} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="IBAN / Account Number" name="iban" value={customerData?.iban} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="SWIFT / BIC Code" name="swift" value={customerData?.swift} isEditing={isEditing} handleChange={handleChange} />
                    </>
                  )}

                  {activeTab === 'invoicing' && (
                    <>
                      <div className="md:col-span-2">
                        <FormField label="Email for Invoicing" name="invoiceEmail" value={customerData?.invoiceEmail} isEditing={isEditing} handleChange={handleChange} />
                      </div>
                      <FormField label="Billing Street Address 1" name="billingAddress1" value={customerData?.billingAddress1} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Billing Street Address 2" name="billingAddress2" value={customerData?.billingAddress2} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Billing City" name="billingCity" value={customerData?.billingCity} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Billing Province/State" name="billingProvince" value={customerData?.billingProvince} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Billing Postal Code" name="billingPostal" value={customerData?.billingPostal} isEditing={isEditing} handleChange={handleChange} />
                      <FormField label="Billing Country" name="billingCountry" value={customerData?.billingCountry} isEditing={isEditing} handleChange={handleChange} />
                    </>
                  )}

                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
