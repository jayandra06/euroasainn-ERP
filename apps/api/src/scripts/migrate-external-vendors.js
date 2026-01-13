/**
 * Migration script to update existing external vendors (invited by customers)
 * to have the correct invitedBy field set to 'customer'
 *
 * Run with: npx tsx apps/api/src/scripts/migrate-external-vendors.ts
 */
import { connectDatabase } from '../config/database';
import { Organization } from '../models/organization.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';
async function migrateExternalVendors() {
    try {
        await connectDatabase();
        logger.info('Starting migration to update external vendors...');
        // Find all vendor organizations that:
        // 1. Have invitedByOrganizationId (customer invited them) OR
        // 2. Have isAdminInvited === false and invitedBy is not 'admin' or 'tech'
        const vendors = await Organization.find({
            type: OrganizationType.VENDOR,
            portalType: PortalType.VENDOR,
        });
        let updatedCount = 0;
        let skippedCount = 0;
        for (const vendor of vendors) {
            const hasInvitedByOrgId = vendor.invitedByOrganizationId && vendor.invitedByOrganizationId.toString();
            const isExternalVendor = vendor.invitedBy === 'customer' ||
                hasInvitedByOrgId ||
                (vendor.isAdminInvited === false && vendor.invitedBy !== 'admin' && vendor.invitedBy !== 'tech');
            if (isExternalVendor && vendor.invitedBy !== 'customer') {
                // Update to mark as customer-invited
                vendor.invitedBy = 'customer';
                vendor.isAdminInvited = false;
                await vendor.save();
                updatedCount++;
                logger.info(`✅ Updated vendor: ${vendor.name} (ID: ${vendor._id}) - set invitedBy to 'customer'`);
            }
            else if (vendor.invitedBy === 'customer') {
                skippedCount++;
                logger.debug(`⏭️  Skipped vendor: ${vendor.name} - already has invitedBy='customer'`);
            }
            else {
                skippedCount++;
                logger.debug(`⏭️  Skipped vendor: ${vendor.name} - internal vendor (invitedBy: ${vendor.invitedBy || 'undefined'})`);
            }
        }
        logger.info(`\n✅ Migration complete!`);
        logger.info(`   Updated: ${updatedCount} external vendors`);
        logger.info(`   Skipped: ${skippedCount} vendors (already correct or internal)`);
        logger.info(`   Total: ${vendors.length} vendors processed`);
        process.exit(0);
    }
    catch (error) {
        logger.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
migrateExternalVendors();
//# sourceMappingURL=migrate-external-vendors.js.map