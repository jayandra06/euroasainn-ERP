// packages/casbin-config/src/permission-casbin.map.ts
export const PERMISSION_TO_CASBIN = {
    /* ================= ADMIN ================= */
    // Admin Users
    adminUsersCreate: { obj: "admin_users", act: "create" },
    adminUsersUpdate: { obj: "admin_users", act: "update" },
    adminUsersDisable: { obj: "admin_users", act: "disable" },
    adminUsersView: { obj: "admin_users", act: "view" },
    // Organizations
    customerOrgsManage: { obj: "organizations", act: "manage" },
    vendorOrgsManage: { obj: "organizations", act: "manage" },
    // Licenses
    licenseView: { obj: "licenses", act: "view" },
    licensesView: { obj: "licenses", act: "view" }, // alias (safe)
    licensesIssue: { obj: "licenses", act: "issue" },
    licensesRevoke: { obj: "licenses", act: "revoke" },
    // 🔥 ONBOARDING (THIS WAS REQUIRED)
    onboardingView: { obj: "onboarding", act: "view" },
    onboardingManage: { obj: "onboarding", act: "manage" },
    // System
    systemSettingsManage: { obj: "system_settings", act: "manage" },
    securityPoliciesManage: { obj: "security_policies", act: "manage" },
    // Logs
    auditLogsView: { obj: "audit_logs", act: "view" },
    // RFQ
    adminRfqView: { obj: "admin_rfq", act: "view" },
    adminRfqManage: { obj: "admin_rfq", act: "manage" },
    /* ================= TECH ================= */
    techUsersCreate: { obj: "tech_users", act: "create" },
    techUsersUpdate: { obj: "tech_users", act: "update" },
    techUsersDelete: { obj: "tech_users", act: "delete" },
    techUsersView: { obj: "tech_users", act: "view" },
    organizationsCreate: { obj: "organizations", act: "create" },
    organizationsUpdate: { obj: "organizations", act: "update" },
    organizationsDelete: { obj: "organizations", act: "delete" },
    organizationsView: { obj: "organizations", act: "view" },
    // licensesView:   { obj: "licenses", act: "view" },
    // licensesIssue:  { obj: "licenses", act: "issue" },
    // licensesRevoke: { obj: "licenses", act: "revoke" },
    onboardingViewTech: { obj: "onboarding", act: "view" },
    onboardingManageTech: { obj: "onboarding", act: "manage" },
    rolesView: { obj: "roles", act: "view" },
    rolesCreate: { obj: "roles", act: "create" },
    rolesUpdate: { obj: "roles", act: "update" },
    rolesDelete: { obj: "roles", act: "delete" },
    assignRolesView: { obj: "assign_roles", act: "view" },
    assignRolesAssign: { obj: "assign_roles", act: "assign" },
    assignRolesUpdate: { obj: "assign_roles", act: "update" },
    assignRolesRemove: { obj: "assign_roles", act: "remove" },
    /* ================= CUSTOMER ================= */
    rfqView: { obj: "rfq", act: "view" },
    rfqManage: { obj: "rfq", act: "manage" },
    vesselsView: { obj: "vessels", act: "view" },
    vesselsManage: { obj: "vessels", act: "manage" },
    crewView: { obj: "crew", act: "view" },
    crewManage: { obj: "crew", act: "manage" },
    financeView: { obj: "finance", act: "view" },
    financeManage: { obj: "finance", act: "manage" },
    customerBillingView: { obj: "billing", act: "view" },
    customerBillingManage: { obj: "billing", act: "manage" },
    documentsView: { obj: "documents", act: "view" },
    documentsUpload: { obj: "documents", act: "upload" },
    claimView: { obj: "claims", act: "view" },
    claimManage: { obj: "claims", act: "manage" },
    /* ================= VENDOR ================= */
    catalogueView: { obj: "catalogue", act: "view" },
    catalogueManage: { obj: "catalogue", act: "manage" },
    inventoryView: { obj: "inventory", act: "view" },
    inventoryManage: { obj: "inventory", act: "manage" },
    quotationView: { obj: "quotation", act: "view" },
    quotationManage: { obj: "quotation", act: "manage" },
    vendorBillingView: { obj: "billing", act: "view" },
    vendorBillingManage: { obj: "billing", act: "manage" },
    vendorDocumentsView: { obj: "vendor_documents", act: "view" },
    vendorDocumentsUpload: { obj: "vendor_documents", act: "upload" },
    vendorClaimView: { obj: "vendor_claims", act: "view" },
    vendorClaimRespond: { obj: "vendor_claims", act: "respond" },
    vendorSupportView: { obj: "support", act: "view" },
    vendorSupportRespond: { obj: "support", act: "respond" },
    shipmentView: { obj: "shipment", act: "view" },
    shipmentUpdate: { obj: "shipment", act: "update" },
    vendorUsersCreate: { obj: "vendor_users", act: "create" },
    /* ================= ROLES ================= */
    manageRoles: { obj: "roles", act: "manage" },
};
//# sourceMappingURL=permission-casbin.map.js.map