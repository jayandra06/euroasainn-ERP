/**
 * Organization Form Component
 * Professional Admin Portal Design
 */
import React from 'react';
interface Organization {
    _id?: string;
    name: string;
    type: string;
    portalType: string;
    isActive: boolean;
}
interface OrganizationFormProps {
    organization?: Organization | null;
    organizationType: 'customer' | 'vendor';
    onSuccess: () => void;
    onCancel: () => void;
}
export declare function OrganizationForm({ organization, organizationType, onSuccess, onCancel }: OrganizationFormProps): React.JSX.Element;
export {};
//# sourceMappingURL=OrganizationForm.d.ts.map