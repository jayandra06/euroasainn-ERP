/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 * Updated: Admin Users → Role Management dropdown
 */
// import React, { useState } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import {
//   MdDashboard,
//   MdPeople,
//   MdBusinessCenter,
//   MdVpnKey,
//   MdAdminPanelSettings,
//   MdSettings,
//   MdChevronLeft,
//   MdChevronRight,
//   MdRocketLaunch,
//   MdLogout,
//   MdBarChart,
//   MdAssignment,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowRight,
//   MdSecurity,
//   MdPersonAdd,
// } from "react-icons/md";
// import { IconType } from "react-icons";
// import { cn } from "../../lib/utils";
// import { useAuth } from "../../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// interface NavItem {
//   path?: string;
//   label: string;
//   icon: IconType;
//   badge?: string;
//   children?: { path: string; label: string; icon: IconType }[];
// }
// const navItems: NavItem[] = [
//   { path: "/dashboard", label: "Dashboard", icon: MdDashboard },
//   { path: "/users", label: "Users", icon: MdPeople },
//   { path: "/organizations", label: "Organizations", icon: MdBusinessCenter },
//   { path: "/onboarding-data", label: "Onboarding", icon: MdAssignment },
//   { path: "/licenses", label: "Licenses", icon: MdVpnKey },
//   // ⭐ NEW ROLE MANAGEMENT DROPDOWN
//   {
//     label: "Role Management",
//     icon: MdAdminPanelSettings,
//     children: [
//       { path: "/roles", label: "Roles & Permissions", icon: MdSecurity },
//       { path: "/assign-roles", label: "Assign Roles", icon: MdPersonAdd },
//     ],
//   },
//   { path: "/analytics", label: "Analytics", icon: MdBarChart },
//   { path: "/settings", label: "Settings", icon: MdSettings },
// ];
// interface SidebarProps {
//   collapsed: boolean;
//   onToggle: (collapsed: boolean) => void;
// }
// export function Sidebar({ collapsed, onToggle }: SidebarProps) {
//   const location = useLocation();
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [openMenu, setOpenMenu] = useState<string | null>("Role Management");
//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate("/login");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };
//   return (
//     <aside
//       className={cn(
//         "fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col",
//         collapsed ? "w-20" : "w-72"
//       )}
//     >
//       {/* Logo Section */}
//       <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
//         <div className={cn("flex items-center gap-3 flex-1 min-w-0", collapsed && "justify-center")}>
//           <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
//             <MdRocketLaunch className="w-6 h-6 text-white" />
//           </div>
//           {!collapsed && (
//             <div className="flex-1 min-w-0">
//               <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">Euroasiann ERP</h1>
//               <p className="text-xs text-[hsl(var(--muted-foreground))]">Tech Portal</p>
//             </div>
//           )}
//         </div>
//         <button
//           onClick={() => onToggle(!collapsed)}
//           className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
//         >
//           {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
//         </button>
//       </div>
//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
//         {navItems.map((item) => {
//           // ================= DROPDOWN MENU ==================
//           if (item.children) {
//             const isOpen = openMenu === item.label;
//             return (
//               <div key={item.label}>
//                 <button
//                   onClick={() => setOpenMenu(isOpen ? null : item.label)}
//                   className={cn(
//                     "group relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
//                     collapsed && "justify-center px-2",
//                     "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
//                   )}
//                 >
//                   <div className="flex items-center gap-3">
//                     <item.icon className="w-5 h-5" />
//                     {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
//                   </div>
//                   {!collapsed &&
//                     (isOpen ? (
//                       <MdKeyboardArrowDown className="w-4 h-4" />
//                     ) : (
//                       <MdKeyboardArrowRight className="w-4 h-4" />
//                     ))}
//                 </button>
//                 {!collapsed && isOpen && (
//                   <div className="ml-10 mt-2 space-y-1">
//                     {item.children.map((child) => {
//                       const isActive = location.pathname === child.path;
//                       return (
//                         <NavLink
//                           key={child.path}
//                           to={child.path}
//                           className={cn(
//                             "flex items-center gap-3 px-2 py-2 text-sm rounded-md transition",
//                             isActive
//                               ? "text-[hsl(var(--primary))] font-semibold"
//                               : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
//                           )}
//                         >
//                           <child.icon className="w-4 h-4" />
//                           {child.label}
//                         </NavLink>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           }
//           // ================= SINGLE MENU ITEM ==================
//           const isActive = item.path && location.pathname.startsWith(item.path);
//           return (
//             <NavLink
//               key={item.path}
//               to={item.path!}
//               className={cn(
//                 "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
//                 collapsed && "justify-center px-2",
//                 isActive
//                   ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold"
//                   : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
//               )}
//             >
//               <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-[hsl(var(--primary))]")} />
//               {!collapsed && (
//                 <>
//                   <span className="flex-1 text-sm font-medium">{item.label}</span>
//                   {item.badge && (
//                     <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-[hsl(var(--primary))]">
//                       {item.badge}
//                     </span>
//                   )}
//                 </>
//               )}
//             </NavLink>
//           );
//         })}
//       </nav>
//       {/* User Section */}
//       <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
//         {!collapsed && (
//           <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] mb-3">
//             <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
//               {user?.firstName?.[0] || user?.email?.[0] || "A"}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
//                 {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
//               </p>
//               <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.role || "Admin"}</p>
//             </div>
//           </div>
//         )}
//         <button
//           onClick={handleLogout}
//           className={cn(
//             "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 transition-colors",
//             collapsed && "justify-center"
//           )}
//         >
//           <MdLogout className="w-4 h-4" />
//           {!collapsed && "Logout"}
//         </button>
//       </div>
//     </aside>
//   );
// }
/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 * FINAL: Permission-aware with professional Role Management
//  */
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MdDashboard, MdPeople, MdBusinessCenter, MdVpnKey, MdAdminPanelSettings, MdSettings, MdChevronLeft, MdChevronRight, MdRocketLaunch, MdLogout, MdBarChart, MdAssignment, MdKeyboardArrowDown, MdKeyboardArrowRight, MdSecurity, MdPersonAdd, } from "react-icons/md";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
const navItems = [
    // Dashboard (always visible)
    {
        path: "/dashboard",
        label: "Dashboard",
        icon: MdDashboard,
    },
    // Users
    {
        path: "/users",
        label: "Users",
        icon: MdPeople,
        permission: "techUsersView",
    },
    // Organizations
    {
        path: "/organizations",
        label: "Organizations",
        icon: MdBusinessCenter,
        permission: "organizationsView",
    },
    // Onboarding
    {
        path: "/onboarding-data",
        label: "Onboarding",
        icon: MdAssignment,
        permission: "onboardingView",
    },
    // Licenses
    {
        path: "/licenses",
        label: "Licenses",
        icon: MdVpnKey,
        permission: "licensesView",
    },
    // ⭐ ROLE MANAGEMENT DROPDOWN
    {
        label: "Role Management",
        icon: MdAdminPanelSettings,
        children: [
            {
                path: "/roles",
                label: "Roles & Permissions",
                icon: MdSecurity,
                // ⭐ user must have ANY role permission
                permission: "rolesView",
            },
            {
                path: "/assign-roles",
                label: "Assign Roles",
                icon: MdPersonAdd,
                // ⭐ match your earlier design
                permission: "assignRolesView",
            },
        ],
    },
    // Analytics
    {
        path: "/analytics",
        label: "Analytics",
        icon: MdBarChart,
    },
    // Settings
    {
        path: "/settings",
        label: "Settings",
        icon: MdSettings,
    },
];
export function Sidebar({ collapsed, onToggle }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, permissions, logout } = useAuth();
    const [openMenu, setOpenMenu] = useState("Role Management");
    const hasPermission = (perm) => {
        if (!perm)
            return true;
        return permissions.includes(perm);
    };
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };
    return (<aside className={cn("fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col", collapsed ? "w-20" : "w-72")}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(var(--border))]">
        <div className={cn("flex items-center gap-3 flex-1 min-w-0", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <MdRocketLaunch className="w-6 h-6 text-white"/>
          </div>
          {!collapsed && (<div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">
                Euroasiann ERP
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Tech Portal
              </p>
            </div>)}
        </div>

        <button onClick={() => onToggle(!collapsed)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]">
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems
            .filter((item) => {
            if (!item.permission && !item.children)
                return true;
            if (item.permission)
                return hasPermission(item.permission);
            if (item.children) {
                return item.children.some((child) => hasPermission(child.permission));
            }
            return false;
        })
            .map((item) => {
            if (item.children) {
                const isOpen = openMenu === item.label;
                return (<div key={item.label}>
                  <button onClick={() => setOpenMenu(isOpen ? null : item.label)} className={cn("group relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 w-full", collapsed && "justify-center px-2", "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]")}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5"/>
                      {!collapsed && (<span className="text-sm font-medium">
                          {item.label}
                        </span>)}
                    </div>

                    {!collapsed &&
                        (isOpen ? (<MdKeyboardArrowDown className="w-4 h-4"/>) : (<MdKeyboardArrowRight className="w-4 h-4"/>))}
                  </button>

                  {!collapsed && isOpen && (<div className="ml-10 mt-2 space-y-1">
                      {item.children
                            .filter((child) => hasPermission(child.permission))
                            .map((child) => {
                            const isActive = location.pathname === child.path;
                            return (<NavLink key={child.path} to={child.path} className={cn("flex items-center gap-3 px-2 py-2 text-sm rounded-md transition", isActive
                                    ? "text-[hsl(var(--primary))] font-semibold"
                                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]")}>
                              <child.icon className="w-4 h-4"/>
                              {child.label}
                            </NavLink>);
                        })}
                    </div>)}
                </div>);
            }
            const isActive = item.path && location.pathname.startsWith(item.path);
            return (<NavLink key={item.path} to={item.path} className={cn("group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200", collapsed && "justify-center px-2", isActive
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold"
                    : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]")}>
                <item.icon className="w-5 h-5"/>
                {!collapsed && (<span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>)}
              </NavLink>);
        })}
      </nav>

      {/* USER SECTION */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        {!collapsed && (<div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || user?.email?.[0] || "A"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.firstName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {user?.role || "Admin"}
              </p>
            </div>
          </div>)}

        <button onClick={handleLogout} className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 transition-colors", collapsed && "justify-center")}>
          <MdLogout className="w-4 h-4"/>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>);
}
/**
 * Ultra-Modern Sidebar Component
 * World-Class SaaS ERP Platform Design
 * FINAL: Original order + permission based
 */
// import React, { useState } from "react";
// import { NavLink, useLocation, useNavigate } from "react-router-dom";
// import {
//   MdDashboard,
//   MdPeople,
//   MdBusinessCenter,
//   MdVpnKey,
//   MdAdminPanelSettings,
//   MdSettings,
//   MdChevronLeft,
//   MdChevronRight,
//   MdRocketLaunch,
//   MdLogout,
//   MdBarChart,
//   MdAssignment,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowRight,
//   MdSecurity,
//   MdPersonAdd,
// } from "react-icons/md";
// import { IconType } from "react-icons";
// import { cn } from "../../lib/utils";
// import { useAuth } from "../../context/AuthContext";
// /* ---------------- TYPES ---------------- */
// interface NavItem {
//   path?: string;
//   label: string;
//   icon: IconType;
//   public?: boolean;
//   permission?: string;
//   children?: {
//     path: string;
//     label: string;
//     icon: IconType;
//     permission: string;
//   }[];
// }
// /* ---------------- MENU CONFIG (EXACT ORDER) ---------------- */
// const navItems: NavItem[] = [
//   // 1️⃣ Dashboard (always visible)
//   {
//     path: "/dashboard",
//     label: "Dashboard",
//     icon: MdDashboard,
//     public: true,
//   },
//   // 2️⃣ Users
//   {
//     path: "/users",
//     label: "Users",
//     icon: MdPeople,
//     permission: "techUsersView",
//   },
//   // 3️⃣ Organizations
//   {
//     path: "/organizations",
//     label: "Organizations",
//     icon: MdBusinessCenter,
//     permission: "organizationsView",
//   },
//   // 4️⃣ Onboarding
//   {
//     path: "/onboarding-data",
//     label: "Onboarding",
//     icon: MdAssignment,
//     permission: "onboardingView",
//   },
//   // 5️⃣ Licenses
//   {
//     path: "/licenses",
//     label: "Licenses",
//     icon: MdVpnKey,
//     permission: "licensesView",
//   },
//   // 6️⃣ Role Management (dropdown)
//   {
//     label: "Role Management",
//     icon: MdAdminPanelSettings,
//     children: [
//       {
//         path: "/roles",
//         label: "Roles & Permissions",
//         icon: MdSecurity,
//         permission: "manageRoles",
//       },
//       {
//         path: "/assign-roles",
//         label: "Assign Roles",
//         icon: MdPersonAdd,
//         permission: "manageRoles",
//       },
//     ],
//   },
//   // 7️⃣ Analytics (always visible)
//   {
//     path: "/analytics",
//     label: "Analytics",
//     icon: MdBarChart,
//     public: true,
//   },
//   // 8️⃣ Settings (always visible)
//   {
//     path: "/settings",
//     label: "Settings",
//     icon: MdSettings,
//     public: true,
//   },
// ];
// /* ---------------- COMPONENT ---------------- */
// interface SidebarProps {
//   collapsed: boolean;
//   onToggle: (collapsed: boolean) => void;
// }
// export function Sidebar({ collapsed, onToggle }: SidebarProps) {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { user, permissions, logout } = useAuth();
//   const [openMenu, setOpenMenu] = useState<string | null>("Role Management");
//   const hasPermission = (perm?: string) => {
//     if (!perm) return true;
//     return permissions.includes(perm);
//   };
//   const handleLogout = async () => {
//     await logout();
//     navigate("/login");
//   };
//   return (
//     <aside
//       className={cn(
//         "fixed left-0 top-0 z-50 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col",
//         collapsed ? "w-20" : "w-72"
//       )}
//     >
//       {/* LOGO */}
//       <div className="flex items-center justify-between px-6 py-5 border-b">
//         <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
//           <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
//             <MdRocketLaunch className="w-6 h-6 text-white" />
//           </div>
//           {!collapsed && (
//             <div>
//               <h1 className="text-lg font-bold">Euroasiann ERP</h1>
//               <p className="text-xs text-muted-foreground">Tech Portal</p>
//             </div>
//           )}
//         </div>
//         <button onClick={() => onToggle(!collapsed)}>
//           {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
//         </button>
//       </div>
//       {/* NAVIGATION */}
//       <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
//         {navItems
//           .filter((item) => {
//             if (item.public) return true;
//             if (item.permission) return hasPermission(item.permission);
//             if (item.children)
//               return item.children.some((c) => hasPermission(c.permission));
//             return false;
//           })
//           .map((item) => {
//             if (item.children) {
//               const isOpen = openMenu === item.label;
//               return (
//                 <div key={item.label}>
//                   <button
//                     onClick={() => setOpenMenu(isOpen ? null : item.label)}
//                     className={cn(
//                       "flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-muted",
//                       collapsed && "justify-center"
//                     )}
//                   >
//                     <div className="flex items-center gap-3">
//                       <item.icon className="w-5 h-5" />
//                       {!collapsed && <span>{item.label}</span>}
//                     </div>
//                     {!collapsed &&
//                       (isOpen ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />)}
//                   </button>
//                   {!collapsed && isOpen && (
//                     <div className="ml-10 mt-2 space-y-1">
//                       {item.children
//                         .filter((c) => hasPermission(c.permission))
//                         .map((child) => (
//                           <NavLink
//                             key={child.path}
//                             to={child.path}
//                             className={cn(
//                               "flex items-center gap-3 px-2 py-2 text-sm rounded-md",
//                               location.pathname === child.path
//                                 ? "text-primary font-semibold"
//                                 : "text-muted-foreground hover:text-foreground"
//                             )}
//                           >
//                             <child.icon className="w-4 h-4" />
//                             {child.label}
//                           </NavLink>
//                         ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             }
//             const isActive =
//               item.path && location.pathname.startsWith(item.path);
//             return (
//               <NavLink
//                 key={item.path}
//                 to={item.path!}
//                 className={cn(
//                   "flex items-center gap-3 px-3 py-2.5 rounded-lg",
//                   collapsed && "justify-center",
//                   isActive
//                     ? "bg-primary/10 text-primary font-semibold"
//                     : "hover:bg-muted"
//                 )}
//               >
//                 <item.icon className="w-5 h-5" />
//                 {!collapsed && <span>{item.label}</span>}
//               </NavLink>
//             );
//           })}
//       </nav>
//       {/* USER */}
//       <div className="p-4 border-t">
//         {!collapsed && (
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
//               {user?.firstName?.[0] || "A"}
//             </div>
//             <div>
//               <p className="text-sm font-semibold">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <p className="text-xs text-muted-foreground">{user?.role}</p>
//             </div>
//           </div>
//         )}
//         <button
//           onClick={handleLogout}
//           className={cn(
//             "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-100",
//             collapsed && "justify-center"
//           )}
//         >
//           <MdLogout />
//           {!collapsed && "Logout"}
//         </button>
//       </div>
//     </aside>
//   );
// }
//# sourceMappingURL=Sidebar.js.map