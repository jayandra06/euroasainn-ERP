import React from 'react';
interface Organization {
    _id: string;
    name: string;
    type?: string;
}
interface OrganizationInvitationsModalProps {
    organization: Organization | null;
    isOpen: boolean;
    onClose: () => void;
    apiBasePath: string;
}
export declare function OrganizationInvitationsModal({ organization, isOpen, onClose, apiBasePath }: OrganizationInvitationsModalProps): React.JSX.Element;
export {};
//# sourceMappingURL=OrganizationInvitationsModal.d.ts.map