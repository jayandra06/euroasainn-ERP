import { getCasbinEnforcer } from '../config/casbin';
import { logger } from '../config/logger';
export class CasbinService {
    async checkPermission(userId, resource, action) {
        try {
            const enforcer = await getCasbinEnforcer();
            const result = await enforcer.enforce(userId, resource, action);
            return result;
        }
        catch (error) {
            logger.error('CASBIN permission check error:', error);
            return false;
        }
    }
    async addPolicy(userId, resource, action) {
        try {
            const enforcer = await getCasbinEnforcer();
            return await enforcer.addPolicy(userId, resource, action);
        }
        catch (error) {
            logger.error('CASBIN add policy error:', error);
            return false;
        }
    }
    async removePolicy(userId, resource, action) {
        try {
            const enforcer = await getCasbinEnforcer();
            return await enforcer.removePolicy(userId, resource, action);
        }
        catch (error) {
            logger.error('CASBIN remove policy error:', error);
            return false;
        }
    }
    async getPoliciesForUser(userId) {
        try {
            const enforcer = await getCasbinEnforcer();
            return await enforcer.getPermissionsForUser(userId);
        }
        catch (error) {
            logger.error('CASBIN get policies error:', error);
            return [];
        }
    }
}
export const casbinService = new CasbinService();
//# sourceMappingURL=casbin.service.js.map