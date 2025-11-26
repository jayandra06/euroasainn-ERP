import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import { MdPayment, MdCheckCircle, MdCancel, MdInfo, MdHistory, MdCreditCard } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  paymentType: string;
  createdAt: string;
  subscriptionPeriod?: {
    startDate: string;
    endDate: string;
  };
  licenseId?: any;
  transactionId?: string;
}

interface PaymentStatus {
  hasActivePayment: boolean;
  organizationId: string;
}

export function PaymentPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Check payment status
  const { data: paymentStatus, isLoading: statusLoading } = useQuery<PaymentStatus>({
    queryKey: ['payment-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/payments/status/check`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to check payment status');
      const data = await response.json();
      return data.data;
    },
  });

  // Get payment history
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/payments/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.organizationId) {
        throw new Error('Organization ID not found');
      }

      const response = await fetch(`${API_URL}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          organizationId: user.organizationId,
          amount,
          currency: 'INR',
          paymentType: 'subscription',
          description: `Subscription payment - ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} plan`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.data?.razorpayOrder) {
        // Initialize Razorpay checkout
        const options = {
          key: data.data.razorpayOrder.key,
          amount: data.data.razorpayOrder.amount,
          currency: data.data.razorpayOrder.currency,
          name: 'Euroasiann ERP',
          description: `Subscription Payment - ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
          order_id: data.data.razorpayOrder.id,
          handler: async function (response: any) {
            // Verify payment on server
            try {
              const verifyResponse = await fetch(`${API_URL}/api/v1/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();
              
              if (verifyData.success) {
                showToast('Payment successful! Your subscription is now active.', 'success');
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                queryClient.invalidateQueries({ queryKey: ['payment-status'] });
                
                // Redirect to dashboard after successful payment
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 1500);
              } else {
                showToast(verifyData.error || 'Payment verification failed', 'error');
              }
            } catch (error: any) {
              showToast('Failed to verify payment: ' + error.message, 'error');
            }
          },
          prefill: {
            name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
            email: user?.email || '',
          },
          theme: {
            color: '#0066cc',
          },
          modal: {
            ondismiss: function() {
              showToast('Payment cancelled', 'info');
            },
          },
        };

        // Load Razorpay script dynamically (check if already loaded)
        if ((window as any).Razorpay) {
          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        } else {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
          };
          script.onerror = () => {
            showToast('Failed to load Razorpay. Please refresh and try again.', 'error');
          };
          document.body.appendChild(script);
        }
      } else {
        showToast('Payment order created, but Razorpay integration is not available', 'warning');
      }
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to initiate payment', 'error');
    },
  });

  const plans = [
    {
      name: 'Monthly Plan',
      price: 99,
      period: 'month',
      features: ['Up to 10 users', 'Unlimited vessels', 'Basic support', 'Standard features'],
    },
    {
      name: 'Yearly Plan',
      price: 999,
      period: 'year',
      features: ['Up to 10 users', 'Unlimited vessels', 'Priority support', 'All features', '20% savings'],
      popular: true,
    },
  ];

  const handlePayment = (amount: number) => {
    if (!paymentStatus?.hasActivePayment) {
      createPaymentMutation.mutate(amount);
    } else {
      showToast('You already have an active subscription', 'info');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <MdCheckCircle className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />;
      case 'failed':
        return <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'processing':
        return <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      default:
        return <MdInfo className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-[hsl(var(--foreground))] font-semibold';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'processing':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (statusLoading || paymentsLoading) {
    return (
      <div className="w-full min-h-screen p-8">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Subscription & Payment
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Manage your subscription and payment information
        </p>
      </div>

      {/* Payment Status Banner */}
      {paymentStatus && (
        <div className={cn(
          'p-6 rounded-2xl border-2 shadow-lg',
          paymentStatus.hasActivePayment
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        )}>
          <div className="flex items-center gap-4">
            {paymentStatus.hasActivePayment ? (
              <>
                <MdCheckCircle className="w-8 h-8 text-[hsl(var(--foreground))] font-semibold" />
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300">
                    Active Subscription
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Your subscription is active. You have full access to the portal.
                  </p>
                </div>
              </>
            ) : (
              <>
                <MdCancel className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="text-xl font-bold text-amber-900 dark:text-amber-300">
                    Payment Required
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400">
                    Please complete your subscription payment to access all portal features.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {!paymentStatus?.hasActivePayment && (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
              <MdCreditCard className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
              Choose Your Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select a subscription plan to continue using the portal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'p-6 rounded-xl border-2 transition-all',
                  plan.popular
                    ? 'border-[hsl(var(--primary))] bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-blue-300 dark:hover:border-blue-700'
                )}
              >
                {plan.popular && (
                  <div className="inline-block px-3 py-1 mb-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[hsl(var(--foreground))]">
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                      <MdCheckCircle className="w-5 h-5 text-[hsl(var(--foreground))] font-semibold flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePayment(plan.price)}
                  disabled={createPaymentMutation.isPending}
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-semibold transition-colors',
                    plan.popular
                      ? 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]'
                      : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white',
                    createPaymentMutation.isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {createPaymentMutation.isPending ? 'Processing...' : `Subscribe for ₹${plan.price}/${plan.period}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
            <MdHistory className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
            Payment History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View your past payment transactions
          </p>
        </div>

        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">
                    Period
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[hsl(var(--foreground))]">
                      {payment.currency === 'INR' ? '₹' : payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={cn('text-sm font-medium capitalize', getStatusColor(payment.status))}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {payment.transactionId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {payment.subscriptionPeriod ? (
                        <div className="text-sm">
                          <div>{new Date(payment.subscriptionPeriod.startDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">to</div>
                          <div>{new Date(payment.subscriptionPeriod.endDate).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center rounded-xl border border-[hsl(var(--border))]">
            <MdPayment className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">
              No payment history found
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Your payment transactions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

