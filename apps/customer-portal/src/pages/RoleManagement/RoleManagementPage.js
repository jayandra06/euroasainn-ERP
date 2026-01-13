import React from 'react';
export function RoleManagementPage() {
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Manage Your Role</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors">
            Manage Roles
          </button>
          <button className="px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors">
            Manage Permission
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input type="text" placeholder="EMAIL ID" className="w-full px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"/>
      </div>

      {/* Empty State */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-12 text-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No Record Found</p>
      </div>
    </div>);
}
//# sourceMappingURL=RoleManagementPage.js.map