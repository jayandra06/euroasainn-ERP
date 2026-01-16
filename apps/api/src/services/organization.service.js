// apps/api/src/services/organization.service.ts
import mongoose from "mongoose";
import { Organization } from "../models/organization.model";
import { OrganizationType, PortalType, } from "../../../../packages/shared/src/types/index.ts";
import { getCasbinEnforcer } from "../config/casbin";
export class OrganizationService {
    async createOrganization(data) {
        const organizationData = {
            name: data.name,
            type: data.type,
            portalType: data.portalType,
            metadata: data.metadata,
        };
        // -----------------------------
        // Vendor invitation handling
        // -----------------------------
        if (data.type === OrganizationType.VENDOR) {
            if (data.invitedBy === "admin" || data.invitedBy === "tech") {
                organizationData.invitedBy = data.invitedBy;
                organizationData.isAdminInvited = true;
                organizationData.visibleToCustomerIds = [];
            }
            else if (data.invitedBy === "customer" &&
                data.invitedByOrganizationId) {
                organizationData.invitedBy = "customer";
                organizationData.invitedByOrganizationId = new mongoose.Types.ObjectId(data.invitedByOrganizationId);
                organizationData.isAdminInvited = false;
                organizationData.visibleToCustomerIds = [
                    new mongoose.Types.ObjectId(data.invitedByOrganizationId),
                ];
            }
        }
        // -----------------------------
        // Save organization
        // -----------------------------
        const organization = new Organization(organizationData);
        await organization.save();
        // =====================================================
        // ✅ CASBIN ORG SCOPE (g2) — SAME ORG ONLY
        // =====================================================
        const enforcer = await getCasbinEnforcer();
        /**
         * This satisfies:
         * g2(r.org, p.org, "*")
         *
         * r.org === p.org ONLY
         * No cross-organization access possible
         */
        await enforcer.addNamedGroupingPolicy("g2", organization._id.toString(), // r.org
        organization._id.toString(), // p.org (IMPORTANT: SAME ORG)
        "*");
        await enforcer.savePolicy();
        console.log("✅ Casbin g2 (same-org scope) added for org:", organization._id.toString());
        // =====================================================
        return organization;
    }
    // ------------------------------------------------------
    // GET ORGANIZATIONS
    // ------------------------------------------------------
    async getOrganizations(type, portalType, filters) {
        const query = {
            type: { $in: [OrganizationType.CUSTOMER, OrganizationType.VENDOR] },
        };
        if (type)
            query.type = type;
        if (portalType)
            query.portalType = portalType;
        if (filters?.isActive !== undefined)
            query.isActive = filters.isActive;
        // Customer → Vendor visibility rules
        if (type === OrganizationType.VENDOR &&
            filters?.requesterPortalType === PortalType.CUSTOMER &&
            filters.customerOrganizationId) {
            const customerOrgId = new mongoose.Types.ObjectId(filters.customerOrganizationId);
            query.$or = [
                { visibleToCustomerIds: customerOrgId },
                { invitedByOrganizationId: customerOrgId },
            ];
        }
        return Organization.find(query)
            .select("name type portalType isActive licenseKey createdAt invitedBy isAdminInvited visibleToCustomerIds invitedByOrganizationId")
            .lean()
            .exec();
    }
    // ------------------------------------------------------
    // GET BY ID
    // ------------------------------------------------------
    async getOrganizationById(orgId) {
        const organization = await Organization.findById(orgId);
        if (!organization) {
            throw new Error("Organization not found");
        }
        return organization;
    }
    // ------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------
    async updateOrganization(orgId, data) {
        const organization = await Organization.findById(orgId);
        if (!organization) {
            throw new Error("Organization not found");
        }
        Object.assign(organization, data);
        await organization.save();
        return organization;
    }
    // ------------------------------------------------------
    // ADD CUSTOMER TO VENDOR VISIBILITY
    // ------------------------------------------------------
    async addCustomerToVendorVisibility(vendorOrganizationId, customerOrganizationId) {
        const vendor = await Organization.findById(vendorOrganizationId);
        if (!vendor) {
            throw new Error('Vendor organization not found');
        }
        const customerOrgId = new mongoose.Types.ObjectId(customerOrganizationId);
        // Initialize visibleToCustomerIds if it doesn't exist
        if (!vendor.visibleToCustomerIds) {
            vendor.visibleToCustomerIds = [];
        }
        // Check if customer is already in the visibility list
        const alreadyVisible = vendor.visibleToCustomerIds.some((id) => id.toString() === customerOrgId.toString());
        if (!alreadyVisible) {
            vendor.visibleToCustomerIds.push(customerOrgId);
            await vendor.save();
        }
        return vendor;
    }
    // ------------------------------------------------------
    // DELETE
    // ------------------------------------------------------
    async deleteOrganization(orgId) {
        // 1️⃣ Ensure org exists
        const organization = await Organization.findById(orgId);
        if (!organization) {
            throw new Error("Organization not found");
        }
        // 2️⃣ Load Casbin enforcer
        const enforcer = await getCasbinEnforcer();
        // =====================================================
        // 🧹 CASBIN CLEANUP (ONLY THIS ADDED)
        // =====================================================
        // g2(org, org, *)
        await enforcer.removeNamedGroupingPolicy("g2", orgId, orgId, "*");
        // g(user, role, org)
        await enforcer.removeFilteredNamedGroupingPolicy("g", 2, // index of orgId in g
        orgId);
        // p(sub, obj, act, org, eft, portal, role)
        await enforcer.removeFilteredPolicy(3, // index of orgId in p
        orgId);
        await enforcer.savePolicy();
        // =====================================================
        // 3️⃣ Delete organization from DB
        await Organization.findByIdAndDelete(orgId);
        return { success: true };
    }
}
export const organizationService = new OrganizationService();
//# sourceMappingURL=organization.service.js.map