import React, { createContext, useContext, useState, useEffect, } from "react";
/* ---------------- CONTEXT ---------------- */
const AuthContext = createContext(undefined);
// API URL logic (unchanged)
const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "http://localhost:3000");
/* ---------------- PROVIDER ---------------- */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]); // 🔥 ADD
    const [loading, setLoading] = useState(true);
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
            const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
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
            let response = await fetch(`${API_URL}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // 🔁 Token expired → refresh
            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (!refreshed) {
                    cleanup();
                    return;
                }
                const newToken = localStorage.getItem("accessToken");
                response = await fetch(`${API_URL}/api/v1/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${newToken}`,
                    },
                });
            }
            if (response.ok) {
                const data = await response.json();
                // 🔥 IMPORTANT
                setUser(data.data.user);
                setPermissions(data.data.permissions || []);
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
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                portalType: "tech",
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }
        const data = await response.json();
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        // 🔥 SET AUTH STATE
        setUser(data.data.user);
        setPermissions(data.data.permissions || []);
    };
    /* ---------------- LOGOUT ---------------- */
    const logout = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            if (token) {
                try {
                    await fetch(`${API_URL}/api/v1/auth/logout`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ refreshToken: refreshToken || "" }),
                    });
                }
                catch {
                    // ignore API failure
                }
            }
        }
        finally {
            cleanup();
            window.location.href = "/login";
        }
    };
    /* ---------------- CLEANUP ---------------- */
    const cleanup = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setPermissions([]);
    };
    /* ---------------- PROVIDER ---------------- */
    return (<AuthContext.Provider value={{
            user,
            permissions, // 🔥 EXPOSE
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
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
//# sourceMappingURL=AuthContext.js.map