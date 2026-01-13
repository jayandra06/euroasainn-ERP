/**
 * Custom Sidebar Toggle Icon
 * Shows different layouts based on sidebar state:
 * - Collapsed: Small left panel (sidebar), large right panel (content)
 * - Expanded: Two equal panels (sidebar and content)
 */
export function SidebarToggleIcon({ className = "w-5 h-5", collapsed = false }) {
    // When collapsed: small left panel (~30% width), large right panel (~70% width)
    // When expanded: two equal panels (50% each)
    // Starting from x=4, total width 16, so:
    // - Collapsed: divider at ~4 + (16 * 0.3) = ~8.8
    // - Expanded: divider at center 4 + 8 = 12
    const dividerX = collapsed ? 8.8 : 12;
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Rounded rectangle outline */}
      <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" fill="none"/>
      {/* Vertical divider line - position changes based on collapsed state */}
      <line x1={dividerX} y1="6" x2={dividerX} y2="18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>);
}
//# sourceMappingURL=SidebarToggleIcon.js.map