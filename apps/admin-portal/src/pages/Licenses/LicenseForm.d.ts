import React from 'react';
interface License {
    _id: string;
    licenseKey: string;
    licenseType: 'customer' | 'vendor';
    status: string;
    organizationId: string;
    expiryDate: string;
    maxUsers: number;
    maxVessels?: number;
    maxItems?: number;
    features?: string[];
    pricing?: {
        monthlyPrice: number;
        yearlyPrice: number;
        currency: string;
    };
}
interface Organization {
    _id: string;
    name: string;
    type: string;
    portalType: string;
}
interface LicenseFormProps {
    license?: License;
    organizations: Organization[];
    organizationId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}
export declare function LicenseForm({ license, organizations, organizationId: preFilledOrgId, onSuccess, onCancel }: LicenseFormProps): React.JSX.Element;
export {};
//# sourceMappingURL=LicenseForm.d.ts.map