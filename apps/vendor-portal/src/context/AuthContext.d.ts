import React, { ReactNode } from 'react';
interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    portalType: string;
    role: string;
    organizationId?: string;
}
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=AuthContext.d.ts.map