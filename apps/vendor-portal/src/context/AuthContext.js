import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const AuthContext = createContext(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        checkAuth();
    }, []);
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
            else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
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
                portalType: 'vendor',
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