// apps/api/src/services/default-roles.service.ts
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index';
import { logger } from '../config/logger';

/**
 * Default roles configuration for organizations
 * These roles are created when a new customer/vendor organization is created
 */
export interface DefaultRoleConfig {
  key: string;
  name: string;
  portalType: PortalType;
  permissions: string[];
  description?: string;
}

/**
 * Default roles for Customer Portal organizations
 */
export const CUSTOMER_DEFAULT_ROLES: DefaultRoleConfig[] = [
  {
    key: 'customer_admin',
    name: 'Admin',
    portalType: PortalType.CUSTOMER,
    permissions: [
      'rfqView', 'rfqManage',
      'vesselsView', 'vesselsManage',
      'crewView', 'crewManage',
      'financeView', 'financeManage',
      'customerBillingView', 'customerBillingManage',
      'documentsView', 'documentsUpload',
      'claimView', 'claimManage',
    ],
    description: 'Full access to manage customer portal activities',
  },
  {
    key: 'customer_manager',
    name: 'Manager',
    portalType: PortalType.CUSTOMER,
    permissions: [
      'rfqView', 'rfqManage',
      'vesselsView', 'vesselsManage',
      'crewView',
      'financeView',
      'customerBillingView',
      'documentsView',
      'claimView',
    ],
    description: 'Manage RFQs, vessels, and customer operations',
  },
  {
    key: 'customer_accountant',
    name: 'Accountant',
    portalType: PortalType.CUSTOMER,
    permissions: [
      'financeView', 'financeManage',
      'customerBillingView', 'customerBillingManage',
      'documentsView',
    ],
    description: 'Views and reconciles customer financial records',
  },
  {
    key: 'customer_viewer',
    name: 'Viewer',
    portalType: PortalType.CUSTOMER,
    permissions: [
      'rfqView',
      'vesselsView',
      'crewView',
      'financeView',
      'customerBillingView',
      'documentsView',
    ],
    description: 'Read-only access to customer dashboards and records',
  },
];

/**
 * Default roles for Vendor Portal organizations
 */
export const VENDOR_DEFAULT_ROLES: DefaultRoleConfig[] = [
  {
    key: 'vendor_admin',
    name: 'Admin',
    portalType: PortalType.VENDOR,
    permissions: [
      'catalogueView', 'catalogueManage',
      'inventoryView', 'inventoryManage',
      'quotationView', 'quotationManage',
      'vendorBillingView', 'vendorBillingManage',
      'vendorDocumentsView', 'vendorDocumentsUpload',
      'vendorClaimView', 'vendorClaimRespond',
      'vendorSupportView', 'vendorSupportRespond',
      'shipmentView', 'shipmentUpdate',
      'vendorUsersCreate',
    ],
    description: 'Full access to manage vendor portal activities',
  },
  {
    key: 'vendor_manager',
    name: 'Manager',
    portalType: PortalType.VENDOR,
    permissions: [
      'catalogueView', 'catalogueManage',
      'inventoryView', 'inventoryManage',
      'quotationView', 'quotationManage',
      'vendorBillingView',
      'vendorDocumentsView',
      'vendorClaimView',
      'vendorSupportView',
      'shipmentView', 'shipmentUpdate',
    ],
    description: 'Manage vendor catalogue, inventory, and quotations',
  },
  {
    key: 'vendor_accountant',
    name: 'Accountant',
    portalType: PortalType.VENDOR,
    permissions: [
      'vendorBillingView', 'vendorBillingManage',
      'vendorDocumentsView',
    ],
    description: 'Handles vendor invoices and financial entries',
  },
  {
    key: 'vendor_staff',
    name: 'Staff',
    portalType: PortalType.VENDOR,
    permissions: [
      'catalogueView',
      'inventoryView',
      'quotationView',
      'vendorDocumentsView',
      'shipmentView',
    ],
    description: 'Processes assigned orders with limited access',
  },
  {
    key: 'vendor_viewer',
    name: 'Viewer',
    portalType: PortalType.VENDOR,
    permissions: [
      'catalogueView',
      'inventoryView',
      'vendorBillingView',
      'vendorDocumentsView',
    ],
    description: 'Read-only visibility into vendor dashboards and orders',
  },
];

/**
 * Get default roles for an organization type
 */
export function getDefaultRolesForOrganization(
  organizationType: OrganizationType,
  portalType: PortalType
): DefaultRoleConfig[] {
  if (organizationType === OrganizationType.CUSTOMER || portalType === PortalType.CUSTOMER) {
    return CUSTOMER_DEFAULT_ROLES;
  } else if (organizationType === OrganizationType.VENDOR || portalType === PortalType.VENDOR) {
    return VENDOR_DEFAULT_ROLES;
  }
  
  logger.warn(`No default roles defined for organization type: ${organizationType}, portal: ${portalType}`);
  return [];
}

