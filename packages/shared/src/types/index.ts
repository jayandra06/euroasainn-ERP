export enum PortalType {
  TECH = 'tech',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

export enum TechRole {
  TECH_ADMIN = 'tech_admin',
  TECH_MANAGER = 'tech_manager',
  TECH_DEVELOPER = 'tech_developer',
  TECH_SUPPORT = 'tech_support',
}

export enum AdminRole {
  ADMIN_SUPERUSER = 'admin_superuser',
  ADMIN_USER = 'admin_user',
}

export enum OrganizationType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  portalType: PortalType;
  role: string;
}






