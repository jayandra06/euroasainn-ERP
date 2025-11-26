import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './shared/Modal';
import { useToast } from './shared/Toast';
import { MdClose } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OnboardingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationType: 'customer' | 'vendor';
  organizationName: string;
}

export function OnboardingDetailsModal({
  isOpen,
  onClose,
  organizationId,
  organizationType,
  organizationName,
}: OnboardingDetailsModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Fetch onboarding data
  const { data: onboardingData, isLoading } = useQuery({
    queryKey: [`${organizationType}-onboarding`, organizationId],
    queryFn: async () => {
      const endpoint =
        organizationType === 'customer'
          ? `${API_URL}/api/v1/admin/customer-onboardings`
          : `${API_URL}/api/v1/admin/vendor-onboardings`;
      const response = await fetch(`${endpoint}?organizationId=${organizationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding data');
      const data = await response.json();
      return data.data?.[0] || null; // Get the first (most recent) onboarding
    },
    enabled: isOpen && !!organizationId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (onboardingId: string) => {
      const endpoint =
        organizationType === 'customer'
          ? `${API_URL}/api/v1/admin/customer-onboardings/${onboardingId}/approve`
          : `${API_URL}/api/v1/admin/vendor-onboardings/${onboardingId}/approve`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve onboarding');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`${organizationType}-onboarding`, organizationId] });
      showToast(data.message || 'Onboarding approved successfully', 'success');
      // Also invalidate organization queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to approve onboarding', 'error');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ onboardingId, reason }: { onboardingId: string; reason?: string }) => {
      const endpoint =
        organizationType === 'customer'
          ? `${API_URL}/api/v1/admin/customer-onboardings/${onboardingId}/reject`
          : `${API_URL}/api/v1/admin/vendor-onboardings/${onboardingId}/reject`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ rejectionReason: reason || '' }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject onboarding');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`${organizationType}-onboarding`, organizationId] });
      showToast(data.message || 'Onboarding rejected successfully', 'success');
      setShowRejectInput(false);
      setRejectionReason('');
      // Also invalidate organization queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to reject onboarding', 'error');
    },
  });

  const handleApprove = () => {
    const onboardingId = onboardingData?._id || onboardingData?.id;
    if (onboardingId) {
      approveMutation.mutate(onboardingId);
    }
  };

  const handleReject = () => {
    if (showRejectInput) {
      // Submit rejection
      const onboardingId = onboardingData?._id || onboardingData?.id;
      if (onboardingId) {
        rejectMutation.mutate({ onboardingId, reason: rejectionReason });
      }
    } else {
      // Show rejection input
      setShowRejectInput(true);
    }
  };

  const handleCancelReject = () => {
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const canApproveReject = onboardingData?.status === 'pending' || 
                           onboardingData?.status === 'submitted' || 
                           onboardingData?.status === 'completed';
  const isApproved = onboardingData?.status === 'approved';
  const isRejected = onboardingData?.status === 'rejected';

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Onboarding Details - ${organizationName}`} size="large">
      {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading onboarding data...</p>
          </div>
        ) : !onboardingData ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No onboarding data found for this organization.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.companyName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Person
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.contactPerson || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.email || 'N/A'}
                  </p>
                </div>
                {organizationType === 'customer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Vessels
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      {onboardingData.vessels || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Phone Numbers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Phone
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.mobileCountryCode} {onboardingData.mobilePhone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Desk Phone
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.deskCountryCode} {onboardingData.deskPhone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 1
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.address1 || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 2
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.address2 || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.city || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Province / State
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.province || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal Code
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.postalCode || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.country || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Tax Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax ID / VAT / GST / EIN
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                  {onboardingData.taxId || 'N/A'}
                </p>
              </div>
            </div>

            {/* Vendor-specific fields */}
            {organizationType === 'vendor' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Business Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Warehouse Address
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.warehouseAddress || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Port
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.port || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Logistic Service
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.logisticService || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Managing Director Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Managing Director
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.managingDirector || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Managing Director Email
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.managingDirectorEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Managing Director Phone
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.managingDirectorPhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Managing Director Desk Phone
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.managingDirectorDeskPhone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Sales Manager Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sales Manager Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.salesManager || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sales Manager Email
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.salesManagerEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sales Manager Phone
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.salesManagerPhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sales Manager Desk Phone
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        {onboardingData.salesManagerDeskPhone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                {(onboardingData.brands?.length > 0 ||
                  onboardingData.categories?.length > 0 ||
                  onboardingData.models?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                      Product Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {onboardingData.brands?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Brands
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.brands.map((brand: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full"
                              >
                                {brand}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {onboardingData.categories?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categories
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.categories.map((category: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {onboardingData.models?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Models
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.models.map((model: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full"
                              >
                                {model}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Banking Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Banking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Holder Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.accountName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.bankName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IBAN / Account Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.iban || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SWIFT / BIC Code
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.swift || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoicing Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Invoicing Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email for Invoicing
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.invoiceEmail || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Address Line 1
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingAddress1 || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Address Line 2
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingAddress2 || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing City
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingCity || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Province / State
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingProvince || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Postal Code
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingPostal || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Country
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.billingCountry || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status and Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Status Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      onboardingData.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : onboardingData.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : onboardingData.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}
                  >
                    {onboardingData.status?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Submitted At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    {onboardingData.submittedAt
                      ? new Date(onboardingData.submittedAt).toLocaleString()
                      : onboardingData.createdAt
                      ? new Date(onboardingData.createdAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Approve/Reject Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              {showRejectInput ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancelReject}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  {canApproveReject && (
                    <>
                      <button
                        onClick={handleReject}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  )}
                  {(isApproved || isRejected) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                      This onboarding has been {isApproved ? 'approved' : 'rejected'}.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </Modal>
  );
}

