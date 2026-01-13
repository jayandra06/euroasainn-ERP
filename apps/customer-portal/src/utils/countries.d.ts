/**
 * Global Country List with Phone Codes
 * Comprehensive list of all countries with their ISO codes and phone country codes
 */
export interface Country {
    name: string;
    code: string;
    phoneCode: string;
    flag: string;
}
export declare const countries: Country[];
export declare const getCountryByName: (name: string) => Country | undefined;
export declare const getCountryCodeByName: (name: string) => string;
export declare const getCountryByPhoneCode: (phoneCode: string) => Country | undefined;
export declare const getCountryOptions: () => {
    value: string;
    label: string;
    phoneCode: string;
}[];
export declare const getCountryCodeOptions: () => {
    value: string;
    label: string;
    country: string;
}[];
export declare const usesIFSC: (country: string) => boolean;
export declare const getBankFieldLabel: (country: string) => string;
export declare const getBankFieldPlaceholder: (country: string) => string;
//# sourceMappingURL=countries.d.ts.map