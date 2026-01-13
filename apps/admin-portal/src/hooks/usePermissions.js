import { useAuth } from '../context/AuthContext';
// Define permissions for each role
const ROLE_PERMISSIONS = {
    super_admin: [
        'view_all_metrics',
        'view_financial_metrics',
        'view_revenue_expenses',
        'view_operating_expenses',
        'view_customer_metrics',
        'view_vendor_metrics',
        'view_product_performance',
        'view_regional_performance',
        'view_organization_types',
        'view_license_status',
        'view_notifications',
        'export_reports',
        'drill_down_details',
    ],
    admin: [
        'view_all_metrics',
        'view_financial_metrics',
        'view_revenue_expenses',
        'view_operating_expenses',
        'view_customer_metrics',
        'view_vendor_metrics',
        'view_product_performance',
        'view_regional_performance',
        'view_organization_types',
        'view_license_status',
        'view_notifications',
        'export_reports',
        'drill_down_details',
    ],
    finance_manager: [
        'view_financial_metrics',
        'view_revenue_expenses',
        'view_operating_expenses',
        'view_product_performance',
        'view_notifications',
        'export_reports',
        'drill_down_details',
    ],
    finance: [
        'view_financial_metrics',
        'view_revenue_expenses',
        'view_operating_expenses',
        'view_notifications',
        'export_reports',
    ],
    regional_manager: [
        'view_customer_metrics',
        'view_regional_performance',
        'view_product_performance',
        'view_notifications',
        'drill_down_details',
    ],
    vendor_manager: [
        'view_vendor_metrics',
        'view_product_performance',
        'view_regional_performance',
        'view_notifications',
        'drill_down_details',
    ],
    hr_manager: [
        'view_customer_metrics',
        'view_notifications',
    ],
    support_staff: [
        'view_customer_metrics',
        'view_vendor_metrics',
        'view_notifications',
    ],
    customer_service: [
        'view_customer_metrics',
        'view_notifications',
    ],
};
/**
 * Hook to check user permissions for analytics features
 */
export function usePermissions() {
    const { user } = useAuth();
    const getRole = () => {
        if (!user?.role)
            return 'support_staff';
        const roleLower = user.role.toLowerCase().replace(/\s+/g, '_');
        // Map common role variations
        if (roleLower.includes('super') || roleLower === 'super_admin') {
            return 'super_admin';
        }
        if (roleLower.includes('admin') && !roleLower.includes('super')) {
            return 'admin';
        }
        if (roleLower.includes('finance') && roleLower.includes('manager')) {
            return 'finance_manager';
        }
        if (roleLower.includes('finance')) {
            return 'finance';
        }
        if (roleLower.includes('regional') && roleLower.includes('manager')) {
            return 'regional_manager';
        }
        if (roleLower.includes('vendor') && roleLower.includes('manager')) {
            return 'vendor_manager';
        }
        if (roleLower.includes('hr') && roleLower.includes('manager')) {
            return 'hr_manager';
        }
        if (roleLower.includes('support')) {
            return 'support_staff';
        }
        if (roleLower.includes('customer') && roleLower.includes('service')) {
            return 'customer_service';
        }
        // Default fallback
        return roleLower;
    };
    const hasPermission = (permission) => {
        const role = getRole();
        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission) || permissions.includes('view_all_metrics');
    };
    const hasAnyPermission = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };
    const hasAllPermissions = (permissions) => {
        return permissions.every(permission => hasPermission(permission));
    };
    return {
        role: getRole(),
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        user,
    };
}
//# sourceMappingURL=usePermissions.js.map