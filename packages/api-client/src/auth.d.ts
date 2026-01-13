import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, LogoutRequest } from "./types";
export declare class AuthApi {
    login(data: LoginRequest): Promise<LoginResponse>;
    refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse>;
    logout(data: LogoutRequest): Promise<void>;
    getMe(): Promise<{
        user: any;
        permissions: string[];
    }>;
}
export declare const authApi: AuthApi;
//# sourceMappingURL=auth.d.ts.map