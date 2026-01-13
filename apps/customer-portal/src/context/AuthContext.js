import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
const AuthContext = createContext(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    useEffect(() => {
        checkAuth();
    }, []);
    // Periodic user data refresh for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            if (localStorage.getItem('accessToken')) {
                checkAuth();
            }
        }, 60 * 1000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, []);
    // Listen for visibility change to refresh data when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && localStorage.getItem('accessToken')) {
                checkAuth();
                // Invalidate all queries to ensure fresh data
                queryClient.invalidateQueries();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [queryClient]);
    // Listen for localStorage changes (cross-tab token sync)
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'accessToken' && event.newValue) {
                // Token was updated in another tab, refresh user data
                checkAuth();
                queryClient.invalidateQueries();
            }
            else if (event.key === 'accessToken' && !event.newValue) {
                // Token was removed in another tab, clear user
                setUser(null);
                queryClient.clear();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [queryClient]);
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }
            const response = await fetch(`${API_URL}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.data);
            }
            else if (response.status === 401 || response.status === 403) {
                // Token is invalid, clear it
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setUser(null);
            }
            // For other errors (like 500), keep the user logged in if token exists
        }
        catch (error) {
            // Only log non-connection errors to avoid console spam
            if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Auth check error:', error);
            }
            // Don't clear tokens on connection errors - backend might just be starting up
            // Only clear if it's a real auth error
            if (error?.name === 'TypeError' && error?.message?.includes('Failed to fetch')) {
                // Connection error - backend might not be running, keep user state
                // This prevents clearing auth state when backend is temporarily unavailable
            }
            else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setUser(null);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                portalType: 'customer',
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        const data = await response.json();
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setUser(data.data.user);
    };
    const logout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            if (token && refreshToken) {
                await fetch(`${API_URL}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            navigate('/login');
        }
    };
    return (<AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
//# sourceMappingURL=AuthContext.js.map