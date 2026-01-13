import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function VendorInvitationDeclinePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const token = searchParams.get('token');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    useEffect(() => {
        if (!token) {
            toast.error('Invalid invitation link');
            return;
        }
        // Auto-decline the invitation
        const declineInvitation = async () => {
            setIsProcessing(true);
            try {
                const response = await fetch(`${API_URL}/api/v1/onboarding/vendor-invitation/decline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });
                const data = await response.json();
                if (data.success) {
                    setIsSuccess(true);
                    toast.success('Invitation declined');
                }
                else {
                    toast.error(data.error || 'Failed to decline invitation');
                }
            }
            catch (error) {
                toast.error('Failed to decline invitation. Please try again.');
            }
            finally {
                setIsProcessing(false);
            }
        };
        declineInvitation();
    }, [token, toast]);
    if (!token) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Invalid invitation link</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {isProcessing && !isSuccess && (<div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-600 mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Processing your decline...</p>
          </div>)}

        {isSuccess && (<div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invitation Declined
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have declined the invitation. The customer has been notified.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You can close this page now.
            </p>
          </div>)}

        {!isProcessing && !isSuccess && (<div className="text-center">
            <p className="text-gray-700 dark:text-gray-300">Please wait...</p>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=VendorInvitationDeclinePage.js.map