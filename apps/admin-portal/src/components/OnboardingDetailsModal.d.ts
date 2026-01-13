import React from 'react';
interface OnboardingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    organizationType: 'customer' | 'vendor';
    organizationName: string;
}
export declare function OnboardingDetailsModal({ isOpen, onClose, organizationId, organizationType, organizationName, }: OnboardingDetailsModalProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=OnboardingDetailsModal.d.ts.map