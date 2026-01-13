/**
 * Admin Dashboard
 * Simplified dashboard matching the design
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../lib/api';
import { useToast } from '../components/shared/Toast';
import { MdRequestQuote, MdPeople, MdEmojiEmotions, MdStore, MdInventory, MdCategory, MdClose, } from 'react-icons/md';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
export function Dashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'admin',
    });
    // Fetch RFQs
    const { data: rfqs = [], isLoading: isLoadingRFQs } = useQuery({
        queryKey: ['dashboard-rfqs'],
        queryFn: async () => {
            try {
                const response = await authenticatedFetch('/api/v1/admin/rfq');
                if (!response.ok) {
                    // If endpoint fails, return empty array (admin might not have RFQs)
                    return [];
                }
                const data = await response.json();
                return (data.data || []);
            }
            catch (error) {
                // Return empty array on error
                return [];
            }
        },
    });
    // Fetch organizations
    const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
        queryKey: ['dashboard-organizations'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/organizations');
            if (!response.ok)
                throw new Error('Failed to fetch organizations');
            const data = await response.json();
            return data.data;
        },
    });
    // Fetch brands
    const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
        queryKey: ['dashboard-brands'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/brands');
            if (!response.ok)
                throw new Error('Failed to fetch brands');
            const data = await response.json();
            return data.data;
        },
    });
    // Fetch categories
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['dashboard-categories'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/categories');
            if (!response.ok)
                throw new Error('Failed to fetch categories');
            const data = await response.json();
            return data.data;
        },
    });
    // Calculate statistics
    const stats = useMemo(() => {
        const totalRFQs = rfqs.length;
        const totalMerchants = organizations.filter(org => org.type === 'vendor').length;
        const totalCustomers = organizations.filter(org => org.type === 'customer').length;
        const totalBrands = brands.length;
        const totalCategories = categories.length;
        // For "Total Items Send", we'll use RFQ items count or show 0 if not available
        const totalItemsSent = 0; // This would need a specific endpoint for items/orders
        return {
            totalRFQs,
            totalMerchants,
            totalCustomers,
            totalBrands,
            totalCategories,
            totalItemsSent,
        };
    }, [rfqs, organizations, brands, categories]);
    // Calculate monthly data for charts (last 6 months)
    const monthlyData = useMemo(() => {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthName = monthNames[monthDate.getMonth()];
            const rfqsInMonth = rfqs.filter(rfq => {
                if (!rfq.createdAt)
                    return false;
                const created = new Date(rfq.createdAt);
                return created >= monthDate && created <= monthEnd;
            }).length;
            data.push({
                name: `${monthName} ${monthDate.getFullYear().toString().slice(-2)}`,
                value: rfqsInMonth
            });
        }
        return data;
    }, [rfqs]);
    // Calculate visitor data (using organizations created as proxy)
    const visitorData = useMemo(() => {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthName = monthNames[monthDate.getMonth()];
            const orgsInMonth = organizations.filter(org => {
                if (!org.createdAt)
                    return false;
                const created = new Date(org.createdAt);
                return created >= monthDate && created <= monthEnd;
            }).length;
            data.push({
                name: `${monthName} ${monthDate.getFullYear().toString().slice(-2)}`,
                visitors: orgsInMonth
            });
        }
        return data;
    }, [organizations]);
    const isLoading = isLoadingRFQs || isLoadingOrgs || isLoadingBrands || isLoadingCategories;
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'admin',
        });
    };
    const handleSubmit = async () => {
        try {
            const response = await authenticatedFetch('/api/v1/admin/users/invite', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: formData.role,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to invite admin');
            }
            showToast('Admin invitation sent successfully!', 'success');
            handleCloseModal();
        }
        catch (error) {
            showToast(error.message || 'Failed to invite admin', 'error');
        }
    };
    return (<div className="w-full min-h-screen p-8 space-y-8">
      <div className="mb-8">
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total RFQs Received</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalRFQs.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdRequestQuote className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Merchants</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalMerchants.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdPeople className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Happy Customers</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalCustomers.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdEmojiEmotions className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Brands</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalBrands.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdStore className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Items Send</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalItemsSent.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <MdInventory className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Categories</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : stats.totalCategories.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <MdCategory className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Dashboard</h2>
          <button onClick={handleOpenModal} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
            Invite Admin
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Bar Chart - Multiple</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">January - June 2024</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
                <XAxis dataKey="name" stroke="#6b7280"/>
                <YAxis stroke="#6b7280"/>
                <Tooltip contentStyle={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
        }}/>
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              <p>
                {monthlyData.length > 1 && monthlyData[monthlyData.length - 1].value > monthlyData[monthlyData.length - 2].value
            ? `Trending up by ${((monthlyData[monthlyData.length - 1].value - monthlyData[monthlyData.length - 2].value) / Math.max(monthlyData[monthlyData.length - 2].value, 1) * 100).toFixed(1)}% this month`
            : monthlyData.length > 1 && monthlyData[monthlyData.length - 1].value < monthlyData[monthlyData.length - 2].value
                ? `Trending down by ${((monthlyData[monthlyData.length - 2].value - monthlyData[monthlyData.length - 1].value) / Math.max(monthlyData[monthlyData.length - 2].value, 1) * 100).toFixed(1)}% this month`
                : 'No change this month'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Showing RFQs for the last 6 months</p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Area Chart - Gradient</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Showing total visitors for the last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={visitorData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
                <XAxis dataKey="name" stroke="#6b7280"/>
                <YAxis stroke="#6b7280"/>
                <Tooltip contentStyle={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
        }}/>
                <Area type="monotone" dataKey="visitors" stroke="#6366f1" fillOpacity={1} fill="url(#colorVisitors)"/>
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              <p>
                {visitorData.length > 1 && visitorData[visitorData.length - 1].visitors > visitorData[visitorData.length - 2].visitors
            ? `Trending up by ${((visitorData[visitorData.length - 1].visitors - visitorData[visitorData.length - 2].visitors) / Math.max(visitorData[visitorData.length - 2].visitors, 1) * 100).toFixed(1)}% this month`
            : visitorData.length > 1 && visitorData[visitorData.length - 1].visitors < visitorData[visitorData.length - 2].visitors
                ? `Trending down by ${((visitorData[visitorData.length - 2].visitors - visitorData[visitorData.length - 1].visitors) / Math.max(visitorData[visitorData.length - 2].visitors, 1) * 100).toFixed(1)}% this month`
                : 'No change this month'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Showing organizations created for the last 6 months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Admin Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Invite Admin</h2>
              <button onClick={handleCloseModal} className="text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details to invite a new admin user.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Email
                  </label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter email address"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    First Name
                  </label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter first name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Last Name
                  </label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter last name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Role
                  </label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button onClick={handleCloseModal} className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
                Send Invitation
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=Dashboard.js.map