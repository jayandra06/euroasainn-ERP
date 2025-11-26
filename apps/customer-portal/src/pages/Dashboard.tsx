import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdDescription, MdLocalShipping, MdPeople, MdBusinessCenter } from 'react-icons/md';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards = [
    {
      title: 'RFQ Management',
      description: 'Manage Request for Quotations',
      icon: MdDescription,
      path: '/rfqs',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Vessel Management',
      description: 'Manage vessels',
      icon: MdLocalShipping,
      path: '/vessels',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Employee Management',
      description: 'Manage employees',
      icon: MdPeople,
      path: '/employees',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Business Units',
      description: 'Manage business units',
      icon: MdBusinessCenter,
      path: '/business-units',
      color: 'from-orange-500 to-amber-600',
    },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
          Welcome back, {user?.firstName || 'Customer'}! 👋
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Customer Portal Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}






