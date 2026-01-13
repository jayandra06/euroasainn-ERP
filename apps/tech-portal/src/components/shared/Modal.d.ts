/**
 * Ultra-Modern Modal Component
 * World-Class SaaS ERP Platform Design
 */
import React from 'react';
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}
export declare function Modal({ isOpen, onClose, title, children, size }: ModalProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=Modal.d.ts.map