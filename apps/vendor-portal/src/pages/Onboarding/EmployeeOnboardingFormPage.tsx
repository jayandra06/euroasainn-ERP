/**
 * Employee Onboarding Form Page
 * Public page accessible via invitation token
 * ERP KYC Standard Form
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MdRocketLaunch, MdError, MdCheckCircle, MdUpload, MdPerson, MdPhone, MdEmail, MdLocationOn, MdAccountBalance, MdBadge, MdPeople, MdPhotoCamera, MdPayment } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';
import { getCountryOptions, getCountryCodeOptions, getCountryCodeByName, usesIFSC, getBankFieldLabel, getBankFieldPlaceholder } from '../../utils/countries';
import { SearchableSelect } from '../../components/shared/SearchableSelect';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  profilePhoto: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  addressLine1: string;
  addressLine2: string;
  accountNumber: string;
  ifscOrSwift: string;
  bankName: string;
  identityDocumentType: string;
  passport: string;
  nationalId: string;
  drivingLicense: string;
  pan: string; // For India
  ssn: string; // For USA
  paymentIdentityType: string;
  paymentIdentityDocument: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineePhone: string;
  nomineePhoneCountryCode: string;
}

// Helper function to get available identity document types based on country
const getIdentityDocumentTypes = (country: string): Array<{ value: string; label: string }> => {
  if (country === 'India') {
    return [
      { value: '', label: '-- Select Document Type --' },
      { value: 'aadhaar', label: 'Aadhaar' },
      { value: 'pan', label: 'PAN' },
      { value: 'drivingLicense', label: 'Driving License' },
      { value: 'passport', label: 'Passport' },
    ];
  } else if (country === 'United States') {
    return [
      { value: '', label: '-- Select Document Type --' },
      { value: 'ssn', label: 'SSN (Social Security Number)' },
      { value: 'drivingLicense', label: 'Driving License' },
      { value: 'passport', label: 'Passport' },
    ];
  } else if (country && country !== '') {
    return [
      { value: '', label: '-- Select Document Type --' },
      { value: 'passport', label: 'Passport' },
      { value: 'nationalId', label: 'National ID' },
      { value: 'drivingLicense', label: 'Driving License' },
    ];
  }
  return [{ value: '', label: '-- Select Country First --' }];
};

// Helper function to get payment identity types based on country
const getPaymentIdentityTypes = (country: string): Array<{ value: string; label: string }> => {
  if (country === 'India') {
    return [
      { value: '', label: '-- Select Payment Identity --' },
      { value: 'pan', label: 'PAN (Permanent Account Number)' },
      { value: 'taxId', label: 'Tax ID' },
    ];
  } else if (country === 'United States') {
    return [
      { value: '', label: '-- Select Payment Identity --' },
      { value: 'ssn', label: 'SSN (Social Security Number)' },
      { value: 'taxId', label: 'Tax ID (EIN/ITIN)' },
    ];
  } else if (country && country !== '') {
    return [
      { value: '', label: '-- Select Payment Identity --' },
      { value: 'taxId', label: 'Tax ID' },
      { value: 'passport', label: 'Passport' },
    ];
  }
  return [{ value: '', label: '-- Select Country First --' }];
};

// Helper function to get document field name based on document type
const getDocumentFieldName = (documentType: string): string => {
  const mapping: Record<string, string> = {
    aadhaar: 'nationalId',
    pan: 'pan',
    ssn: 'ssn',
    passport: 'passport',
    drivingLicense: 'drivingLicense',
    nationalId: 'nationalId',
  };
  return mapping[documentType] || documentType;
};

// Get global country options (exclude empty option for searchable select)
const countryOptions = getCountryOptions();

const relationOptions = [
  { value: '', label: '-- Select Relation --' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Other', label: 'Other' },
];

// Get global country code options
const countryCodeOptions = getCountryCodeOptions();

export function EmployeeOnboardingFormPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const token = searchParams.get('token');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fileUploads, setFileUploads] = useState<{
    profilePhoto?: File;
    passport?: File;
    nationalId?: File;
    drivingLicense?: File;
    pan?: File;
    ssn?: File;
    paymentIdentityDocument?: File;
  }>({});

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+1',
    profilePhoto: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    addressLine1: '',
    addressLine2: '',
    accountNumber: '',
    ifscOrSwift: '',
    bankName: '',
    identityDocumentType: '',
    passport: '',
    nationalId: '',
    drivingLicense: '',
    pan: '',
    ssn: '',
    paymentIdentityType: '',
    paymentIdentityDocument: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineePhone: '',
    nomineePhoneCountryCode: '+1',
  });

  // Fetch invitation details and pre-fill email
  const { data: invitationData, isLoading: loadingInvitation } = useQuery({
    queryKey: ['employee-onboarding-invitation', token],
    queryFn: async () => {
      if (!token) return null;
      const response = await fetch(`${API_URL}/api/v1/onboarding/employee?token=${token}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch invitation details');
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (invitationData?.data?.invitation) {
      const invitation = invitationData.data.invitation;
      // Extract country code from phone if it exists
      let phoneNumber = invitation.phone || '';
      let countryCode = '+1'; // Default
      
      if (phoneNumber) {
        // Try to extract country code from phone (format: +91XXXXXXXXXX)
        const match = phoneNumber.match(/^(\+\d{1,3})/);
        if (match) {
          countryCode = match[1];
          phoneNumber = phoneNumber.replace(match[1], '').trim();
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        email: invitation.email || prev.email,
        // Auto-fill fullName and phone from invitation data
        fullName: invitation.fullName || prev.fullName,
        phone: phoneNumber || prev.phone,
        phoneCountryCode: countryCode,
      }));
    }
    if (invitationData?.data?.onboarding) {
      // Pre-fill form if onboarding already exists
      const existing = invitationData.data.onboarding;
      // Extract country code from phone if it exists
      let phoneNumber = existing.phone || '';
      let countryCode = existing.phoneCountryCode || '+1';
      
      if (phoneNumber && !countryCode) {
        const match = phoneNumber.match(/^(\+\d{1,3})/);
        if (match) {
          countryCode = match[1];
          phoneNumber = phoneNumber.replace(match[1], '').trim();
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        fullName: existing.fullName || prev.fullName,
        email: existing.email || prev.email,
        phone: phoneNumber || prev.phone,
        phoneCountryCode: countryCode,
        profilePhoto: existing.profilePhoto || prev.profilePhoto,
        country: existing.country || prev.country,
        state: existing.state || prev.state,
        city: existing.city || prev.city,
        zipCode: existing.zipCode || prev.zipCode,
        addressLine1: existing.addressLine1 || prev.addressLine1,
        addressLine2: existing.addressLine2 || prev.addressLine2,
        accountNumber: existing.accountNumber || prev.accountNumber,
        ifscOrSwift: existing.ifscOrSwift || prev.ifscOrSwift,
        bankName: existing.bankName || prev.bankName,
        identityDocumentType: existing.identityDocumentType || prev.identityDocumentType,
        passport: existing.passport || prev.passport,
        nationalId: existing.nationalId || prev.nationalId,
        drivingLicense: existing.drivingLicense || prev.drivingLicense,
        pan: existing.pan || prev.pan,
        ssn: existing.ssn || prev.ssn,
        paymentIdentityType: existing.paymentIdentityType || prev.paymentIdentityType,
        paymentIdentityDocument: existing.paymentIdentityDocument || prev.paymentIdentityDocument,
        nomineeName: existing.nomineeName || prev.nomineeName,
        nomineeRelation: existing.nomineeRelation || prev.nomineeRelation,
        nomineePhone: existing.nomineePhone || prev.nomineePhone,
        nomineePhoneCountryCode: existing.nomineePhoneCountryCode || prev.nomineePhoneCountryCode || '+1',
      }));
      if (existing.status === 'submitted') {
        setIsSubmitted(true);
      }
    }
  }, [invitationData]);

  useEffect(() => {
    if (!token) {
      setErrors({ token: 'Invalid invitation link. Please check your email for the correct link.' });
    }
  }, [token]);

  // Update phone country code when country changes (only if different)
  useEffect(() => {
    if (formData.country) {
      const defaultCode = getCountryCodeByName(formData.country);
      if (formData.phoneCountryCode !== defaultCode) {
        setFormData((prev) => ({
          ...prev,
          phoneCountryCode: defaultCode,
          nomineePhoneCountryCode: defaultCode,
        }));
      }
    }
  }, [formData.country]);

  const handleFileUpload = (field: 'profilePhoto' | 'passport' | 'nationalId' | 'drivingLicense' | 'pan' | 'ssn' | 'paymentIdentityDocument', file: File | null) => {
    if (file) {
      setFileUploads((prev) => ({ ...prev, [field]: file }));
      // For now, we'll store the file name. In production, upload to cloud storage and store URL
      setFormData((prev) => ({
        ...prev,
        [field]: file.name,
      }));
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`${API_URL}/api/v1/onboarding/employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          ...data,
          // Combine phone country code with phone number
          phone: data.phoneCountryCode ? `${data.phoneCountryCode}${data.phone}` : data.phone,
          // Combine nominee phone country code with nominee phone number
          nomineePhone: data.nomineePhoneCountryCode && data.nomineePhone ? `${data.nomineePhoneCountryCode}${data.nomineePhone}` : data.nomineePhone,
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
      toast.success('Onboarding form submitted successfully! Your information is under review.');
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      toast.error(error.message || 'Failed to submit form');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.phoneCountryCode.trim()) newErrors.phoneCountryCode = 'Country code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.ifscOrSwift.trim()) {
      const fieldLabel = formData.country ? getBankFieldLabel(formData.country) : 'IFSC/SWIFT code';
      newErrors.ifscOrSwift = `${fieldLabel} is required`;
    }
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';

    // Identity document validation
    if (formData.country && !formData.identityDocumentType) {
      newErrors.identityDocumentType = 'Please select an identity document type';
    }
    
    if (formData.identityDocumentType) {
      const fieldName = getDocumentFieldName(formData.identityDocumentType);
      if (!formData[fieldName as keyof FormData]) {
        newErrors.identityDocuments = `Please upload the ${formData.identityDocumentType} document`;
      }
    }

    // Payment identity validation
    if (formData.country && !formData.paymentIdentityType) {
      newErrors.paymentIdentityType = 'Please select a payment identity type';
    }
    
    if (formData.paymentIdentityType && !formData.paymentIdentityDocument) {
      newErrors.paymentIdentityDocument = 'Please upload the payment identity document';
    }

    // Profile photo validation
    if (!formData.profilePhoto && !fileUploads.profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }

    // Nominee details validation
    if (!formData.nomineeName.trim()) {
      newErrors.nomineeName = 'Nominee name is required';
    }
    if (!formData.nomineeRelation || formData.nomineeRelation === '') {
      newErrors.nomineeRelation = 'Nominee relation is required';
    }
    if (!formData.nomineePhone.trim()) {
      newErrors.nomineePhone = 'Nominee phone number is required';
    }
    if (!formData.nomineePhoneCountryCode.trim()) {
      newErrors.nomineePhoneCountryCode = 'Nominee phone country code is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    submitMutation.mutate(formData);
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (!token || errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <MdError className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 dark:text-gray-400">{errors.token || 'Invalid invitation link. Please check your email for the correct link.'}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <MdCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Submitted Successfully!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your employee onboarding form has been submitted successfully. Your information is under review. You will receive an email once your account is activated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 mb-4 shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/10">
            <MdRocketLaunch className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Employee Onboarding
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Euroasiann ERP - KYC Form</p>
        </div>

        {/* Form */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-4 sm:p-6 lg:p-8 overflow-hidden">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdPerson className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile Photo Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MdPhotoCamera className="w-4 h-4" />
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-shrink-0">
                      {fileUploads.profilePhoto ? (
                        <img
                          src={URL.createObjectURL(fileUploads.profilePhoto)}
                          alt="Profile"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                      ) : formData.profilePhoto ? (
                        <img
                          src={formData.profilePhoto}
                          alt="Profile"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                          <MdPerson className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('profilePhoto', e.target.files?.[0] || null)}
                        className="hidden"
                        id="profilePhoto-upload"
                      />
                      <label
                        htmlFor="profilePhoto-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MdUpload className="w-4 h-4" />
                        {fileUploads.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF (Max 5MB)</p>
                      {errors.profilePhoto && <p className="mt-1 text-sm text-red-500">{errors.profilePhoto}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    readOnly
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    placeholder="Full name (pre-filled from invitation)"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MdEmail className="w-4 h-4" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    placeholder="Email (pre-filled from invitation)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MdPhone className="w-4 h-4" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={formData.phoneCountryCode}
                      onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                      className="w-full sm:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {countryCodeOptions.map((option, index) => (
                        <option key={`${option.value}-${index}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      readOnly
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      placeholder="Phone number (pre-filled from invitation)"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdLocationOn className="w-5 h-5" />
                Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.addressLine1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Street address, P.O. box"
                  />
                  {errors.addressLine1 && <p className="mt-1 text-sm text-red-500">{errors.addressLine1}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <SearchableSelect
                    options={countryOptions}
                    value={formData.country}
                    onChange={(selectedCountry) => {
                      const defaultCode = getCountryCodeByName(selectedCountry);
                      setFormData((prev) => ({
                        ...prev,
                        country: selectedCountry,
                        phoneCountryCode: defaultCode,
                        nomineePhoneCountryCode: defaultCode,
                        // Reset identity document fields when country changes
                        identityDocumentType: '',
                        paymentIdentityType: '',
                        paymentIdentityDocument: '',
                        passport: '',
                        nationalId: '',
                        drivingLicense: '',
                        pan: '',
                        ssn: '',
                        ifscOrSwift: '', // Reset bank code when country changes
                      }));
                      // Clear document file uploads
                      setFileUploads((prev) => ({
                        profilePhoto: prev.profilePhoto,
                        // Clear document uploads
                      }));
                    }}
                    placeholder="Search and select country..."
                    label="Country"
                    required
                    error={!!errors.country}
                    className={cn(
                      errors.country && 'border-red-500'
                    )}
                  />
                  {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter state or province"
                  />
                  {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zip/Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter zip/postal code"
                  />
                  {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdAccountBalance className="w-5 h-5" />
                Bank Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.country ? getBankFieldLabel(formData.country) : 'IFSC / SWIFT Code'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ifscOrSwift}
                    onChange={(e) => setFormData({ ...formData, ifscOrSwift: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.ifscOrSwift ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder={formData.country ? getBankFieldPlaceholder(formData.country) : 'Enter IFSC or SWIFT code'}
                  />
                  {errors.ifscOrSwift && <p className="mt-1 text-sm text-red-500">{errors.ifscOrSwift}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
                </div>
              </div>
            </div>

            {/* Identity Documents Section - Dynamic based on country */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdBadge className="w-5 h-5" />
                Identity Documents
              </h2>
              {errors.identityDocuments && (
                <p className="mb-4 text-sm text-red-500">{errors.identityDocuments}</p>
              )}
              {!formData.country && (
                <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                  Please select a country first to see available identity document options.
                </p>
              )}
              
              {/* Identity Document Type Dropdown */}
              {formData.country && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Identity Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.identityDocumentType}
                    onChange={(e) => {
                      setFormData({ ...formData, identityDocumentType: e.target.value });
                      // Clear the document field when type changes
                      const fieldName = getDocumentFieldName(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        identityDocumentType: e.target.value,
                        [fieldName]: '',
                      }));
                      setFileUploads((prev) => {
                        const newUploads = { ...prev };
                        delete newUploads[fieldName as keyof typeof newUploads];
                        return newUploads;
                      });
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.identityDocumentType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {getIdentityDocumentTypes(formData.country).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.identityDocumentType && <p className="mt-1 text-sm text-red-500">{errors.identityDocumentType}</p>}
                </div>
              )}

              {/* Dynamic Document Upload Field */}
              {formData.country && formData.identityDocumentType && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.identityDocumentType === 'aadhaar' ? 'Aadhaar' :
                     formData.identityDocumentType === 'pan' ? 'PAN' :
                     formData.identityDocumentType === 'ssn' ? 'SSN' :
                     formData.identityDocumentType === 'passport' ? 'Passport' :
                     formData.identityDocumentType === 'drivingLicense' ? 'Driving License' :
                     formData.identityDocumentType === 'nationalId' ? 'National ID' :
                     'Identity Document'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const fieldName = getDocumentFieldName(formData.identityDocumentType);
                        handleFileUpload(fieldName as any, e.target.files?.[0] || null);
                      }}
                      className="hidden"
                      id="identity-document-upload"
                    />
                    <label
                      htmlFor="identity-document-upload"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                    >
                      <MdUpload className="w-4 h-4" />
                      {(() => {
                        const fieldName = getDocumentFieldName(formData.identityDocumentType);
                        const file = fileUploads[fieldName as keyof typeof fileUploads];
                        return file ? file.name : `Upload ${formData.identityDocumentType === 'aadhaar' ? 'Aadhaar' :
                          formData.identityDocumentType === 'pan' ? 'PAN' :
                          formData.identityDocumentType === 'ssn' ? 'SSN' :
                          formData.identityDocumentType === 'passport' ? 'Passport' :
                          formData.identityDocumentType === 'drivingLicense' ? 'Driving License' :
                          formData.identityDocumentType === 'nationalId' ? 'National ID' :
                          'Document'}`;
                      })()}
                    </label>
                  </div>
                </div>
              )}

              {/* Payment Identity Section */}
              {formData.country && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MdPayment className="w-5 h-5" />
                    Payment Identity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Identity Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.paymentIdentityType}
                        onChange={(e) => {
                          setFormData({ ...formData, paymentIdentityType: e.target.value, paymentIdentityDocument: '' });
                          setFileUploads((prev) => {
                            const newUploads = { ...prev };
                            delete newUploads.paymentIdentityDocument;
                            return newUploads;
                          });
                        }}
                        className={cn(
                          'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                          errors.paymentIdentityType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        )}
                      >
                        {getPaymentIdentityTypes(formData.country).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.paymentIdentityType && <p className="mt-1 text-sm text-red-500">{errors.paymentIdentityType}</p>}
                    </div>
                    {formData.paymentIdentityType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Payment Identity Document <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload('paymentIdentityDocument', e.target.files?.[0] || null)}
                            className="hidden"
                            id="payment-identity-upload"
                          />
                          <label
                            htmlFor="payment-identity-upload"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                          >
                            <MdUpload className="w-4 h-4" />
                            {fileUploads.paymentIdentityDocument ? fileUploads.paymentIdentityDocument.name : 'Upload Document'}
                          </label>
                        </div>
                        {errors.paymentIdentityDocument && <p className="mt-1 text-sm text-red-500">{errors.paymentIdentityDocument}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Nominee Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdPeople className="w-5 h-5" />
                Nominee Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nominee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nomineeName}
                    onChange={(e) => {
                      setFormData({ ...formData, nomineeName: e.target.value });
                      if (errors.nomineeName) {
                        setErrors({ ...errors, nomineeName: '' });
                      }
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.nomineeName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter nominee name"
                    required
                  />
                  {errors.nomineeName && <p className="mt-1 text-sm text-red-500">{errors.nomineeName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.nomineeRelation}
                    onChange={(e) => {
                      setFormData({ ...formData, nomineeRelation: e.target.value });
                      if (errors.nomineeRelation) {
                        setErrors({ ...errors, nomineeRelation: '' });
                      }
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.nomineeRelation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    required
                  >
                    {relationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.nomineeRelation && <p className="mt-1 text-sm text-red-500">{errors.nomineeRelation}</p>}
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nominee Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={formData.nomineePhoneCountryCode}
                      onChange={(e) => {
                        setFormData({ ...formData, nomineePhoneCountryCode: e.target.value });
                        if (errors.nomineePhoneCountryCode) {
                          setErrors({ ...errors, nomineePhoneCountryCode: '' });
                        }
                      }}
                      className={cn(
                        'w-full sm:w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.nomineePhoneCountryCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      )}
                      required
                    >
                      {countryCodeOptions.map((option, index) => (
                        <option key={`${option.value}-${index}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.nomineePhone}
                      onChange={(e) => {
                        setFormData({ ...formData, nomineePhone: e.target.value });
                        if (errors.nomineePhone) {
                          setErrors({ ...errors, nomineePhone: '' });
                        }
                      }}
                      className={cn(
                        'flex-1 min-w-0 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.nomineePhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      )}
                      placeholder="Enter nominee phone"
                      required
                    />
                  </div>
                  {(errors.nomineePhone || errors.nomineePhoneCountryCode) && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.nomineePhone || errors.nomineePhoneCountryCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Onboarding Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
