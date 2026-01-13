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
export declare function OrganizationInvitationsModal({ organization, isOpen, onClose, apiBasePath }: OrganizationInvitationsModalProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=OrganizationInvitationsModal.d.ts.map