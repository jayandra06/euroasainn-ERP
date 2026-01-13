/**
 * User Form Component
 * Professional Admin Portal Design
 */
import React from 'react';
interface User {
    _id?: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleId?: string | {
        _id: string;
        name: string;
        key: string;
    };
    organizationId?: string;
    isActive: boolean;
}
interface UserFormProps {
    user?: User | null;
    onSuccess: () => void;
    onCancel: () => void;
}
export declare function UserForm({ user, onSuccess, onCancel }: UserFormProps): React.JSX.Element;
export {};
//# sourceMappingURL=UserForm.d.ts.map