export declare class AuthService {
    login(email: string, password: string, portalType: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            _id: unknown;
            email: string;
            firstName: string;
            lastName: string;
            portalType: import("../../../../packages/shared/src/types/index").PortalType;
            role: string;
            roleName: string;
            organizationId: import("mongoose").Types.ObjectId;
        };
        permissions: string[];
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        _id: import("mongoose").FlattenMaps<unknown>;
        email: string;
        firstName: string;
        lastName: string;
        phone: any;
        portalType: import("../../../../packages/shared/src/types/index").PortalType;
        role: string;
        roleName: string;
        organizationId: import("mongoose").Types.ObjectId;
        isActive: boolean;
        lastLogin: Date | undefined;
        createdAt: Date;
    }>;
    logout(token: string, refreshToken: string): Promise<{
        success: boolean;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map