import { Item } from '../models/item.model';
import { licenseService } from './license.service';
export class ItemService {
    async createItem(organizationId, data) {
        // License validation removed - create item without license checks
        const item = new Item({
            ...data,
            organizationId,
        });
        await item.save();
        // Try to increment usage if license exists, but don't fail if it doesn't
        try {
            await licenseService.incrementUsage(organizationId, 'items');
        }
        catch (usageError) {
            // Log but don't fail item creation if usage increment fails
            console.warn('Failed to increment item usage (license may not exist):', usageError.message);
        }
        return item;
    }
    async getItems(organizationId, filters) {
        const query = { organizationId };
        if (filters?.category) {
            query.category = filters.category;
        }
        return await Item.find(query);
    }
    async getItemById(itemId, organizationId) {
        const item = await Item.findOne({ _id: itemId, organizationId });
        if (!item) {
            throw new Error('Item not found');
        }
        return item;
    }
    async updateItem(itemId, organizationId, data) {
        const item = await Item.findOne({ _id: itemId, organizationId });
        if (!item) {
            throw new Error('Item not found');
        }
        Object.assign(item, data);
        await item.save();
        return item;
    }
    async deleteItem(itemId, organizationId) {
        const item = await Item.findOneAndDelete({ _id: itemId, organizationId });
        if (!item) {
            throw new Error('Item not found');
        }
        await licenseService.decrementUsage(organizationId, 'items');
        return { success: true };
    }
}
export const itemService = new ItemService();
//# sourceMappingURL=item.service.js.map