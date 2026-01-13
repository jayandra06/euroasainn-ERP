/**
 * SearchableSelect Component
 * A searchable dropdown with typeahead functionality
 */
import React from 'react';
export interface SearchableSelectOption {
    value: string;
    label: string;
}
interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: boolean;
    disabled?: boolean;
    required?: boolean;
    label?: string;
}
export declare function SearchableSelect({ options, value, onChange, placeholder, className, error, disabled, required, label, }: SearchableSelectProps): React.JSX.Element;
export {};
//# sourceMappingURL=SearchableSelect.d.ts.map