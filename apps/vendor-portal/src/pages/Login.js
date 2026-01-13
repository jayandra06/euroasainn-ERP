import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdRocketLaunch, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdError } from 'react-icons/md';
import { cn } from '../lib/utils';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // Check payment status after login
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                    const response = await fetch(`${API_URL}/api/v1/payments/status/check`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        // If payment is not active, redirect to payment page
                        if (!data.data?.hasActivePayment) {
                            navigate('/payment');
                            return;
                        }
                    }
                    else if (response.status === 403) {
                        // Payment required - redirect to payment page
                        navigate('/payment');
                        return;
                    }
                }
                catch (paymentError) {
                    // If payment check fails, still allow access (will be checked by ProtectedRoute)
                    console.error('Payment status check error:', paymentError);
                }
            }
            // If payment is active or check failed, redirect to intended destination or dashboard
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
        catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <div className="w-full max-w-md">
        {/* Logo and Welcome */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 mb-4 shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/10">
            <MdRocketLaunch className="w-10 h-10 text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Euroasiann ERP
          </h1>
          <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">Vendor Portal</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-[hsl(var(--card))]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[hsl(var(--border))]/50 p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (<div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 animate-fade-in" role="alert">
                <MdError className="w-5 h-5 flex-shrink-0"/>
                <span className="text-sm font-semibold">{error}</span>
              </div>)}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-[hsl(var(--foreground))]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MdEmail className="w-5 h-5 text-[hsl(var(--muted-foreground))]"/>
                </div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] dark:focus:border-blue-400 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all duration-200 font-medium" placeholder="your.email@example.com"/>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-[hsl(var(--foreground))]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MdLock className="w-5 h-5 text-[hsl(var(--muted-foreground))]"/>
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] dark:focus:border-blue-400 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all duration-200 font-medium" placeholder="Enter your password"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  {showPassword ? <MdVisibilityOff className="w-5 h-5"/> : <MdVisibility className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className={cn('w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none', loading && 'cursor-wait')}>
              {loading ? (<span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in...
                </span>) : ('Sign In')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Need help?{' '}
            <a href="#" className="font-semibold text-[hsl(var(--foreground))] font-semibold hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=Login.js.map