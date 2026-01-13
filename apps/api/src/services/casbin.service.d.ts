export declare class CasbinService {
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    addPolicy(userId: string, resource: string, action: string): Promise<boolean>;
    removePolicy(userId: string, resource: string, action: string): Promise<boolean>;
    getPoliciesForUser(userId: string): Promise<string[][]>;
}
export declare const casbinService: CasbinService;
//# sourceMappingURL=casbin.service.d.ts.map