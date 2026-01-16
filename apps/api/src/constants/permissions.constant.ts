// src/constants/permissions.constant.ts

export const PERMISSIONS = {
  /* ======================================================
     ⭐ TECH PORTAL PERMISSIONS
  ====================================================== */
 tech: [
  { key: "techUsersCreate", label: "Tech Users Create" },
  { key: "techUsersUpdate", label: "Tech Users Update" },
  { key: "techUsersDelete", label: "Tech Users Delete" },
  { key: "techUsersView",   label: "Tech Users View" },

  { key: "organizationsCreate", label: "Organizations Create" },
  { key: "organizationsUpdate", label: "Organizations Update" },
  { key: "organizationsDelete", label: "Organizations Delete" },
  { key: "organizationsView",   label: "Organizations View" },

  { key: "licensesView",   label: "Licenses View" },
  { key: "licensesIssue",  label: "Licenses Issue" },
  { key: "licensesRevoke", label: "Licenses Revoke" },

  { key: "onboardingView",   label: "Onboarding View" },
  { key: "onboardingManage", label: "Onboarding Manage" },

  /* ================= ROLES ================= */
  { key: "rolesView",   label: "Roles View" },
  { key: "rolesCreate", label: "Roles Create" },
  { key: "rolesUpdate", label: "Roles Update" },
  { key: "rolesDelete", label: "Roles Delete" },

  /* ============= ASSIGN ROLES PAGE ============= */
  { key: "assignRolesView",   label: "Assign Roles View" },
  { key: "assignRolesAssign", label: "Assign Role" },
  { key: "assignRolesUpdate", label: "Update Assigned Role" },
  { key: "assignRolesRemove", label: "Remove Assigned Role" },
],

  /* ======================================================
     ⭐ ADMIN PORTAL PERMISSIONS (🔥 FIXED)
  ====================================================== */
  admin: [
    // Users
    { key: "adminUsersCreate", label: "Admin Users Create" },
    { key: "adminUsersUpdate", label: "Admin Users Update" },
    { key: "adminUsersDisable", label: "Admin Users Disable" },
    { key: "adminUsersView", label: "Admin Users View" },

    // Organizations
    { key: "customerOrgsManage", label: "Customer Organizations Manage" },
    { key: "vendorOrgsManage", label: "Vendor Organizations Manage" },

    // Licenses
    { key: "licenseView", label: "License View" },
    { key: "licensesView", label: "Licenses View" },
    { key: "licensesIssue", label: "Issue Licenses" },
    { key: "licensesRevoke", label: "Revoke Licenses" },

    // 🔥 ONBOARDING (THIS WAS MISSING)
    { key: "onboardingView", label: "Onboarding View" },
    { key: "onboardingManage", label: "Onboarding Manage" },

    // System
    { key: "systemSettingsManage", label: "System Settings Manage" },
    { key: "securityPoliciesManage", label: "Security Policies Manage" },

    // Logs
    { key: "auditLogsView", label: "Audit Logs View" },

    // RFQ
    { key: "adminRfqView", label: "Admin RFQ View" },
    { key: "adminRfqManage", label: "Admin RFQ Manage" },
  ],

  /* ======================================================
     ⭐ CUSTOMER PORTAL PERMISSIONS
  ====================================================== */
  customer: [
    { key: "rfqView", label: "RFQ View" },
    { key: "rfqManage", label: "RFQ Manage" },

    { key: "vesselsView", label: "Vessels View" },
    { key: "vesselsManage", label: "Vessels Manage" },

    { key: "crewView", label: "Crew View" },
    { key: "crewManage", label: "Crew Manage" },

    { key: "financeView", label: "Finance View" },
    { key: "financeManage", label: "Finance Manage" },

    { key: "customerBillingView", label: "Billing View" },
    { key: "customerBillingManage", label: "Billing Manage" },

    { key: "documentsView", label: "Documents View" },
    { key: "documentsUpload", label: "Documents Upload" },

    { key: "claimView", label: "Claims View" },
    { key: "claimManage", label: "Claims Manage" },
  ],

  /* ======================================================
     ⭐ VENDOR PORTAL PERMISSIONS
  ====================================================== */
  vendor: [
    { key: "catalogueView", label: "Catalogue View" },
    { key: "catalogueManage", label: "Catalogue Manage" },

    { key: "inventoryView", label: "Inventory View" },
    { key: "inventoryManage", label: "Inventory Manage" },

    { key: "quotationView", label: "Quotation View" },
    { key: "quotationManage", label: "Quotation Manage" },

    { key: "vendorBillingView", label: "Billing View" },
    { key: "vendorBillingManage", label: "Billing Manage" },

    { key: "vendorDocumentsView", label: "Documents View" },
    { key: "vendorDocumentsUpload", label: "Documents Upload" },

    { key: "vendorClaimView", label: "Claim View" },
    { key: "vendorClaimRespond", label: "Claim Respond" },

    { key: "vendorSupportView", label: "Support View" },
    { key: "vendorSupportRespond", label: "Support Respond" },

    { key: "shipmentView", label: "Shipment View" },
    { key: "shipmentUpdate", label: "Shipment Update" },

    { key: "vendorUsersCreate", label: "Vendor Users Create" },
  ],
};
