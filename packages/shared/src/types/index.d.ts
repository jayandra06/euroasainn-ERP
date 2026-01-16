export declare enum PortalType {
    TECH = "tech",
    ADMIN = "admin",
    CUSTOMER = "customer",
    VENDOR = "vendor"
}
export declare enum TechRole {
    TECH_ADMIN = "tech_admin",
    TECH_MANAGER = "tech_manager",
    TECH_DEVELOPER = "tech_developer",
    TECH_SUPPORT = "tech_support",
    TECH_LEAD = "tech_lead"
}
export declare enum AdminRole {
    ADMIN_SYSTEM_ADMIN = "admin_system_admin",
    ADMIN_SUPERUSER = "admin_superuser",
    ADMIN_USER = "admin_user"
}
export declare enum VendorRole {
    VENDOR_ADMIN = "vendor_admin",
    VENDOR_MANAGER = "vendor_manager"
}
export declare enum CustomerRole {
    CUSTOMER_ADMIN = "customer_admin",
    CUSTOMER_MANAGER = "customer_manager"
}
export declare enum OrganizationType {
    ADMIN = "admin",
    CUSTOMER = "customer",
    VENDOR = "vendor"
}
export declare enum LicenseStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    SUSPENDED = "suspended",
    REVOKED = "revoked"
}
export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';
export interface JwtPayload {
    userId: string;
    email: string;
    organizationId: string;
    portalType: PortalType;
    role: string;
}
//# sourceMappingURL=index.d.ts.map