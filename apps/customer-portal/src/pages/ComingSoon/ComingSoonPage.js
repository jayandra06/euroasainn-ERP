import React from 'react';
import { MdConstruction } from 'react-icons/md';
export function ComingSoonPage({ title, description, icon: Icon }) {
    const DisplayIcon = Icon || MdConstruction;
    return (<div className="w-full min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(var(--primary))] opacity-20 blur-3xl rounded-full"></div>
            <div className="relative bg-[hsl(var(--card))] p-8 rounded-full border-2 border-[hsl(var(--border))]">
              <DisplayIcon className="w-24 h-24 text-[hsl(var(--primary))]"/>
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--foreground))] mb-4">
          {title}
        </h1>
        
        <div className="inline-block px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-full text-sm font-semibold mb-6">
          Coming Soon
        </div>
        
        {description && (<p className="text-lg text-[hsl(var(--muted-foreground))] mb-8">
            {description}
          </p>)}
        
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          We're working hard to bring you this feature. Stay tuned for updates!
        </p>
      </div>
    </div>);
}
//# sourceMappingURL=ComingSoonPage.js.map