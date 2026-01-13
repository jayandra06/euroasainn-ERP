import React from 'react';
export function BecomeAVendorPage() {
    return (<div className="w-full space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Become a Vendor</h1>

      {/* Form */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-8 border border-[hsl(var(--border))] space-y-8">
        {/* Vendor Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">Vendor Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Business Email <span className="text-red-500">*</span>
              </label>
              <input type="email" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Select Brands <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
                <option>Select Brand</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Select Models <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
                <option>Select Model</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Select Categories <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
                <option>Select Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">Business Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Tax ID <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Warehouse Address <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
          </div>
        </div>

        {/* Managing Directory Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">Managing Directory Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Managing Directory <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Managing Directory Email <span className="text-red-500">*</span>
              </label>
              <input type="email" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Managing Directory Personal Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Managing Directory Desk Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Port <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
          </div>
        </div>

        {/* Sales Manager Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">Sales Manager Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Sales Manager Name <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Sales Manager Email <span className="text-red-500">*</span>
              </label>
              <input type="email" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Sales Manager Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
                Sales Manager Desk Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
            </div>
          </div>
        </div>

        {/* Logistic Service Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">Logistic Service Details</h2>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Enter Logistic Service <span className="text-red-500">*</span>
            </label>
            <input type="text" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"/>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button className="px-8 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors text-lg">
            Become a Vendor
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=BecomeAVendorPage.js.map