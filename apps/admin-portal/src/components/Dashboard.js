import React from 'react';
import { ThemeToggle } from './ThemeToggle';
export const Dashboard = () => {
    return (<div className="min-h-screen bg-primary text-text-primary transition-colors duration-200">
      <nav className="border-b border-[hsl(var(--border))] bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">
              Admin Dashboard
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample Card */}
          <div className="bg-[hsl(var(--card))] shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-[hsl(var(--foreground))] mb-2">
              Sample Card
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              This card demonstrates the dark mode transition. The content will
              adapt to the current theme automatically.
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-[hsl(var(--card))] shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-[hsl(var(--foreground))] mb-2">
              Statistics
            </h2>
            <div className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">
              1,234
            </div>
            <p className="text-gray-600 dark:text-gray-300">Total Users</p>
          </div>

          {/* Activity Card */}
          <div className="bg-[hsl(var(--card))] shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-[hsl(var(--foreground))] mb-2">
              Recent Activity
            </h2>
            <ul className="space-y-3">
              <li className="text-gray-600 dark:text-gray-300">
                New user registration
              </li>
              <li className="text-gray-600 dark:text-gray-300">
                Order #123 completed
              </li>
              <li className="text-gray-600 dark:text-gray-300">
                System update scheduled
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>);
};
//# sourceMappingURL=Dashboard.js.map