/**
 * Polished Modern Login Page
 * Professional Enterprise Authentication
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdRocketLaunch, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdError } from 'react-icons/md';
import { cn } from '../lib/utils';
function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-500 dark:via-blue-400 dark:to-indigo-500 mb-4 shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/50 ring-4 ring-blue-500/10 dark:ring-blue-400/20">
            <MdRocketLaunch className="w-10 h-10 text-white"/>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Euroasiann ERP
          </h1>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Tech Portal</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (<div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 animate-fade-in" role="alert">
                <MdError className="w-5 h-5 flex-shrink-0"/>
                <span className="text-sm font-semibold">{error}</span>
              </div>)}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MdEmail className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all duration-200 font-medium" placeholder="your.email@example.com"/>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MdLock className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all duration-200 font-medium" placeholder="Enter your password"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  {showPassword ? (<MdVisibilityOff className="w-5 h-5"/>) : (<MdVisibility className="w-5 h-5"/>)}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className={cn('w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-500 dark:via-blue-400 dark:to-indigo-500 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/40 dark:hover:shadow-blue-500/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none', loading && 'cursor-wait')}>
              {loading ? (<span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in...
                </span>) : ('Sign In')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{' '}
            <a href="#" className="font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>);
}
export default Login;
//# sourceMappingURL=Login.js.map