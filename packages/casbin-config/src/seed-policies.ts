import { Enforcer } from 'casbin';

/**
 * Seed default CASBIN policies for the platform
 * This function should be called during application startup
 */
export async function seedDefaultPolicies(enforcer: Enforcer) {
  // Portal Hierarchy Policies
  // Tech portal can access admin portal resources
  await enforcer.addPolicy('tech_portal', 'admin_portal', 'inherit', 'allow', 'tech_portal', '*');
  await enforcer.addPolicy('admin_portal', 'customer_portal', 'inherit', 'allow', 'admin_portal', '*');
  await enforcer.addPolicy('admin_portal', 'vendor_portal', 'inherit', 'allow', 'admin_portal', '*');

  // Role Hierarchy within Tech Portal
  await enforcer.addGroupingPolicy('tech_admin', 'tech_manager', 'tech_portal');
  await enforcer.addGroupingPolicy('tech_manager', 'tech_developer', 'tech_portal');
  await enforcer.addGroupingPolicy('tech_developer', 'tech_support', 'tech_portal');

  // Tech Admin - Full Access
  await enforcer.addPolicy('tech_admin', 'admin_users', 'create', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'admin_users', 'update', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'admin_users', 'delete', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'tech_users', 'create', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'tech_users', 'update', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'tech_users', 'delete', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'licenses', 'full_control', 'allow', 'tech_portal', 'tech_admin');
  await enforcer.addPolicy('tech_admin', 'system_config', 'manage', 'allow', 'tech_portal', 'tech_admin');

  // Tech Manager - Can Create Admin, NOT Tech
  await enforcer.addPolicy('tech_manager', 'admin_users', 'create', 'allow', 'tech_portal', 'tech_manager');
  await enforcer.addPolicy('tech_manager', 'admin_users', 'update', 'allow', 'tech_portal', 'tech_manager');
  await enforcer.addPolicy('tech_manager', 'admin_users', 'view', 'allow', 'tech_portal', 'tech_manager');
  await enforcer.addPolicy('tech_manager', 'tech_users', 'create', 'deny', 'tech_portal', 'tech_manager');
  await enforcer.addPolicy('tech_manager', 'licenses', 'issue', 'allow', 'tech_portal', 'tech_manager');
  await enforcer.addPolicy('tech_manager', 'licenses', 'revoke', 'allow', 'tech_portal', 'tech_manager');

  // Tech Developer - Cannot Create Admin or Tech
  await enforcer.addPolicy('tech_developer', 'admin_users', 'create', 'deny', 'tech_portal', 'tech_developer');
  await enforcer.addPolicy('tech_developer', 'tech_users', 'create', 'deny', 'tech_portal', 'tech_developer');
  await enforcer.addPolicy('tech_developer', 'system_logs', 'view', 'allow', 'tech_portal', 'tech_developer');
  await enforcer.addPolicy('tech_developer', 'licenses', 'view', 'allow', 'tech_portal', 'tech_developer');

  // Tech Support - Limited Access
  await enforcer.addPolicy('tech_support', 'admin_users', 'create', 'deny', 'tech_portal', 'tech_support');
  await enforcer.addPolicy('tech_support', 'tech_users', 'create', 'deny', 'tech_portal', 'tech_support');
  await enforcer.addPolicy('tech_support', 'system_status', 'view', 'allow', 'tech_portal', 'tech_support');

  // Admin Portal - Cannot Create Tech
  await enforcer.addPolicy('admin_superuser', 'tech_users', 'create', 'deny', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'tech_users', 'update', 'deny', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'tech_users', 'delete', 'deny', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'admin_users', 'create', 'allow', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'customer_orgs', 'manage', 'allow', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'vendor_orgs', 'manage', 'allow', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'licenses', 'issue', 'allow', 'admin_portal', 'admin_superuser');
  await enforcer.addPolicy('admin_superuser', 'licenses', 'revoke', 'allow', 'admin_portal', 'admin_superuser');

  // Customer Portal Permissions
  await enforcer.addPolicy('customer_admin', 'rfq', 'manage', 'allow', 'customer_portal', 'customer_admin');
  await enforcer.addPolicy('customer_admin', 'vessels', 'manage', 'allow', 'customer_portal', 'customer_admin');
  await enforcer.addPolicy('customer_admin', 'employees', 'manage', 'allow', 'customer_portal', 'customer_admin');
  await enforcer.addPolicy('customer_user', 'rfq', 'view', 'allow', 'customer_portal', 'customer_user');
  await enforcer.addPolicy('customer_user', 'vessels', 'view', 'allow', 'customer_portal', 'customer_user');

  // Vendor Portal Permissions
  await enforcer.addPolicy('vendor_admin', 'catalogue', 'manage', 'allow', 'vendor_portal', 'vendor_admin');
  await enforcer.addPolicy('vendor_admin', 'inventory', 'manage', 'allow', 'vendor_portal', 'vendor_admin');
  await enforcer.addPolicy('vendor_admin', 'quotation', 'manage', 'allow', 'vendor_portal', 'vendor_admin');
  await enforcer.addPolicy('vendor_user', 'catalogue', 'view', 'allow', 'vendor_portal', 'vendor_user');
  await enforcer.addPolicy('vendor_user', 'quotation', 'view', 'allow', 'vendor_portal', 'vendor_user');

  console.log('✅ Default CASBIN policies seeded');
}







