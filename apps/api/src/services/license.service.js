import { License } from '../models/license.model';
import { LicenseStatus } from '../../../../packages/shared/src/types/index.ts';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
export class LicenseService {
    generateLicenseKey() {
        return `LIC-${uuidv4().toUpperCase().replace(/-/g, '')}`;
    }
    async createLicense(data) {
        // Validate and convert organizationId to ObjectId
        if (!mongoose.Types.ObjectId.isValid(data.organizationId)) {
            const error = new Error(`Invalid organizationId: ${data.organizationId}`);
            logger.error(`❌ Invalid organizationId provided: ${data.organizationId}`);
            throw error;
        }
        const organizationId = new mongoose.Types.ObjectId(data.organizationId);
        const licenseKey = this.generateLicenseKey();
        logger.info(`🔑 Creating license with key: ${licenseKey} for organization: ${organizationId.toString()}`);
        const license = new License({
            licenseKey,
            organizationId: organizationId,
            organizationType: data.organizationType,
            status: LicenseStatus.ACTIVE,
            expiresAt: data.expiresAt,
            usageLimits: data.usageLimits,
            currentUsage: {
                users: 0,
                vessels: 0,
                items: 0,
                employees: 0,
                businessUnits: 0,
            },
            pricing: data.pricing || {
                monthlyPrice: 0,
                yearlyPrice: 0,
                currency: 'INR',
            },
        });
        try {
            await license.save();
            logger.info(`✅ License saved successfully: ${licenseKey}`);
            return license;
        }
        catch (error) {
            logger.error(`❌ Failed to save license: ${error.message}`);
            if (error.code === 11000) {
                // Duplicate key error
                throw new Error(`License key ${licenseKey} already exists`);
            }
            throw error;
        }
    }
    async getLicenses(organizationId, filters) {
        const query = {};
        if (organizationId) {
            // Convert string organizationId to ObjectId for proper querying
            try {
                // Check if it's a valid ObjectId string
                if (mongoose.Types.ObjectId.isValid(organizationId)) {
                    query.organizationId = new mongoose.Types.ObjectId(organizationId);
                    logger.debug(`Converted organizationId string to ObjectId: ${organizationId}`);
                }
                else {
                    logger.warn(`⚠️ Invalid organizationId format: ${organizationId}, using as-is`);
                    query.organizationId = organizationId;
                }
            }
            catch (error) {
                logger.warn(`⚠️ Error converting organizationId to ObjectId: ${error.message}, using as-is`);
                query.organizationId = organizationId;
            }
        }
        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.licenseType) {
            query.organizationType = filters.licenseType; // licenseType maps to organizationType in the model
        }
        // Optimize query: only select necessary fields to reduce data transfer
        const licenses = await License.find(query)
            .select('licenseKey organizationId organizationType status expiresAt usageLimits currentUsage pricing issuedAt createdAt')
            .lean() // Use lean() for better performance (returns plain objects)
            .exec();
        return licenses;
    }
    async getLicenseByKey(licenseKey) {
        const license = await License.findOne({ licenseKey });
        if (!license) {
            throw new Error('License not found');
        }
        return license;
    }
    async validateLicense(organizationId) {
        // Convert string organizationId to ObjectId for proper querying
        let orgId = organizationId;
        try {
            if (mongoose.Types.ObjectId.isValid(organizationId)) {
                orgId = new mongoose.Types.ObjectId(organizationId);
            }
        }
        catch (error) {
            logger.warn(`⚠️ Error converting organizationId to ObjectId: ${error.message}, using as-is`);
        }
        const license = await License.findOne({
            organizationId: orgId,
            status: LicenseStatus.ACTIVE,
            expiresAt: { $gt: new Date() },
        });
        if (!license) {
            throw new Error('No valid license found');
        }
        // Check expiry
        if (new Date() > license.expiresAt) {
            license.status = LicenseStatus.EXPIRED;
            await license.save();
            throw new Error('License has expired');
        }
        return license;
    }
    async checkUsageLimit(organizationId, resource) {
        try {
            const license = await this.validateLicense(organizationId);
            const limit = license.usageLimits[resource] || 0;
            const current = license.currentUsage[resource] || 0;
            if (limit === 0) {
                return true; // No limit
            }
            return current < limit;
        }
        catch (error) {
            // If validateLicense throws "No valid license found", re-throw it
            if (error.message === 'No valid license found') {
                throw error;
            }
            // For other errors, log and allow (fail open)
            logger.warn(`License check failed for ${organizationId}, resource ${resource}:`, error.message);
            return true; // Allow creation if license check fails for other reasons
        }
    }
    async incrementUsage(organizationId, resource, amount = 1) {
        const license = await License.findOne({ organizationId });
        if (!license) {
            throw new Error('License not found');
        }
        const current = license.currentUsage[resource] || 0;
        license.currentUsage[resource] = current + amount;
        await license.save();
    }
    async decrementUsage(organizationId, resource, amount = 1) {
        const license = await License.findOne({ organizationId });
        if (!license) {
            throw new Error('License not found');
        }
        const current = license.currentUsage[resource] || 0;
        license.currentUsage[resource] = Math.max(0, current - amount);
        await license.save();
    }
    async updateLicenseStatus(licenseId, status) {
        const license = await License.findById(licenseId);
        if (!license) {
            throw new Error('License not found');
        }
        license.status = status;
        await license.save();
        return license;
    }
}
export const licenseService = new LicenseService();
//# sourceMappingURL=license.service.js.map