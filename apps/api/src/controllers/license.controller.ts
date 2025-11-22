import { Request, Response } from "express";
import { licenseService } from "../services/license.service";
import { organizationService } from "../services/organization.service";
import { License } from "../models/license.model";
import { Organization } from "../models/organization.model";
import { OrganizationType } from "../../../../packages/shared/src/types/index.ts";

export class LicenseController {

  // ================================
  // GET ALL LICENSES (LIST VIEW)
  // ================================
  async getLicenses(req: Request, res: Response) {
    try {
      const { status, licenseType, search } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (licenseType) filters.licenseType = licenseType;

      // Get licenses
      const licenses = await licenseService.getLicenses(undefined, filters);

      // Get organizations (from service)
      const organizations = await organizationService.getOrganizations();

      // Convert organizations array to map for fast lookup
      const orgMap = new Map(
        organizations.map((org: any) => [org._id.toString(), org.name])
      );

      // Format output for frontend
      const formatted = licenses.map((l: any) => ({
        _id: l._id,
        licenseKey: l.licenseKey,
        status: l.status,
        licenseType: l.organizationType,
        expiryDate: l.expiresAt,
        organizationId: l.organizationId,
        organizationName: orgMap.get(l.organizationId?.toString()) || "Unknown",
        maxUsers: l.usageLimits?.users ?? 0,
        maxVessels: l.usageLimits?.vessels ?? 0,
        maxItems: l.usageLimits?.items ?? 0
      }));

      // Search filter
      const filtered = search
        ? formatted.filter((l) =>
            l.licenseKey.toLowerCase().includes(search.toString().toLowerCase())
          )
        : formatted;

      return res.status(200).json({ success: true, data: filtered });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================================
  // CREATE LICENSE
  // ================================
  async createLicense(req: Request, res: Response) {
    try {
      const { organizationId, expiryDate, licenseType, maxUsers, maxVessels, maxItems } = req.body;

      if (!organizationId || !expiryDate || !licenseType) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Get organization for type mapping
      const org = await Organization.findById(organizationId);
      if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

      const usageLimits = {
        users: maxUsers,
        vessels: maxVessels,
        items: maxItems,
      };

      const license = await licenseService.createLicense({
        organizationId,
        organizationType: org.type as OrganizationType,
        expiresAt: new Date(expiryDate),
        usageLimits,
      });

      return res.status(201).json({ success: true, data: license });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================================
  // GET LICENSE BY ID (EDIT MODAL)
  // ================================
  async getLicenseById(req: Request, res: Response) {
    try {
      const license = await License.findById(req.params.id).populate("organizationId");

      if (!license)
        return res.status(404).json({ success: false, error: "License not found" });

      const response = {
        _id: license._id,
        organizationId: license.organizationId?._id || license.organizationId,
        licenseType: license.organizationType,
        expiryDate: license.expiresAt?.toISOString().split("T")[0],
        maxUsers: license.usageLimits?.users ?? 0,
        maxVessels: license.usageLimits?.vessels ?? 0,
        maxItems: license.usageLimits?.items ?? 0,
        status: license.status,
      };

      return res.status(200).json({ success: true, data: response });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================================
  // UPDATE LICENSE
  // ================================
  async updateLicense(req: Request, res: Response) {
    try {
      const { expiryDate, maxUsers, maxVessels, maxItems, status } = req.body;

      const license = await License.findById(req.params.id);
      if (!license)
        return res.status(404).json({ success: false, error: "License not found" });

      if (expiryDate) license.expiresAt = new Date(expiryDate);
      if (status) license.status = status;

      license.usageLimits = {
        ...license.usageLimits,
        users: maxUsers,
        vessels: maxVessels,
        items: maxItems,
      };

      await license.save();

      return res.status(200).json({ success: true, data: license });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ================================
  // DELETE LICENSE
  // ================================
  async deleteLicense(req: Request, res: Response) {
    try {
      const license = await License.findById(req.params.id);

      if (!license)
        return res.status(404).json({ success: false, error: "License not found" });

      await license.deleteOne();

      return res.status(200).json({ success: true, message: "License deleted successfully" });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const licenseController = new LicenseController();
