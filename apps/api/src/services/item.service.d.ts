import { IItem } from '../models/item.model';
export declare class ItemService {
    createItem(organizationId: string, data: Partial<IItem>): Promise<import("mongoose").Document<unknown, {}, IItem, {}, {}> & IItem & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getItems(organizationId: string, filters?: any): Promise<(import("mongoose").Document<unknown, {}, IItem, {}, {}> & IItem & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getItemById(itemId: string, organizationId: string): Promise<import("mongoose").Document<unknown, {}, IItem, {}, {}> & IItem & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateItem(itemId: string, organizationId: string, data: Partial<IItem>): Promise<import("mongoose").Document<unknown, {}, IItem, {}, {}> & IItem & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteItem(itemId: string, organizationId: string): Promise<{
        success: boolean;
    }>;
}
export declare const itemService: ItemService;
//# sourceMappingURL=item.service.d.ts.map