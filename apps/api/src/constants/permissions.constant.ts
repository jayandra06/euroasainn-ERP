// src/constants/permissions.constant.ts

export const PERMISSIONS = {
  // ======================================================
  // ⭐ TECH PORTAL PERMISSIONS
  // ======================================================
  tech: [
    // Admin Users
    { key: "adminUsersCreate", label: "Admin Users Create" },
    { key: "adminUsersUpdate", label: "Admin Users Update" },
    { key: "adminUsersDelete", label: "Admin Users Delete" },
    { key: "adminUsersView", label: "Admin Users View" },

    // Tech Users
    { key: "techUsersCreate", label: "Tech Users Create" },
    { key: "techUsersUpdate", label: "Tech Users Update" },
    { key: "techUsersDelete", label: "Tech Users Delete" },
    { key: "techUsersView", label: "Tech Users View" },

    // Organizations
    { key: "organizationsCreate", label: "Organizations Create" },
    { key: "organizationsUpdate", label: "Organizations Update" },
    { key: "organizationsDelete", label: "Organizations Delete" },
    { key: "organizationsView", label: "Organizations View" },

    // Licenses
    { key: "licensesView", label: "Licenses View" },
    { key: "licensesIssue", label: "Licenses Issue" },
    { key: "licensesRevoke", label: "Licenses Revoke" },

    // Onboarding
    { key: "onboardingView", label: "Onboarding View" },
    { key: "onboardingManage", label: "Onboarding Manage" },
  ],

  // ======================================================
  // ⭐ ADMIN PORTAL PERMISSIONS
  // ======================================================
  admin: [
    // Admin Users
    { key: "adminUsersCreate", label: "Admin Users Create" },
    { key: "adminUsersEdit", label: "Admin Users Edit" },
    { key: "adminUsersDisable", label: "Admin Users Disable" },

    // Organizations
    { key: "customerOrgsManage", label: "Customer Organizations Manage" },
    { key: "vendorOrgsManage", label: "Vendor Organizations Manage" },

    // Licenses
    { key: "licensesIssue", label: "Issue Licenses" },
    { key: "licensesRevoke", label: "Revoke Licenses" },
    { key: "licenseView", label: "License View" },

    // System Settings
    { key: "systemSettingsManage", label: "System Settings Manage" },
    { key: "securityPoliciesManage", label: "Security Policies Manage" },

    // Logs
    { key: "auditLogsView", label: "Audit Logs View" },
  ],

  // ======================================================
  // ⭐ CUSTOMER PORTAL PERMISSIONS
  // ======================================================
  customer: [
    { key: "rfqManage", label: "RFQ Manage" },
    { key: "rfqView", label: "RFQ View" },

    { key: "vesselsManage", label: "Vessels Manage" },
    { key: "vesselsView", label: "Vessels View" },

    { key: "employeesManage", label: "Employees Manage" },

    { key: "crewManage", label: "Crew Manage" },
    { key: "crewView", label: "Crew View" },

    { key: "portManage", label: "Port Manage" },

    { key: "financeView", label: "Finance View" },
    { key: "financeManage", label: "Finance Manage" },

    { key: "customerBillingView", label: "Billing View" },
    { key: "customerBillingManage", label: "Billing Manage" },

    { key: "vendorOrgsManage", label: "Vendor Organizations Manage" },
    { key: "vendorOrgsView", label: "Vendor Organizations View" },

    { key: "customerOrgsManage", label: "Customer Organizations Manage" },

    { key: "claimManage", label: "Claims Manage" },
    { key: "claimView", label: "Claims View" },

    // Licenses
    { key: "licensesIssue", label: "Issue Licenses" },
    { key: "licensesRevoke", label: "Revoke Licenses" },

    // Documents
    { key: "documentsUpload", label: "Documents Upload" },
    { key: "documentsView", label: "Documents View" },

    // Tracking
    { key: "shipmentTracking", label: "Shipment Tracking" },
  ],

  // ======================================================
  // ⭐ VENDOR PORTAL PERMISSIONS (From your RolesPage)
  // ======================================================
  vendor: [
    // PRODUCT & CATALOG
    { key: "catalogueManage", label: "Catalogue Manage" },
    { key: "catalogueView", label: "Catalogue View" },

    // INVENTORY
    { key: "inventoryManage", label: "Inventory Manage" },
    { key: "inventoryView", label: "Inventory View" },

    // QUOTATIONS
    { key: "quotationManage", label: "Quotation Manage" },
    { key: "quotationView", label: "Quotation View" },

    // BILLING
    { key: "vendorBillingView", label: "Billing View" },
    { key: "vendorBillingManage", label: "Billing Manage" },

    // DOCUMENTS
    { key: "vendorDocumentsUpload", label: "Documents Upload" },
    { key: "vendorDocumentsView", label: "Documents View" },

    // CLAIMS
    { key: "vendorClaimRespond", label: "Claim Respond" },
    { key: "vendorClaimView", label: "Claim View" },

    // QA & COMPLIANCE
    { key: "qualityVerify", label: "Quality Verify" },
    { key: "complianceApprove", label: "Compliance Approve" },

    // SUPPORT
    { key: "vendorSupportView", label: "Support View" },
    { key: "vendorSupportRespond", label: "Support Respond" },

    // SHIPMENT TRACKING
    { key: "shipmentUpdate", label: "Shipment Update" },
    { key: "shipmentView", label: "Shipment View" },

    // USERS
    { key: "vendorUsersCreate", label: "Vendor Users Create" },
  ],
};
