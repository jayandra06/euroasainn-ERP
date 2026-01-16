export const ROUTE_PERMISSION_MAP: Record<string, string> = {

  /* ======================================================
     ⭐ TECH PORTAL (UNCHANGED)
  ====================================================== */

  "tech:GET /users": "techUsersView",
  "tech:POST /users/invite": "techUsersCreate",
  "tech:GET /users/:id": "techUsersView",
  "tech:PUT /users/:id": "techUsersUpdate",
  "tech:DELETE /users/:id": "techUsersDelete",

  "tech:GET /organizations": "organizationsView",
  "tech:POST /organizations": "organizationsCreate",
  "tech:PUT /organizations/:id": "organizationsUpdate",
  "tech:DELETE /organizations/:id": "organizationsDelete",

  "tech:GET /licenses": "licensesView",
  "tech:POST /licenses": "licensesIssue",
  "tech:PUT /licenses/:id": "licensesRevoke",
  "tech:DELETE /licenses/:id": "licensesRevoke",

  "tech:GET /customer-onboardings": "onboardingView",
  "tech:GET /vendor-onboardings": "onboardingView",
  "tech:POST /customer-onboardings/:id/approve": "onboardingManage",
  "tech:POST /customer-onboardings/:id/reject": "onboardingManage",
  "tech:POST /vendor-onboardings/:id/approve": "onboardingManage",
  "tech:POST /vendor-onboardings/:id/reject": "onboardingManage",



"tech:GET /roles": "rolesView",
"tech:GET /roles/:id": "rolesView",

"tech:POST /roles": "rolesCreate",

"tech:PUT /roles/:id": "rolesUpdate",

"tech:DELETE /roles/:id": "rolesDelete",



"tech:GET /assign-role/users": "assignRolesView",
"tech:GET /assign-role/roles": "assignRolesView",

"tech:POST /assign-role/assign": "assignRolesAssign",

"tech:PUT /assign-role/:userId": "assignRolesUpdate",

"tech:DELETE /assign-role/:userId": "assignRolesRemove",



  /* ======================================================
     ⭐ ADMIN PORTAL (🔥 FULLY FIXED)
  ====================================================== */

  /* -------- USERS -------- */
  "admin:GET /users": "adminUsersView",
  "admin:POST /users": "adminUsersCreate",
  "admin:POST /users/invite": "adminUsersCreate",
  "admin:GET /users/:id": "adminUsersView",
  "admin:PUT /users/:id": "adminUsersUpdate",
  "admin:DELETE /users/:id": "adminUsersDisable",

  // UI alias
  "admin:GET /admin-users": "adminUsersView",
  "admin:GET /admin-users/:id": "adminUsersView",


  /* -------- ORGANIZATIONS -------- */
  "admin:GET /organizations": "customerOrgsManage",
  "admin:POST /organizations": "customerOrgsManage",
  "admin:POST /organizations/invite": "customerOrgsManage",
  "admin:GET /organizations/:id": "customerOrgsManage",
  "admin:PUT /organizations/:id": "customerOrgsManage",
  "admin:DELETE /organizations/:id": "customerOrgsManage",

  // combined / nested variants
  "admin:GET /organizations-with-licenses": "customerOrgsManage",
  "admin:GET /organizations/with-licenses": "customerOrgsManage",
  "admin:GET /organizations/licenses": "customerOrgsManage",


  /* -------- LICENSES -------- */
  "admin:GET /licenses": "licenseView",
  "admin:POST /licenses": "licensesIssue",
  "admin:GET /licenses/:id": "licenseView",
  "admin:PUT /licenses/:id": "licensesRevoke",
  "admin:DELETE /licenses/:id": "licensesRevoke",


  /* -------- ONBOARDING -------- */
  "admin:GET /customer-onboardings": "onboardingView",
  "admin:GET /customer-onboardings/:id": "onboardingView",
  "admin:GET /vendor-onboardings": "onboardingView",
  "admin:GET /vendor-onboardings/:id": "onboardingView",

  "admin:POST /customer-onboardings/:id/approve": "onboardingManage",
  "admin:POST /customer-onboardings/:id/reject": "onboardingManage",
  "admin:POST /vendor-onboardings/:id/approve": "onboardingManage",
  "admin:POST /vendor-onboardings/:id/reject": "onboardingManage",


  /* -------- CUSTOMERS -------- */
  "admin:GET /customers": "customerOrgsManage",
  "admin:GET /customers/:status": "customerOrgsManage",
  "admin:GET /customers/:id": "customerOrgsManage",


  /* -------- RFQ -------- */
  "admin:GET /rfq": "adminRfqView",
  "admin:GET /rfq/:id": "adminRfqView",
  "admin:POST /quotation": "adminRfqManage",
  "admin:GET /quotation/rfq/:rfqId": "adminRfqView",


  /* ======================================================
     ⭐ CUSTOMER PORTAL (UNCHANGED)
  ====================================================== */

  "customer:GET /rfq": "rfqView",
  "customer:POST /rfq": "rfqManage",
  "customer:PUT /rfq/:id": "rfqManage",
  "customer:DELETE /rfq/:id": "rfqManage",
  "customer:GET /rfq/:id": "rfqView",
  "customer:GET /rfq/:id/quotations": "rfqView",
  "customer:POST /quotations/:id/finalize": "rfqManage",

  "customer:GET /vessels": "vesselsView",
  "customer:POST /vessels": "vesselsManage",

  "customer:GET /crew": "crewView",
  "customer:POST /crew": "crewManage",

  "customer:GET /finance": "financeView",
  "customer:POST /finance": "financeManage",

  "customer:GET /billing": "customerBillingView",
  "customer:POST /billing": "customerBillingManage",

  "customer:GET /claims": "claimView",
  "customer:POST /claims": "claimManage",

  "customer:GET /documents": "documentsView",
  "customer:POST /documents": "documentsUpload",


  /* ======================================================
     ⭐ VENDOR PORTAL (UNCHANGED)
  ====================================================== */

  "vendor:GET /catalogue": "catalogueView",
  "vendor:POST /catalogue": "catalogueManage",

  "vendor:GET /inventory": "inventoryView",
  "vendor:POST /inventory": "inventoryManage",

  "vendor:GET /quotations": "quotationView",
  "vendor:POST /quotations": "quotationManage",

  "vendor:GET /billing": "vendorBillingView",
  "vendor:POST /billing": "vendorBillingManage",

  "vendor:GET /documents": "vendorDocumentsView",
  "vendor:POST /documents": "vendorDocumentsUpload",

  "vendor:GET /claims": "vendorClaimView",
  "vendor:POST /claims/respond": "vendorClaimRespond",

  "vendor:GET /support": "vendorSupportView",
  "vendor:POST /support/respond": "vendorSupportRespond",

  "vendor:GET /shipments": "shipmentView",
  "vendor:PUT /shipments/:id": "shipmentUpdate",

  "vendor:POST /users": "vendorUsersCreate",
};
