import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdSearch, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
export function CustomersPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('accepted');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        phone: '',
        primaryContact: '',
        numberOfVessels: '',
    });
    // Fetch customers
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers', activeTab],
        queryFn: async () => {
            const status = activeTab === 'accepted' ? 'accepted' : 'pending';
            const response = await authenticatedFetch(`/api/v1/admin/customers?status=${status}`);
            if (!response.ok)
                throw new Error('Failed to fetch customers');
            const data = await response.json();
            return data.data || [];
        },
    });
    // Filter customers by search query
    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim())
            return customers;
        const query = searchQuery.toLowerCase();
        return customers.filter((customer) => customer.companyName.toLowerCase().includes(query) ||
            customer.email.toLowerCase().includes(query) ||
            customer.phoneNumber.toLowerCase().includes(query) ||
            customer.primaryContact.toLowerCase().includes(query));
    }, [customers, searchQuery]);
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            companyName: '',
            email: '',
            phone: '',
            primaryContact: '',
            numberOfVessels: '',
        });
    };
    const handleSubmit = () => {
        // TODO: Implement submit logic
        console.log('Add Customer:', formData);
        handleCloseModal();
    };
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">All Customers</h1>
        </div>
        <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
          <MdAdd className="w-5 h-5"/>
          Add Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[hsl(var(--border))]">
        <button onClick={() => setActiveTab('accepted')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'accepted'
            ? 'border-blue-600 text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
          Accepted
        </button>
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending'
            ? 'border-blue-600 text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
          Pending
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
          <input type="text" placeholder="Search customers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(var(--secondary))]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">S. No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Primary Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">no. of Vessels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-[hsl(var(--card))] divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (<tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    Loading customers...
                  </td>
                </tr>) : filteredCustomers.length === 0 ? (<tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    {activeTab === 'accepted'
                ? "No accepted customers found. A list of all accepted Customers."
                : "No pending customers found. A list of all pending Customers."}
                  </td>
                </tr>) : (filteredCustomers.map((customer, index) => (<tr key={customer._id} className="hover:bg-[hsl(var(--secondary))]/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                      {customer.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {customer.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {customer.primaryContact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      {customer.numberOfVessels}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
                          <MdEdit className="w-5 h-5"/>
                        </button>
                        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                          <MdDelete className="w-5 h-5"/>
                        </button>
                      </div>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Add New Customer</h2>
              <button onClick={handleCloseModal} className="text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details for the new customer.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Company Name
                  </label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter company name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Email
                  </label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter email address"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Phone Number
                  </label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter phone number"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Primary Contact
                  </label>
                  <input type="text" value={formData.primaryContact} onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter primary contact name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Number of Vessels
                  </label>
                  <input type="number" value={formData.numberOfVessels} onChange={(e) => setFormData({ ...formData, numberOfVessels: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter number of vessels"/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button onClick={handleCloseModal} className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors">
                Add Customer
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=CustomersPage.js.map