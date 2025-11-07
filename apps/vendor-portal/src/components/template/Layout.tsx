import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function TemplateLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <Header sidebarCollapsed={sidebarCollapsed} onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 w-full overflow-y-auto">
          <div className="w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}






