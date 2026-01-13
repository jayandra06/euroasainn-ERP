/**
 * Ultra-Modern Modal Component
 * Professional Admin Portal Design
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