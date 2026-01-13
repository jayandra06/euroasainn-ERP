/**
 * Ultra-Modern User Form Component
 * World-Class SaaS ERP Platform Design
 */
import React from 'react';
interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    portalType: string;
    role: string;
    roleId?: string | {
        _id: string;
        name: string;
        key: string;
        permissions?: string[];
    };
    isActive: boolean;
    organizationId?: string;
}
interface UserFormProps {
    user?: User | null;
    onSuccess: () => void;
    onCancel: () => void;
    defaultInviteMode?: boolean;
}
export declare function UserForm({ user, onSuccess, onCancel }: UserFormProps): React.JSX.Element;
export {};
//# sourceMappingURL=UserForm.d.ts.map