import { createContext, useContext, useState, useEffect, } from "react";
import { useNavigate } from "react-router-dom";
/* ---------------- CONTEXT ---------------- */
const AuthContext = createContext(undefined);
const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "http://localhost:3000");
if (import.meta.env.DEV) {
    console.log("API_URL:", API_URL || "(empty - using Vite proxy)");
}
/* ---------------- PROVIDER ---------------- */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]); // Added
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    /* ---------------- REFRESH TOKEN ---------------- */
    const refreshToken = async () => {
        try {
            const refreshTokenValue = localStorage.getItem("refreshToken");
            if (!refreshTokenValue)
                return false;
            let url;
            if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
                url = "/api/v1/auth/refresh";
            }
            else {
                url = `${API_URL}/api/v1/auth/refresh`;
            }
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: refreshTokenValue }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("accessToken", data.data.accessToken);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error("Token refresh error:", error);
            return false;
        }
    };
    /* ---------------- CHECK AUTH (/me) ---------------- */
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setLoading(false);
                return;
            }
            let url;
            if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
                url = "/api/v1/auth/me";
            }
            else {
                url = `${API_URL}/api/v1/auth/me`;
            }
            let response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Token expired → try refresh
            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (!refreshed) {
                    cleanup();
                    return;
                }
                const newToken = localStorage.getItem("accessToken");
                if (!newToken) {
                    cleanup();
                    return;
                }
                response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${newToken}`,
                    },
                });
            }
            if (response.ok) {
                const data = await response.json();
                setUser(data.data.user);
                setPermissions(data.data.permissions || []); // Set permissions
            }
            else {
                cleanup();
            }
        }
        catch (error) {
            console.error("Auth check error:", error);
            cleanup();
        }
        finally {
            setLoading(false);
        }
    };
    /* ---------------- LOGIN ---------------- */
    const login = async (email, password) => {
        try {
            let url;
            if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
                url = "/api/v1/auth/login";
            }
            else {
                url = `${API_URL}/api/v1/auth/login`;
            }
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    portalType: "admin",
                }),
            });
            if (!response.ok) {
                let errorMessage = "Login failed";
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                }
                catch {
                    errorMessage = response.statusText || `HTTP ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            if (!data.success || !data.data) {
                throw new Error("Invalid response from server");
            }
            localStorage.setItem("accessToken", data.data.accessToken);
            localStorage.setItem("refreshToken", data.data.refreshToken);
            setUser(data.data.user);
            setPermissions(data.data.permissions || []); // Set permissions on login
        }
        catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Unable to connect to server. Please check if the API is running.");
            }
            throw error;
        }
    };
    /* ---------------- LOGOUT ---------------- */
    const logout = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const refreshTokenValue = localStorage.getItem("refreshToken");
            if (token && refreshTokenValue) {
                let url;
                if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
                    url = "/api/v1/auth/logout";
                }
                else {
                    url = `${API_URL}/api/v1/auth/logout`;
                }
                await fetch(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken: refreshTokenValue }),
                });
            }
        }
        catch (error) {
            console.error("Logout error:", error);
        }
        finally {
            cleanup();
            navigate("/login");
        }
    };
    /* ---------------- CLEANUP ---------------- */
    const cleanup = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setPermissions([]);
    };
    /* ---------------- PROVIDER VALUE ---------------- */
    return (<AuthContext.Provider value={{
            user,
            permissions, // Now exposed!
            loading,
            login,
            logout,
            isAuthenticated: !!user,
        }}>
      {children}
    </AuthContext.Provider>);
}
/* ---------------- HOOK ---------------- */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
//# sourceMappingURL=AuthContext.js.map