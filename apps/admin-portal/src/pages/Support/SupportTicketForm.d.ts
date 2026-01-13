/**
 * Support Ticket Form Component
 * Professional Admin Portal Design
 */
import React from 'react';
interface SupportTicket {
    _id?: string;
    ticketNumber?: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    organizationId?: string;
    organizationName?: string;
    assignedTo?: string;
}
interface SupportTicketFormProps {
    ticket?: SupportTicket | null;
    onSuccess: () => void;
    onCancel: () => void;
}
export declare function SupportTicketForm({ ticket, onSuccess, onCancel }: SupportTicketFormProps): React.JSX.Element;
export {};
//# sourceMappingURL=SupportTicketForm.d.ts.map