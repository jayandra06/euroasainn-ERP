import { apiClient } from "./client";
export class AuthApi {
    /* ---------------- LOGIN ---------------- */
    async login(data) {
        const response = await apiClient.post("/auth/login", data);
        if (response.success && response.data) {
            apiClient.setAccessToken(response.data.accessToken);
            // 🔥 Persist tokens (session restore)
            if (typeof window !== "undefined") {
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
            }
            return response.data; // contains user + permissions
        }
        throw new Error(response.error || "Login failed");
    }
    /* ---------------- REFRESH TOKEN ---------------- */
    async refreshToken(data) {
        const response = await apiClient.post("/auth/refresh", data);
        if (response.success && response.data) {
            apiClient.setAccessToken(response.data.accessToken);
            return response.data;
        }
        throw new Error(response.error || "Token refresh failed");
    }
    /* ---------------- LOGOUT ---------------- */
    async logout(data) {
        await apiClient.post("/auth/logout", data);
        // 🔥 Clear tokens
        apiClient.setAccessToken(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
    }
    /* ---------------- ME ---------------- */
    async getMe() {
        const response = await apiClient.get("/auth/me");
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.error || "Failed to get user info");
    }
}
export const authApi = new AuthApi();
//# sourceMappingURL=auth.js.map